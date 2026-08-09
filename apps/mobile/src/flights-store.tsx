import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import type { Flight } from '@police/shared';
import { todayAtAirport } from '@police/shared';
import { useAuth } from './auth';
import { supabase } from './supabase';

/** Statistiques agrégées d'un vol (préchargées et mises en cache). */
export interface FlightStats {
  pax: number;
  bagTotal: number;
  bagOk: number;
  boarded: number;
}

const EMPTY_STATS: FlightStats = { pax: 0, bagTotal: 0, bagOk: 0, boarded: 0 };

interface FlightsState {
  flights: Flight[];
  loading: boolean;
  getFlight: (id: string) => Flight | undefined;
  statsFor: (id: string) => FlightStats;
  refresh: () => Promise<void>;
  refreshStatsFor: (id: string) => Promise<void>;
}

const FlightsContext = createContext<FlightsState | undefined>(undefined);

// La liste des vols proposée à l'agent est celle de la journée d'exploitation
// de SON aéroport. toISOString() renvoyait la date UTC : à Kinshasa (UTC+1),
// entre 00h00 et 01h00, le PDA proposait encore les vols de la veille et un
// scan pouvait partir sur le mauvais vol.

/** Ligne renvoyée par la RPC flight_stats_for_date. */
interface StatsRow {
  flight_id: string;
  pax: number;
  bag_total: number;
  bag_ok: number;
  boarded: number;
}

/**
 * Stats de TOUS les vols du jour en UNE seule requête (RPC agrégée), au lieu de
 * 4 requêtes count par vol. Clé de la scalabilité multi-agents.
 */
async function fetchAllStats(date: string): Promise<Record<string, FlightStats>> {
  const { data, error } = await supabase.rpc('flight_stats_for_date', { d: date });
  if (error || !data) return {};
  const out: Record<string, FlightStats> = {};
  for (const r of data as StatsRow[]) {
    out[r.flight_id] = {
      pax: Number(r.pax) || 0,
      bagTotal: Number(r.bag_total) || 0,
      bagOk: Number(r.bag_ok) || 0,
      boarded: Number(r.boarded) || 0,
    };
  }
  return out;
}

/** Stats d'un seul vol (rafraîchissement ciblé après un scan). */
async function fetchStats(flightId: string): Promise<FlightStats> {
  const [{ count: p }, { count: bt }, { count: bo }, { count: brd }] = await Promise.all([
    supabase.from('passengers').select('id', { count: 'exact', head: true }).eq('flight_id', flightId),
    supabase.from('baggage').select('id', { count: 'exact', head: true }).eq('flight_id', flightId),
    supabase.from('baggage').select('id', { count: 'exact', head: true }).eq('flight_id', flightId).eq('is_confirmed', true),
    supabase.from('passengers').select('id', { count: 'exact', head: true }).eq('flight_id', flightId).eq('boarded', true),
  ]);
  return { pax: p ?? 0, bagTotal: bt ?? 0, bagOk: bo ?? 0, boarded: brd ?? 0 };
}

/** Événement realtime minimal (postgres_changes). */
interface ChangePayload {
  eventType: 'INSERT' | 'UPDATE' | 'DELETE';
  new: Record<string, unknown> | null;
  old: Record<string, unknown> | null;
}

const clamp0 = (n: number) => (n < 0 ? 0 : n);

export function FlightsProvider({ children }: { children: ReactNode }) {
  const { session, profile } = useAuth();
  const [flights, setFlights] = useState<Flight[]>([]);
  const [stats, setStats] = useState<Record<string, FlightStats>>({});
  const [loading, setLoading] = useState(true);
  // Identifiants des vols connus, pour ne réagir qu'aux événements pertinents.
  const flightIds = useRef<Set<string>>(new Set());

  const refreshStats = useCallback(async (id: string) => {
    const s = await fetchStats(id);
    setStats((prev) => ({ ...prev, [id]: s }));
  }, []);

  const refresh = useCallback(async () => {
    if (!session) return;
    const day = todayAtAirport(profile?.airport_code);
    const { data } = await supabase
      .from('flights')
      .select('*')
      .eq('date', day)
      .order('departure_time', { ascending: true });
    const list = (data as Flight[] | null) ?? [];
    setFlights(list);
    flightIds.current = new Set(list.map((f) => f.id));
    setLoading(false);
    // Toutes les stats du jour en UNE requête (au lieu de 4 × nombre de vols).
    setStats(await fetchAllStats(day));
  }, [session, profile?.airport_code]);

  // Charge à la connexion, vide à la déconnexion.
  useEffect(() => {
    if (!session) {
      setFlights([]);
      setStats({});
      flightIds.current = new Set();
      setLoading(false);
      return;
    }
    setLoading(true);
    void refresh();
  }, [session, refresh]);

  // Realtime : comptage INCRÉMENTAL local (delta), sans jamais re-interroger la
  // base. Un événement = une mise à jour d'état O(1) — supprime l'amplification
  // O(N²) où chaque agent refetchait à chaque scan de n'importe quel agent.
  useEffect(() => {
    if (!session) return;

    const applyDelta = (table: 'passengers' | 'baggage', payload: ChangePayload) => {
      const nw = payload.new;
      const od = payload.old;
      const fid = (nw?.flight_id ?? od?.flight_id) as string | undefined;
      if (!fid || !flightIds.current.has(fid)) return;

      setStats((prev) => {
        const cur = prev[fid] ?? EMPTY_STATS;
        let { pax, bagTotal, bagOk, boarded } = cur;

        if (table === 'passengers') {
          if (payload.eventType === 'INSERT') {
            pax += 1;
            if (nw?.boarded === true) boarded += 1;
          } else if (payload.eventType === 'DELETE') {
            pax -= 1;
            if (od?.boarded === true) boarded -= 1;
          } else {
            if (od?.boarded !== true && nw?.boarded === true) boarded += 1;
            else if (od?.boarded === true && nw?.boarded !== true) boarded -= 1;
          }
        } else {
          if (payload.eventType === 'INSERT') {
            bagTotal += 1;
            if (nw?.is_confirmed === true) bagOk += 1;
          } else if (payload.eventType === 'DELETE') {
            bagTotal -= 1;
            if (od?.is_confirmed === true) bagOk -= 1;
          } else {
            if (od?.is_confirmed !== true && nw?.is_confirmed === true) bagOk += 1;
            else if (od?.is_confirmed === true && nw?.is_confirmed !== true) bagOk -= 1;
          }
        }

        return {
          ...prev,
          [fid]: { pax: clamp0(pax), bagTotal: clamp0(bagTotal), bagOk: clamp0(bagOk), boarded: clamp0(boarded) },
        };
      });
    };

    const channel = supabase
      .channel('flights-store')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'passengers' }, (p) =>
        applyDelta('passengers', p as unknown as ChangePayload),
      )
      .on('postgres_changes', { event: '*', schema: 'public', table: 'baggage' }, (p) =>
        applyDelta('baggage', p as unknown as ChangePayload),
      )
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'flights' }, (payload) => {
        const updated = payload.new as Flight;
        if (updated?.id && flightIds.current.has(updated.id)) {
          setFlights((prev) => prev.map((f) => (f.id === updated.id ? updated : f)));
        }
      })
      .subscribe((status) => {
        // À la (re)connexion du canal, on réconcilie avec des compteurs
        // autoritatifs (rattrape les événements manqués pendant une coupure).
        if (status === 'SUBSCRIBED') void refresh();
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [session, refresh]);

  const getFlight = useCallback((id: string) => flights.find((f) => f.id === id), [flights]);
  const statsFor = useCallback((id: string) => stats[id] ?? EMPTY_STATS, [stats]);

  return (
    <FlightsContext.Provider value={{ flights, loading, getFlight, statsFor, refresh, refreshStatsFor: refreshStats }}>
      {children}
    </FlightsContext.Provider>
  );
}

export function useFlights(): FlightsState {
  const ctx = useContext(FlightsContext);
  if (!ctx) throw new Error('useFlights doit être utilisé dans FlightsProvider');
  return ctx;
}
