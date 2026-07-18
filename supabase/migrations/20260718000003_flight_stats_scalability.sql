-- Scalabilité multi-agents de l'app mobile.
--
-- Avant : chaque agent faisait 4 requêtes count PAR vol au login (≈152 pour 38
-- vols), et rafraîchissait ces 4 requêtes à CHAQUE événement realtime — soit une
-- amplification O(N²) quand plusieurs agents scannent simultanément.
--
-- Après :
--  • flight_stats_for_date : toutes les stats des vols du jour en UNE requête.
--  • Le realtime devient un comptage incrémental local (delta), sans re-requête.
--    Cela suppose REPLICA IDENTITY FULL sur passengers/baggage — DÉJÀ posé par
--    20260601000004_realtime.sql, donc rien à refaire ici.

-- 1. Stats agrégées de tous les vols d'une date, en une seule requête.
create or replace function public.flight_stats_for_date(d date)
returns table (
  flight_id uuid,
  pax       bigint,
  bag_total bigint,
  bag_ok    bigint,
  boarded   bigint
)
language sql
stable
security invoker
set search_path = public
as $$
  with pax as (
    select flight_id,
           count(*)                        as n,
           count(*) filter (where boarded) as brd
    from public.passengers
    group by flight_id
  ),
  bag as (
    select flight_id,
           count(*)                             as n,
           count(*) filter (where is_confirmed) as ok
    from public.baggage
    group by flight_id
  )
  select f.id,
         coalesce(pax.n, 0),
         coalesce(bag.n, 0),
         coalesce(bag.ok, 0),
         coalesce(pax.brd, 0)
  from public.flights f
  left join pax on pax.flight_id = f.id
  left join bag on bag.flight_id = f.id
  where f.date = d;
$$;

-- Réservée aux utilisateurs connectés (mêmes accès que la lecture des tables).
revoke execute on function public.flight_stats_for_date(date) from public, anon;
grant  execute on function public.flight_stats_for_date(date) to authenticated;
