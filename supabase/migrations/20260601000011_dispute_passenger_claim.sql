-- ─────────────────────────────────────────────────────────────
-- Réclamation passager : un litige peut désormais être ouvert
-- directement par un passager depuis l'app de suivi (tracking).
-- Le flag distingue ces dossiers de ceux ouverts par un superviseur.
-- ─────────────────────────────────────────────────────────────

alter table public.baggage_disputes
  add column if not exists from_passenger boolean not null default false;

-- Index partiel : retrouver vite les réclamations passager non résolues.
create index if not exists baggage_disputes_from_passenger_idx
  on public.baggage_disputes (from_passenger)
  where from_passenger = true;

-- Note RLS : l'app tracking écrit via la clé service_role côté serveur
-- (route /api/claim), qui contourne la RLS. Aucune nouvelle policy d'INSERT
-- public n'est nécessaire — on ne veut PAS d'écriture anonyme directe.
