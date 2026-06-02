import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import type { Flight } from '@police/shared';
import { useAuth } from './auth';
import { supabase } from './supabase';

/** Statistiques agrégées d'un vol (préchargées et mises en cache). */
export interface FlightStats {
  pax: number;
  bagTotal: number;
  bagOk: number;
}

const EMPTY_STATS: FlightStats = { pax: 0, bagTotal: 0, bagOk: 0 };

interface FlightsState {
  flights: Flight[];
  loading: boolean;
  getFlight: (id: string) => Flight | undefined;
  statsFor: (id: string) => FlightStats;
  refresh: () => Promise<void>;
}

const FlightsContext = createContext<FlightsState | undefined>(undefined);

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

/** Compte les passagers + bagages d'un vol en une passe (3 requêtes head/count). */
async function fetchStats(flightId: string): Promise<FlightStats> {
  const [{ count: p }, { count: bt }, { count: bo }] = await Promise.all([
    supabase.from('passengers').select('id', { count: 'exact', head: true }).eq('flight_id', flightId),
    supabase.from('baggage').select('id', { count: 'exact', head: true }).eq('flight_id', flightId),
    supabase.from('baggage').select('id', { count: 'exact', head: true }).eq('flight_id', flightId).eq('is_confirmed', true),
  ]);
  return { pax: p ?? 0, bagTotal: bt ?? 0, bagOk: bo ?? 0 };
}

export function FlightsProvider({ children }: { children: ReactNode }) {
  const { session } = useAuth();
  const [flights, setFlights] = useState<Flight[]>([]);
  const [stats, setStats] = useState<Record<string, FlightStats>>({});
  const [loading, setLoading] = useState(true);
  // Identifiants des vols connus, pour recharger les stats d'un seul vol depuis le realtime.
  const flightIds = useRef<Set<string>>(new Set());

  const refreshStats = useCallback(async (id: string) => {
    const s = await fetchStats(id);
    setStats((prev) => ({ ...prev, [id]: s }));
  }, []);

  const refresh = useCallback(async () => {
    if (!session) return;
    const { data } = await supabase
      .from('flights')
      .select('*')
      .eq('date', today())
      .order('departure_time', { ascending: true });
    const list = (data as Flight[] | null) ?? [];
    setFlights(list);
    flightIds.current = new Set(list.map((f) => f.id));
    setLoading(false);
    // Précharge toutes les stats en parallèle pour un affichage instantané.
    const entries = await Promise.all(list.map(async (f) => [f.id, await fetchStats(f.id)] as const));
    setStats(Object.fromEntries(entries));
  }, [session]);

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

  // Realtime : ne recharge que les stats du vol concerné (évite un N+1 global).
  useEffect(() => {
    if (!session) return;
    const onChange = (payload: { new?: Record<string, unknown>; old?: Record<string, unknown> }) => {
      const id = (payload.new?.flight_id ?? payload.old?.flight_id) as string | undefined;
      if (id && flightIds.current.has(id)) void refreshStats(id);
    };
    const channel = supabase
      .channel('flights-store')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'passengers' }, onChange)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'baggage' }, onChange)
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [session, refreshStats]);

  const getFlight = useCallback((id: string) => flights.find((f) => f.id === id), [flights]);
  const statsFor = useCallback((id: string) => stats[id] ?? EMPTY_STATS, [stats]);

  return (
    <FlightsContext.Provider value={{ flights, loading, getFlight, statsFor, refresh }}>
      {children}
    </FlightsContext.Provider>
  );
}

export function useFlights(): FlightsState {
  const ctx = useContext(FlightsContext);
  if (!ctx) throw new Error('useFlights doit être utilisé dans FlightsProvider');
  return ctx;
}
