-- Cloisonnement des comptes par compagnie (préparation multi-compagnies, CAA).
--
-- Avant : tout superviseur ou admin pouvait lire TOUS les profils, toutes
-- compagnies confondues, et un admin pouvait modifier n'importe quel profil.
-- Les données opérationnelles (vols, passagers, bagages, alertes) étaient déjà
-- cloisonnées par 20260719000001_airline_partition.sql ; les comptes, non.
--
-- Après : l'encadrement ne voit et ne gère que les comptes de SA compagnie.
-- Chaque compagnie administre les siens.
--
-- Les routes /api/admin/* utilisent la clé service_role et contournent la RLS :
-- elles portent le même filtre dans leur code. La barrière est donc double,
-- comme pour le reste du schéma.
--
-- Amorçage d'une nouvelle compagnie : la création de compte (auth.admin) n'est
-- pas soumise à ces policies. L'admin en place crée le premier admin de la
-- nouvelle compagnie ; dès lors ce compte sort de son périmètre et la nouvelle
-- compagnie gère ses effectifs seule.

drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles
  for select to authenticated
  using (
    id = auth.uid()
    or (
      public.auth_role() in ('admin', 'supervisor')
      and airline_code = public.auth_airline()
    )
  );

drop policy if exists profiles_admin_write on public.profiles;
create policy profiles_admin_write on public.profiles
  for all to authenticated
  using (
    public.auth_role() = 'admin'
    and airline_code = public.auth_airline()
  )
  with check (
    public.auth_role() = 'admin'
    and airline_code = public.auth_airline()
  );
