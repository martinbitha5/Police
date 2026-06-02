-- ─────────────────────────────────────────────────────────────
-- Auto-édition du profil par l'agent (nom complet), avec garde-fou
-- anti-escalade : ni le rôle ni l'id ne peuvent être modifiés par
-- un non-admin, même si la requête tente de les changer.
-- ─────────────────────────────────────────────────────────────

-- L'utilisateur peut modifier UNIQUEMENT sa propre ligne.
-- (S'ajoute à profiles_admin_write : les policies RLS sont combinées en OR,
--  donc l'admin garde son accès complet.)
create policy profiles_self_update on public.profiles
  for update to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

-- Verrou : pour tout non-admin, role et id restent figés à leur ancienne valeur.
-- Empêche un agent de se promouvoir admin via un update de sa propre ligne.
create or replace function public.lock_protected_profile_fields()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if public.auth_role() <> 'admin' then
    new.id   := old.id;
    new.role := old.role;
  end if;
  return new;
end;
$$;

create trigger profiles_lock_protected_fields
  before update on public.profiles
  for each row
  execute function public.lock_protected_profile_fields();
