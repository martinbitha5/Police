import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { AppState } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
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
  /**
   * Les compteurs de la journée affichée sont connus (cache ou base). Tant que
   * c'est faux, un écran montre un squelette à la place des chiffres : un zéro
   * qui n'en est pas un est pire qu'une case vide.
   */
  statsReady: boolean;
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

/**
 * Dernière liste connue, gardée sur l'appareil.
 *
 * À l'ouverture, l'écran affichait une liste sans compteurs pendant trois
 * allers-retours réseau (journée serveur, vols, compteurs). Le cache montre
 * tout de suite ce qu'on savait la dernière fois, et la base corrige ensuite.
 * Il est lié à l'agent et à la journée : un PDA prêté à un collègue, ou rouvert
 * le lendemain, n'affiche jamais les vols d'un autre.
 */
interface FlightsCache {
  userId: string;
  day: string;
  flights: Flight[];
  stats: Record<string, FlightStats>;
}

const CACHE_KEY = 'flights-store.cache';

async function readFlightsCache(userId: string): Promise<FlightsCache | null> {
  try {
    const raw = await AsyncStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const cached = JSON.parse(raw) as FlightsCache;
    return cached.userId === userId ? cached : null;
  } catch {
    return null;
  }
}

async function writeFlightsCache(cache: FlightsCache): Promise<void> {
  try {
    await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  } catch {
    // Stockage indisponible : l'écran repartira du réseau la prochaine fois.
  }
}

/** Vols d'une journée, triés par heure de départ. null si la requête échoue. */
async function fetchFlights(day: string): Promise<Flight[] | null> {
  const { data, error } = await supabase
    .from('flights')
    .select('*')
    .eq('date', day)
    .order('departure_time', { ascending: true });
  if (error) return null;
  return (data as Flight[] | null) ?? [];
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
  const [statsReady, setStatsReady] = useState(false);
  const [clock, setClock] = useState<ClockCheck>(UNKNOWN_CLOCK);
  // Identifiants des vols connus, pour ne réagir qu'aux événements pertinents.
  const flightIds = useRef<Set<string>>(new Set());
  // Journée affichée, lisible depuis les gestionnaires temps réel sans les
  // réabonner à chaque changement de date.
  const dayRef = useRef<string>('');
  // Un rafraîchissement à la fois : l'abonnement temps réel et le retour au
  // premier plan en déclenchent souvent un pendant que celui du login court
  // encore, et deux jeux de requêtes identiques ne servent à rien.
  const refreshing = useRef(false);
  const userId = session?.user.id ?? null;

  const refreshStats = useCallback(async (id: string) => {
    const s = await fetchStats(id);
    // Échec réseau : on garde les chiffres affichés plutôt que des zéros.
    if (s) setStats((prev) => ({ ...prev, [id]: s }));
  }, []);

  /** Applique une journée chargée à l'état, et la garde sur l'appareil. */
  const applyDay = useCallback(
    (day: string, list: Flight[], bulk: Record<string, FlightStats> | null) => {
      dayRef.current = day;
      setFlights(list);
      flightIds.current = new Set(list.map((f) => f.id));
      setLoading(false);
      if (bulk) {
        setStats(bulk);
        setStatsReady(true);
        if (userId) void writeFlightsCache({ userId, day, flights: list, stats: bulk });
      }
    },
    [userId],
  );

  const refresh = useCallback(async () => {
    if (!session || refreshing.current) return;
    refreshing.current = true;
    try {
      // Quel jour est-il à l'aéroport ? On demande au serveur, et on garde
      // l'horloge de l'appareil comme repli, pas comme référence.
      //
      // Mais on n'attend pas sa réponse pour charger : la journée de
      // l'appareil est la bonne dans l'immense majorité des cas, donc vols et
      // compteurs partent en même temps que la question. Si le serveur
      // répond une autre journée, on recharge pour celle-là. Trois
      // allers-retours en série deviennent un seul, et l'écran l'attend
      // d'autant moins.
      const deviceDay = todayAtAirport(profile?.airport_code);
      const [answer, list, bulk] = await Promise.all([
        fetchOperatingDay().catch(() => null),
        fetchFlights(deviceDay),
        fetchAllStats(deviceDay),
      ]);

      const serverDay = answer?.day ?? null;
      const driftMs = answer ? Date.now() - new Date(answer.serverTime).getTime() : null;
      const day = serverDay ?? deviceDay;
      setClock({ day, serverDay, deviceDay, driftMs });

      let dayList = list;
      let dayBulk = bulk;
      if (day !== deviceDay) {
        [dayList, dayBulk] = await Promise.all([fetchFlights(day), fetchAllStats(day)]);
      }

      // Liste injoignable : on garde ce qu'on affiche (cache ou état
      // précédent) plutôt que de vider l'écran.
      if (!dayList) {
        setLoading(false);
        return;
      }
      applyDay(day, dayList, dayBulk);

      // Compteurs groupés en échec (réseau qui lâche UNE requête) : repli vol
      // par vol, et ce qui échoue encore garde son cache.
      if (!dayBulk) {
        const perFlight = await Promise.all(
          dayList.map(async (f) => [f.id, await fetchStats(f.id)] as const),
        );
        setStats((prev) => {
          const next = { ...prev };
          for (const [id, s] of perFlight) if (s) next[id] = s;
          return next;
        });
        if (perFlight.some(([, s]) => s)) setStatsReady(true);
      }
    } finally {
      refreshing.current = false;
    }
  }, [session, profile?.airport_code, applyDay]);

  // Charge à la connexion, vide à la déconnexion. Le cache de l'appareil est
  // affiché d'abord, s'il porte sur la journée en cours ; la base corrige
  // ensuite.
  useEffect(() => {
    if (!session || !userId) {
      setFlights([]);
      setStats({});
      setStatsReady(false);
      setClock(UNKNOWN_CLOCK);
      flightIds.current = new Set();
      dayRef.current = '';
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setStatsReady(false);
    void (async () => {
      const cached = await readFlightsCache(userId);
      if (cancelled) return;
      if (cached && cached.day === todayAtAirport(profile?.airport_code)) {
        applyDay(cached.day, cached.flights, cached.stats);
      }
      await refresh();
    })();
    return () => {
      cancelled = true;
    };
  }, [session, userId, profile?.airport_code, refresh, applyDay]);

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
        // Au démarrage, le chargement du login est encore en cours et
        // `refresh` s'écarte de lui-même.
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
        if (bulk) {
          setStats(bulk);
          setStatsReady(true);
        }
      })();
    }, 60_000);
    return () => clearInterval(id);
  }, [session]);

  const getFlight = useCallback((id: string) => flights.find((f) => f.id === id), [flights]);
  const statsFor = useCallback((id: string) => stats[id] ?? EMPTY_STATS, [stats]);

  return (
    <FlightsContext.Provider
      value={{ flights, loading, statsReady, clock, getFlight, statsFor, refresh, refreshStatsFor: refreshStats }}
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
