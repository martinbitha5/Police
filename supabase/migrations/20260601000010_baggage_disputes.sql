-- ─────────────────────────────────────────────────────────────
-- Litiges bagage : ouvrir un dossier sur un bagage (égaré, non
-- réclamé, endommagé…), y attacher des notes et suivre la
-- résolution. Outil interne superviseur/admin.
-- ─────────────────────────────────────────────────────────────

create table if not exists public.baggage_disputes (
  id            uuid primary key default gen_random_uuid(),
  baggage_id    uuid references public.baggage (id)    on delete set null,
  flight_id     uuid references public.flights (id),
  passenger_id  uuid references public.passengers (id) on delete set null,
  -- Copie du tag au moment de l'ouverture (survit à la suppression du bagage).
  tag_number    text,
  status        text not null default 'open' check (status in ('open', 'investigating', 'resolved')),
  reason        text,
  notes         text,
  created_by    uuid references public.profiles (id),
  created_at    timestamptz not null default now(),
  resolved_at   timestamptz,
  resolved_by   uuid references public.profiles (id)
);

create index if not exists baggage_disputes_flight_idx  on public.baggage_disputes (flight_id);
create index if not exists baggage_disputes_status_idx  on public.baggage_disputes (status);
create index if not exists baggage_disputes_baggage_idx on public.baggage_disputes (baggage_id);

alter table public.baggage_disputes enable row level security;

-- Lecture + écriture réservées au superviseur/admin (app litige interne).
create policy baggage_disputes_read on public.baggage_disputes
  for select to authenticated
  using (public.auth_role() in ('admin', 'supervisor'));

create policy baggage_disputes_write on public.baggage_disputes
  for all to authenticated
  using (public.auth_role() in ('admin', 'supervisor'))
  with check (public.auth_role() in ('admin', 'supervisor'));
