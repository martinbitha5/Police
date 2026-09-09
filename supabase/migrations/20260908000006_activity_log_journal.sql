-- Journal d'activité rapide et inaltérable, en remplacement de la vue
-- movement_log (union de ~20 balayages complets, > 8 s = timeout PostgREST).
-- Appliqué en production le 2026-09-08.
--
-- Table indexée, append-only, alimentée par déclencheurs (migration suivante) et
-- remplie une fois avec l'historique (opération de données ponctuelle, hors
-- migration : sur une base neuve elle est vide, les déclencheurs la remplissent).
-- La vue activity_view expose les MÊMES colonnes que movement_log.

create table if not exists public.activity_log (
  id           bigserial primary key,
  at           timestamptz not null,
  kind         text        not null,
  actor_id     uuid,
  flight_id    uuid,
  flight_date  date,
  passenger_id uuid,
  baggage_id   uuid,
  tag_number   text,
  detail       text
);

create index if not exists activity_log_date_at_idx on public.activity_log (flight_date, at desc);
create index if not exists activity_log_kind_idx  on public.activity_log (kind);
create index if not exists activity_log_actor_idx on public.activity_log (actor_id);

alter table public.activity_log enable row level security;

drop policy if exists activity_log_read on public.activity_log;
create policy activity_log_read on public.activity_log
  for select to authenticated
  using (public.auth_role() = 'admin');

revoke insert, update, delete, truncate on public.activity_log from anon, authenticated, service_role;
grant select on public.activity_log to authenticated;

-- Vue d'affichage : mêmes colonnes que movement_log. Vue PROPRIÉTAIRE avec filtre
-- admin explicite (pas security_invoker) : les jointures d'affichage ne coûtent
-- pas la RLS ligne par ligne, ce qui garde l'année entière sous ~150 ms.
drop view if exists public.activity_view;
create view public.activity_view as
select
  a.at,
  a.kind,
  a.actor_id,
  pr.full_name  as actor_name,
  pr.role       as actor_role,
  a.flight_id,
  f.flight_number,
  a.flight_date,
  f.origin,
  f.destination,
  a.passenger_id,
  p.full_name   as passenger_name,
  p.pnr,
  a.baggage_id,
  a.tag_number,
  a.detail
from public.activity_log a
left join public.profiles   pr on pr.id = a.actor_id
left join public.flights    f  on f.id  = a.flight_id
left join public.passengers p  on p.id  = a.passenger_id
where public.auth_role() = 'admin';

grant select on public.activity_view to authenticated;
revoke all on public.activity_view from anon;
