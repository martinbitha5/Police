-- Surveillance de disponibilité des services (page « État des systèmes » et
-- pied de page). Une tâche pg_cron interroge chaque service toutes les cinq
-- minutes depuis la base, via l'extension http, et consigne le résultat.
-- Aucun serveur externe n'est nécessaire ; l'historique sert les barres de
-- disponibilité sur 90 jours.

create extension if not exists http with schema extensions;
create extension if not exists pg_cron;

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table if not exists public.service_catalog (
  key      text primary key,
  name     text not null,
  url      text not null,
  headers  jsonb not null default '{}'::jsonb,   -- en-têtes HTTP à envoyer (ex. apikey)
  sort     int  not null default 100,
  enabled  boolean not null default true
);

create table if not exists public.service_status_log (
  id           bigserial primary key,
  service_key  text not null references public.service_catalog(key) on delete cascade,
  checked_at   timestamptz not null default now(),
  ok           boolean not null,
  status_code  int,
  latency_ms   int,
  error        text
);
create index if not exists service_status_log_service_time on public.service_status_log (service_key, checked_at desc);

create table if not exists public.service_incident (
  id           bigserial primary key,
  title        text not null,
  body         text,
  service_key  text references public.service_catalog(key) on delete set null,
  severity     text not null default 'minor' check (severity in ('minor', 'major', 'critical')),
  started_at   timestamptz not null default now(),
  resolved_at  timestamptz,
  created_by   uuid references public.profiles(id) on delete set null
);

create table if not exists public.service_maintenance (
  id           bigserial primary key,
  title        text not null,
  body         text,
  service_key  text references public.service_catalog(key) on delete set null,
  starts_at    timestamptz not null,
  ends_at      timestamptz not null,
  created_by   uuid references public.profiles(id) on delete set null
);

-- ---------------------------------------------------------------------------
-- Accès : lecture publique (la page d'état est ouverte), écriture réservée.
-- Le journal n'est écrit que par la fonction de vérification.
-- ---------------------------------------------------------------------------

alter table public.service_catalog     enable row level security;
alter table public.service_status_log  enable row level security;
alter table public.service_incident    enable row level security;
alter table public.service_maintenance enable row level security;

grant select on public.service_catalog, public.service_status_log, public.service_incident, public.service_maintenance to anon, authenticated;
grant insert, update, delete on public.service_catalog, public.service_incident, public.service_maintenance to authenticated;
revoke insert, update, delete on public.service_status_log from anon, authenticated;

drop policy if exists "service_catalog_public_read" on public.service_catalog;
create policy "service_catalog_public_read" on public.service_catalog
  for select to anon, authenticated using (enabled);
drop policy if exists "service_catalog_admin_write" on public.service_catalog;
create policy "service_catalog_admin_write" on public.service_catalog
  for all to authenticated using (public.auth_role() = 'admin') with check (public.auth_role() = 'admin');

drop policy if exists "service_status_log_public_read" on public.service_status_log;
create policy "service_status_log_public_read" on public.service_status_log
  for select to anon, authenticated using (true);

drop policy if exists "service_incident_public_read" on public.service_incident;
create policy "service_incident_public_read" on public.service_incident
  for select to anon, authenticated using (true);
drop policy if exists "service_incident_admin_write" on public.service_incident;
create policy "service_incident_admin_write" on public.service_incident
  for all to authenticated using (public.auth_role() = 'admin') with check (public.auth_role() = 'admin');

drop policy if exists "service_maintenance_public_read" on public.service_maintenance;
create policy "service_maintenance_public_read" on public.service_maintenance
  for select to anon, authenticated using (true);
drop policy if exists "service_maintenance_admin_write" on public.service_maintenance;
create policy "service_maintenance_admin_write" on public.service_maintenance
  for all to authenticated using (public.auth_role() = 'admin') with check (public.auth_role() = 'admin');

-- ---------------------------------------------------------------------------
-- Vérification : une requête GET par service, 8 s au plus, résultat consigné.
-- Toute erreur réseau est consignée comme indisponibilité, sans arrêter la
-- boucle. Le journal est purgé au-delà de 100 jours.
-- ---------------------------------------------------------------------------

create or replace function public.run_service_checks()
returns void
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  s     record;
  t0    timestamptz;
  code  int;
  hdrs  extensions.http_header[];
  k     text;
  v     text;
begin
  perform extensions.http_set_curlopt('CURLOPT_TIMEOUT_MS', '8000');
  perform extensions.http_set_curlopt('CURLOPT_CONNECTTIMEOUT_MS', '5000');

  for s in select * from public.service_catalog where enabled order by sort loop
    hdrs := array[]::extensions.http_header[];
    for k, v in select * from jsonb_each_text(s.headers) loop
      hdrs := hdrs || extensions.http_header(k, v);
    end loop;

    t0 := clock_timestamp();
    begin
      select status into code
      from extensions.http(('GET', s.url, hdrs, null, null)::extensions.http_request);

      insert into public.service_status_log (service_key, ok, status_code, latency_ms)
      values (s.key, code between 200 and 399, code, (extract(epoch from clock_timestamp() - t0) * 1000)::int);
    exception when others then
      insert into public.service_status_log (service_key, ok, status_code, latency_ms, error)
      values (s.key, false, null, (extract(epoch from clock_timestamp() - t0) * 1000)::int, left(sqlerrm, 300));
    end;
  end loop;

  delete from public.service_status_log where checked_at < now() - interval '100 days';
end
$$;

revoke execute on function public.run_service_checks() from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- Vues de lecture : état courant par service, et disponibilité par jour.
-- Vues « owner » (pas security_invoker) : les données sont publiques et les
-- politiques ci-dessus suffisent ; cela évite le surcoût vu sur flight_stats.
-- ---------------------------------------------------------------------------

create or replace view public.service_current as
select distinct on (c.key)
  c.key, c.name, c.url, c.sort,
  l.ok, l.status_code, l.latency_ms, l.checked_at
from public.service_catalog c
left join public.service_status_log l on l.service_key = c.key
where c.enabled
order by c.key, l.checked_at desc nulls last;

create or replace view public.service_uptime_daily as
select
  service_key,
  (checked_at at time zone 'utc')::date as day,
  count(*)                       as checks,
  count(*) filter (where ok)     as ok_checks
from public.service_status_log
where checked_at >= now() - interval '90 days'
group by service_key, (checked_at at time zone 'utc')::date;

grant select on public.service_current, public.service_uptime_daily to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Services surveillés. Le portail superviseur est désactivé tant que son
-- adresse publique n'est pas confirmée (mettre l'URL, puis enabled = true).
-- La clé « apikey » est la clé anonyme publique du projet, déjà embarquée
-- dans les applications ; elle n'ouvre rien de plus que ce que la RLS permet.
-- ---------------------------------------------------------------------------

insert into public.service_catalog (key, name, url, headers, sort, enabled) values
  ('web',      'Portail superviseur',                       'https://police.brsats.com/login',                         '{}'::jsonb, 10, false),
  ('api',      'API de scan',                               'https://api-police.brsats.com/health',                    '{}'::jsonb, 20, true),
  ('db',       'Base de données',                           'https://zdnktpdtolyhdischulk.supabase.co/rest/v1/service_catalog?select=key&limit=1', jsonb_build_object('apikey','eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpkbmt0cGR0b2x5aGRpc2NodWxrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAyOTk5OTYsImV4cCI6MjA5NTg3NTk5Nn0.ewGrLr8L7rOxhlyuNpBVBRiaYjaaTL3f7Xbk_ZrzGVc'), 30, true),
  ('auth',     'Authentification',                          'https://zdnktpdtolyhdischulk.supabase.co/auth/v1/health', jsonb_build_object('apikey', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpkbmt0cGR0b2x5aGRpc2NodWxrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAyOTk5OTYsImV4cCI6MjA5NTg3NTk5Nn0.ewGrLr8L7rOxhlyuNpBVBRiaYjaaTL3f7Xbk_ZrzGVc'), 35, true),
  ('tracking', 'Suivi bagage (portail public)',             'https://tracking.brsats.com/',                            '{}'::jsonb, 40, true),
  ('vols',     'Vols du jour (portail public)',             'https://vols.brsats.com/',                                '{}'::jsonb, 50, true),
  ('litige',   'Litiges bagage (portail public)',           'https://litige.brsats.com/',                              '{}'::jsonb, 60, true)
on conflict (key) do nothing;

-- ---------------------------------------------------------------------------
-- Planification : toutes les cinq minutes.
-- ---------------------------------------------------------------------------

do $$
begin
  if exists (select 1 from cron.job where jobname = 'service-checks') then
    perform cron.unschedule('service-checks');
  end if;
  perform cron.schedule('service-checks', '*/5 * * * *', 'select public.run_service_checks();');
end
$$;

-- Première mesure immédiate, pour que la page ne soit pas vide.
select public.run_service_checks();
