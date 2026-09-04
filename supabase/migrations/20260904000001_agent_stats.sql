-- Statistiques personnelles de l'agent connecté (écran Profil du mobile).
--
-- Une seule requête renvoie quatre lignes, une par période glissante depuis le
-- début du jour, de la semaine (lundi), du mois et de l'année, dans le fuseau
-- de l'aéroport passé en paramètre. Chaque ligne oppose ce que l'agent a fait
-- (`*_mine`) à ce que sa station a fait (`*_total`) : c'est ce rapport que les
-- jauges de l'écran dessinent.
--
-- Aucune écriture : les étapes portent déjà leur auteur et leur horodatage
-- (scanned_by, boarded_by, on_dolly_by, soute_by, in_hold_by, rush_by,
-- arrived_by). La fonction se contente de les compter.
--
-- `security definer`, et non invoker, pour une raison de coût : en invoker,
-- la policy de lecture appelle `flight_in_scope()` pour CHAQUE ligne de
-- passengers et de baggage, soit plus de trente mille appels par exécution,
-- vingt secondes, et le délai de huit secondes de PostgREST tranche (erreur
-- 500 côté PDA). Ici le périmètre est calculé une fois, avec exactement les
-- mêmes critères que la policy (compagnie et aéroport de l'agent), et ce qui
-- est « à moi » ne dépend que de auth.uid(). La fonction ne renvoie que des
-- comptes, jamais une ligne.

create or replace function public.agent_stats(tz text default 'Africa/Kinshasa')
returns table (
  period        text,
  flights_mine  bigint,
  flights_total bigint,
  pax_mine      bigint,
  pax_total     bigint,
  bags_mine     bigint,
  bags_total    bigint
)
language sql
stable
security definer
set search_path = public
as $$
  with me as (
    select auth.uid()            as id,
           public.auth_airline() as airline,
           public.auth_airport() as airport
  ),
  -- Début de chaque période dans le fuseau de l'aéroport, reconverti en
  -- instant absolu pour se comparer aux timestamptz des tables.
  b as (
    select (date_trunc('day',   now() at time zone tz) at time zone tz) as d,
           (date_trunc('week',  now() at time zone tz) at time zone tz) as w,
           (date_trunc('month', now() at time zone tz) at time zone tz) as m,
           (date_trunc('year',  now() at time zone tz) at time zone tz) as y
  ),
  -- Les vols de la station de l'agent sur l'année : mêmes critères que la
  -- policy flights_read, calculés une seule fois.
  scope as (
    select f.id, f.date
    from public.flights f, me, b
    where me.id is not null
      and f.airline_code = me.airline
      and (
        f.origin = me.airport
        or f.destination = me.airport
        or me.airport = any (coalesce(f.stops, '{}'::text[]))
      )
      and f.date >= (b.y at time zone tz)::date
  ),
  -- Chaque geste de l'agent sur l'année : quand, sur quel vol, sur quelle ligne.
  mine as (
    select p.scanned_at as at, p.flight_id, 'pax'::text as kind, p.id as row_id
    from public.passengers p, me, b
    where p.scanned_by = me.id and p.scanned_at >= b.y

    union all
    select p.boarded_at, p.flight_id, 'move', p.id
    from public.passengers p, me, b
    where p.boarded_by = me.id and p.boarded_at >= b.y

    union all
    select bg.scanned_at, bg.flight_id, 'bag', bg.id
    from public.baggage bg, me, b
    where bg.scanned_by = me.id and bg.is_confirmed and bg.scanned_at >= b.y

    union all
    select bg.on_dolly_at, bg.flight_id, 'bag', bg.id
    from public.baggage bg, me, b
    where bg.on_dolly_by = me.id and bg.on_dolly_at >= b.y

    union all
    select bg.soute_at, bg.flight_id, 'bag', bg.id
    from public.baggage bg, me, b
    where bg.soute_by = me.id and bg.soute_at >= b.y

    union all
    select bg.in_hold_at, bg.flight_id, 'bag', bg.id
    from public.baggage bg, me, b
    where bg.in_hold_by = me.id and bg.in_hold_at >= b.y

    union all
    select bg.rush_at, bg.flight_id, 'bag', bg.id
    from public.baggage bg, me, b
    where bg.rush_by = me.id and bg.rush_at >= b.y

    union all
    select bg.arrived_at, bg.flight_id, 'bag', bg.id
    from public.baggage bg, me, b
    where bg.arrived_by = me.id and bg.arrived_at >= b.y
  ),
  -- Un seul passage sur les gestes de l'agent, quatre fenêtres.
  agg as (
    select
      count(distinct mv.flight_id) filter (where mv.at >= b.d) as f_d,
      count(distinct mv.flight_id) filter (where mv.at >= b.w) as f_w,
      count(distinct mv.flight_id) filter (where mv.at >= b.m) as f_m,
      count(distinct mv.flight_id)                             as f_y,
      count(*) filter (where mv.kind = 'pax' and mv.at >= b.d) as p_d,
      count(*) filter (where mv.kind = 'pax' and mv.at >= b.w) as p_w,
      count(*) filter (where mv.kind = 'pax' and mv.at >= b.m) as p_m,
      count(*) filter (where mv.kind = 'pax')                  as p_y,
      count(distinct mv.row_id) filter (where mv.kind = 'bag' and mv.at >= b.d) as g_d,
      count(distinct mv.row_id) filter (where mv.kind = 'bag' and mv.at >= b.w) as g_w,
      count(distinct mv.row_id) filter (where mv.kind = 'bag' and mv.at >= b.m) as g_m,
      count(distinct mv.row_id) filter (where mv.kind = 'bag')                  as g_y
    from mine mv, b
  ),
  -- Ce que la station a fait, même découpage.
  tot_f as (
    select
      count(*) filter (where s.date >= (b.d at time zone tz)::date) as f_d,
      count(*) filter (where s.date >= (b.w at time zone tz)::date) as f_w,
      count(*) filter (where s.date >= (b.m at time zone tz)::date) as f_m,
      count(*)                                                      as f_y
    from scope s, b
  ),
  tot_p as (
    select
      count(*) filter (where p.scanned_at >= b.d) as p_d,
      count(*) filter (where p.scanned_at >= b.w) as p_w,
      count(*) filter (where p.scanned_at >= b.m) as p_m,
      count(*)                                    as p_y
    from public.passengers p
    join scope s on s.id = p.flight_id, b
    where not p.offloaded and p.scanned_at >= b.y
  ),
  tot_g as (
    select
      count(*) filter (where bg.scanned_at >= b.d) as g_d,
      count(*) filter (where bg.scanned_at >= b.w) as g_w,
      count(*) filter (where bg.scanned_at >= b.m) as g_m,
      count(*)                                     as g_y
    from public.baggage bg
    join scope s on s.id = bg.flight_id, b
    where bg.kind = 'passenger' and not bg.cancelled and bg.scanned_at >= b.y
  )
  select v.period, v.fm, v.ft, v.pm, v.pt, v.gm, v.gt
  from agg, tot_f, tot_p, tot_g,
  lateral (values
    ('day',   agg.f_d, tot_f.f_d, agg.p_d, tot_p.p_d, agg.g_d, tot_g.g_d, 1),
    ('week',  agg.f_w, tot_f.f_w, agg.p_w, tot_p.p_w, agg.g_w, tot_g.g_w, 2),
    ('month', agg.f_m, tot_f.f_m, agg.p_m, tot_p.p_m, agg.g_m, tot_g.g_m, 3),
    ('year',  agg.f_y, tot_f.f_y, agg.p_y, tot_p.p_y, agg.g_y, tot_g.g_y, 4)
  ) as v(period, fm, ft, pm, pt, gm, gt, ord)
  order by v.ord;
$$;

revoke execute on function public.agent_stats(text) from public, anon;
grant  execute on function public.agent_stats(text) to authenticated;

-- Les gestes d'un agent se cherchent par auteur : sans index, chaque branche
-- parcourt la table entière.
create index if not exists passengers_scanned_by_idx on public.passengers (scanned_by, scanned_at);
create index if not exists baggage_scanned_by_idx    on public.baggage (scanned_by, scanned_at);
