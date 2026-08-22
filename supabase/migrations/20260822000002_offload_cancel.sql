-- Débarquement passager et annulation de bagage — actions superviseur.
--
-- On ne supprime jamais une ligne : on la marque, avec auteur, heure et motif.
-- L'historique reste consultable, le rapport de journée reste exact, et les
-- compteurs excluent simplement ce qui est débarqué / annulé.
--
-- Règle de sûreté : un bagage ne vole jamais sans son passager (la seule
-- exception contrôlée est l'expédition rush). Débarquer un passager annule donc
-- tous ses bagages ; ceux déjà chargés en soute doivent être physiquement
-- retirés, et le retrait est confirmé par scan (pulled).

alter table public.passengers
  add column if not exists offloaded boolean not null default false,
  add column if not exists offloaded_at timestamptz,
  add column if not exists offloaded_by uuid references public.profiles(id),
  add column if not exists offload_reason text;

alter table public.baggage
  add column if not exists cancelled boolean not null default false,
  add column if not exists cancelled_at timestamptz,
  add column if not exists cancelled_by uuid references public.profiles(id),
  add column if not exists cancel_reason text,
  -- Annulé alors qu'il était déjà en soute : retiré physiquement, confirmé par scan.
  add column if not exists pulled boolean not null default false,
  add column if not exists pulled_at timestamptz,
  add column if not exists pulled_by uuid references public.profiles(id);

-- Le débarquement se fait depuis le dashboard web (client Supabase direct).
-- `passengers` n'avait aucune policy UPDATE : les agents n'ont toujours pas le
-- droit d'y toucher, seuls superviseurs et admins débarquent.
create policy passengers_supervisor_update on public.passengers
  for update to authenticated
  using (public.auth_role() in ('admin', 'supervisor'))
  with check (public.auth_role() in ('admin', 'supervisor'));
