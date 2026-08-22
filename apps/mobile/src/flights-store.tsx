import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { AppState } from 'react-native';
import type { Flight } from '@police/shared';
import { todayAtAirport } from '@police/shared';
import { fetchOperatingDay } from './api';
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

/**
 * Confrontation entre la journée du serveur et celle de l'appareil.
 *
 * Sert à afficher le désaccord plutôt qu'à le subir : un PDA dont la date
 * dérive demandait les vols d'un autre jour et recevait une liste cohérente
 * mais fausse, sans que rien ne le signale.
 */
export interface ClockCheck {
  /** Journée retenue pour la liste affichée. */
  day: string;
  /** Journée calculée par le serveur. null si l'API est injoignable. */
  serverDay: string | null;
  /** Journée calculée par l'horloge de l'appareil. */
  deviceDay: string;
  /**
   * Écart entre l'horloge de l'appareil et celle du serveur, en millisecondes.
   * Inclut le temps d'aller-retour réseau, négligeable au regard des écarts
   * qu'on cherche à repérer (des minutes, souvent des heures). null si l'API
   * n'a pas répondu.
   */
  driftMs: number | null;
}

const UNKNOWN_CLOCK: ClockCheck = { day: '', serverDay: null, deviceDay: '', driftMs: null };

interface FlightsState {
  flights: Flight[];
  loading: boolean;
  /** État de l'horloge à la dernière synchronisation. */
  clock: ClockCheck;
  getFlight: (id: string) => Flight | undefined;
  statsFor: (id: string) => FlightStats;
  refresh: () => Promise<void>;
  refreshStatsFor: (id: string) => Promise<void>;
}

const FlightsContext = createContext<FlightsState | undefined>(undefined);

// La liste des vols proposée à l'agent est celle de la journée d'exploitation
// de SON aéroport. Elle est demandée au serveur : l'horloge d'un PDA de terrain
// n'est pas une source de vérité, et un appareil qui dérive travaillait sur les
// vols d'un autre jour sans que personne ne s'en aperçoive. Repli sur l'horloge
// locale si l'API ne répond pas, mieux vaut la liste d'hier que pas de liste.

/** Clé de tri des vols : heure de départ croissante, sans horaire en dernier. */
function departureKey(f: Flight): string {
  return f.departure_time ?? '9999';
}

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
 *
 * Renvoie null en cas d'échec — JAMAIS un objet vide. Un réseau mobile qui
 * lâche une requête faisait retomber tous les compteurs à zéro en silence : le
 * PDA affichait « 0 pax » sur un vol plein, et le temps réel repartait de zéro.
 * L'appelant décide quoi faire d'un échec (garder le cache, réessayer).
 */
async function fetchAllStats(date: string): Promise<Record<string, FlightStats> | null> {
  const { data, error } = await supabase.rpc('flight_stats_for_date', { d: date });
  if (error || !data) return null;
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

/** Stats d'un seul vol (rafraîchissement ciblé après un scan). Mêmes exclusions
 * que la RPC : bagages passagers hors annulés, passagers hors débarqués.
 * null en cas d'échec réseau : on garde alors les chiffres déjà affichés. */
async function fetchStats(flightId: string): Promise<FlightStats | null> {
  const [p, bt, bo, brd] = await Promise.all([
    supabase.from('passengers').select('id', { count: 'exact', head: true }).eq('flight_id', flightId).eq('offloaded', false),
    supabase.from('baggage').select('id', { count: 'exact', head: true }).eq('flight_id', flightId).eq('kind', 'passenger').eq('cancelled', false),
    supabase
      .from('baggage')
      .select('id', { count: 'exact', head: true })
      .eq('flight_id', flightId)
      .eq('kind', 'passenger')
      .eq('cancelled', false)
      .eq('is_confirmed', true),
    supabase
      .from('passengers')
      .select('id', { count: 'exact', head: true })
      .eq('flight_id', flightId)
      .eq('offloaded', false)
      .eq('boarded', true),
  ]);
  if (p.error || bt.error || bo.error || brd.error) return null;
  return { pax: p.count ?? 0, bagTotal: bt.count ?? 0, bagOk: bo.count ?? 0, boarded: brd.count ?? 0 };
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
  const [clock, setClock] = useState<ClockCheck>(UNKNOWN_CLOCK);
  // Identifiants des vols connus, pour ne réagir qu'aux événements pertinents.
  const flightIds = useRef<Set<string>>(new Set());
  // Journée affichée, lisible depuis les gestionnaires temps réel sans les
  // réabonner à chaque changement de date.
  const dayRef = useRef<string>('');

  const refreshStats = useCallback(async (id: string) => {
    const s = await fetchStats(id);
    // Échec réseau : on garde les chiffres affichés plutôt que des zéros.
    if (s) setStats((prev) => ({ ...prev, [id]: s }));
  }, []);

  const refresh = useCallback(async () => {
    if (!session) return;

    // Quel jour est-il à l'aéroport ? On demande au serveur, et on garde
    // l'horloge de l'appareil comme repli, pas comme référence.
    const deviceDay = todayAtAirport(profile?.airport_code);
    let serverDay: string | null = null;
    let driftMs: number | null = null;
    try {
      const answer = await fetchOperatingDay();
      serverDay = answer.day;
      driftMs = Date.now() - new Date(answer.serverTime).getTime();
    } catch {
      // API injoignable : on continue sur l'horloge locale, comportement d'avant.
    }
    const day = serverDay ?? deviceDay;

    dayRef.current = day;
    setClock({ day, serverDay, deviceDay, driftMs });

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
    // Si elle échoue (réseau qui lâche UNE requête), on ne laisse pas des
    // zéros : repli vol par vol, et ce qui échoue encore garde son cache.
    const bulk = await fetchAllStats(day);
    if (bulk) {
      setStats(bulk);
    } else {
      const perFlight = await Promise.all(list.map(async (f) => [f.id, await fetchStats(f.id)] as const));
      setStats((prev) => {
        const next = { ...prev };
        for (const [id, s] of perFlight) if (s) next[id] = s;
        return next;
      });
    }
  }, [session, profile?.airport_code]);

  // Charge à la connexion, vide à la déconnexion.
  useEffect(() => {
    if (!session) {
      setFlights([]);
      setStats({});
      setClock(UNKNOWN_CLOCK);
      flightIds.current = new Set();
      dayRef.current = '';
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

        // Contribution d'une ligne aux compteurs : mêmes exclusions que la RPC.
        // Un passager débarqué ou un bagage annulé / expédition rush ne compte
        // pas ; on calcule la contribution avant / après pour rester exact sur
        // les transitions (annulation, débarquement).
        const paxIn = (r: Record<string, unknown> | null) => Boolean(r) && r!.offloaded !== true;
        const bagIn = (r: Record<string, unknown> | null) =>
          Boolean(r) && r!.kind !== 'rush_forward' && r!.cancelled !== true;

        if (table === 'passengers') {
          const before = payload.eventType === 'INSERT' ? null : od;
          const after = payload.eventType === 'DELETE' ? null : nw;
          pax += (paxIn(after) ? 1 : 0) - (paxIn(before) ? 1 : 0);
          boarded +=
            (paxIn(after) && after?.boarded === true ? 1 : 0) - (paxIn(before) && before?.boarded === true ? 1 : 0);
        } else {
          const before = payload.eventType === 'INSERT' ? null : od;
          const after = payload.eventType === 'DELETE' ? null : nw;
          bagTotal += (bagIn(after) ? 1 : 0) - (bagIn(before) ? 1 : 0);
          bagOk +=
            (bagIn(after) && after?.is_confirmed === true ? 1 : 0) -
            (bagIn(before) && before?.is_confirmed === true ? 1 : 0);
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
      // Un vol créé par le superviseur en cours de journée n'apparaissait
      // jamais : seules les modifications étaient écoutées. L'agent voyait une
      // liste d'apparence normale, à laquelle il manquait son vol.
      // Le cloisonnement par aéroport s'applique aussi aux événements temps
      // réel ; on ne garde en plus que la journée affichée, pour ne pas voir
      // surgir un vol de demain préparé à l'avance.
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'flights' }, (payload) => {
        const created = payload.new as Flight;
        if (!created?.id || created.date !== dayRef.current) return;
        flightIds.current.add(created.id);
        setFlights((prev) =>
          prev.some((f) => f.id === created.id)
            ? prev
            : [...prev, created].sort((a, b) => departureKey(a).localeCompare(departureKey(b))),
        );
      })
      // Vol supprimé : on ne retire que ce qu'on affiche déjà. La suppression
      // ne transporte que la clé primaire, donc pas de quoi vérifier le
      // périmètre — se limiter aux vols connus revient au même, ils sont déjà
      // passés par la policy de lecture.
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'flights' }, (payload) => {
        const removed = (payload.old as { id?: string } | null)?.id;
        if (!removed || !flightIds.current.has(removed)) return;
        flightIds.current.delete(removed);
        setFlights((prev) => prev.filter((f) => f.id !== removed));
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

  // Retour de l'app au premier plan. Un PDA posé sur un comptoir rouvrait sur
  // les données de plusieurs heures plus tôt, et personne ne pense à tirer la
  // liste. C'est aussi ce qui fait basculer la journée après minuit.
  useEffect(() => {
    if (!session) return;
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') void refresh();
    });
    return () => sub.remove();
  }, [session, refresh]);

  // Filet de sécurité : certains réseaux tuent le websocket temps réel sans
  // bruit, et plus aucun événement n'arrive. Toutes les 60 s, app au premier
  // plan, on recharge les stats agrégées (UNE requête) ; un échec garde le
  // cache. Chaque PDA reste ainsi cohérent même quand le temps réel est mort.
  useEffect(() => {
    if (!session) return;
    const id = setInterval(() => {
      if (AppState.currentState !== 'active' || !dayRef.current) return;
      void (async () => {
        const bulk = await fetchAllStats(dayRef.current);
        if (bulk) setStats(bulk);
      })();
    }, 60_000);
    return () => clearInterval(id);
  }, [session]);

  const getFlight = useCallback((id: string) => flights.find((f) => f.id === id), [flights]);
  const statsFor = useCallback((id: string) => stats[id] ?? EMPTY_STATS, [stats]);

  return (
    <FlightsContext.Provider
      value={{ flights, loading, clock, getFlight, statsFor, refresh, refreshStatsFor: refreshStats }}
    >
      {children}
    </FlightsContext.Provider>
  );
}

export function useFlights(): FlightsState {
  const ctx = useContext(FlightsContext);
  if (!ctx) throw new Error('useFlights doit être utilisé dans FlightsProvider');
  return ctx;
}
