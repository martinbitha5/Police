import { useCallback, useEffect, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { airportTimeZone } from '@police/shared';
import { useAuth } from './auth';
import { supabase } from './supabase';

/** Périodes glissantes proposées à l'agent, dans l'ordre d'affichage. */
export const STAT_PERIODS = ['day', 'week', 'month', 'year'] as const;
export type StatPeriod = (typeof STAT_PERIODS)[number];

export const PERIOD_LABEL: Record<StatPeriod, string> = {
  day: 'Jour',
  week: 'Semaine',
  month: 'Mois',
  year: 'Année',
};

/** Ce que l'agent a fait, face à ce que sa station a fait, sur une période. */
export interface AgentPeriodStats {
  flightsMine: number;
  flightsTotal: number;
  paxMine: number;
  paxTotal: number;
  bagsMine: number;
  bagsTotal: number;
}

export type AgentStats = Record<StatPeriod, AgentPeriodStats>;

/** Ligne renvoyée par la RPC agent_stats. */
interface StatsRow {
  period: string;
  flights_mine: number;
  flights_total: number;
  pax_mine: number;
  pax_total: number;
  bags_mine: number;
  bags_total: number;
}

const EMPTY_PERIOD: AgentPeriodStats = {
  flightsMine: 0,
  flightsTotal: 0,
  paxMine: 0,
  paxTotal: 0,
  bagsMine: 0,
  bagsTotal: 0,
};

const CACHE_KEY = 'agent-stats.cache';

/**
 * Statistiques personnelles en UNE requête (RPC agrégée, jamais un comptage de
 * lignes côté client : PostgREST tronque à 1000 en silence).
 *
 * null en cas d'échec, jamais des zéros : un réseau qui lâche ne doit pas
 * afficher « 0 vol » à un agent qui en a traité douze.
 */
async function fetchAgentStats(airportCode: string | null | undefined): Promise<AgentStats | null> {
  const { data, error } = await supabase.rpc('agent_stats', { tz: airportTimeZone(airportCode) });
  if (error || !data) return null;

  const out: AgentStats = {
    day: EMPTY_PERIOD,
    week: EMPTY_PERIOD,
    month: EMPTY_PERIOD,
    year: EMPTY_PERIOD,
  };
  for (const r of data as StatsRow[]) {
    if (!STAT_PERIODS.includes(r.period as StatPeriod)) continue;
    out[r.period as StatPeriod] = {
      flightsMine: Number(r.flights_mine) || 0,
      flightsTotal: Number(r.flights_total) || 0,
      paxMine: Number(r.pax_mine) || 0,
      paxTotal: Number(r.pax_total) || 0,
      bagsMine: Number(r.bags_mine) || 0,
      bagsTotal: Number(r.bags_total) || 0,
    };
  }
  return out;
}

interface CachedStats {
  userId: string;
  stats: AgentStats;
}

async function readCache(userId: string): Promise<AgentStats | null> {
  try {
    const raw = await AsyncStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const cached = JSON.parse(raw) as CachedStats;
    // Un PDA passe de main en main : le cache d'un autre agent ne vaut rien.
    return cached.userId === userId ? cached.stats : null;
  } catch {
    return null;
  }
}

async function writeCache(userId: string, stats: AgentStats): Promise<void> {
  try {
    await AsyncStorage.setItem(CACHE_KEY, JSON.stringify({ userId, stats } satisfies CachedStats));
  } catch {
    // Stockage indisponible : on affichera depuis le réseau la prochaine fois.
  }
}

export interface AgentStatsState {
  stats: AgentStats | null;
  /** Aucune donnée encore affichable (ni cache, ni réseau). */
  loading: boolean;
  /** Le dernier rafraîchissement a échoué ; `stats` peut être un cache. */
  error: boolean;
  refresh: () => Promise<void>;
}

/**
 * Statistiques de l'agent connecté, affichées d'abord depuis le cache de
 * l'appareil puis rafraîchies depuis la base. L'écran n'attend donc pas le
 * réseau pour montrer quelque chose.
 */
export function useAgentStats(): AgentStatsState {
  const { session, profile } = useAuth();
  const userId = session?.user.id ?? null;
  const airportCode = profile?.airport_code;
  const [stats, setStats] = useState<AgentStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const inFlight = useRef(false);

  const refresh = useCallback(async () => {
    if (!userId || inFlight.current) return;
    inFlight.current = true;
    try {
      const fresh = await fetchAgentStats(airportCode);
      if (fresh) {
        setStats(fresh);
        setError(false);
        void writeCache(userId, fresh);
      } else {
        setError(true);
      }
    } finally {
      inFlight.current = false;
      setLoading(false);
    }
  }, [userId, airportCode]);

  useEffect(() => {
    if (!userId) {
      setStats(null);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    void (async () => {
      const cached = await readCache(userId);
      if (cancelled) return;
      if (cached) {
        setStats(cached);
        setLoading(false);
      }
      await refresh();
    })();
    return () => {
      cancelled = true;
    };
  }, [userId, refresh]);

  return { stats, loading, error, refresh };
}
