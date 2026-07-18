-- ─────────────────────────────────────────────────────────────
-- Durcissement sécurité (2026-07-18)
--
-- Corrige les advisors Supabase :
--   • 0011  function_search_path_mutable  → handle_new_user sans search_path
--   • 0028/0029 (SECURITY DEFINER exposées via /rest/v1/rpc à anon/authenticated)
--
-- ⚠️ Ne ferme PAS à lui seul l'escalade de rôle : le trigger ne peut pas
--    distinguer un compte créé par l'admin (admin.createUser) d'une inscription
--    publique — les deux passent par le même INSERT dans auth.users. La whitelist
--    ci-dessous rejette les rôles invalides mais PAS un 'admin' malveillant.
--    La vraie fermeture = désactiver l'inscription publique (Dashboard → Auth →
--    Providers → Email → « Allow new users to sign up » = OFF).
-- ─────────────────────────────────────────────────────────────

-- 1. handle_new_user : figer search_path + whitelist du rôle (défense en profondeur).
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, role, gate, airport_code, airline_code)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    case
      when new.raw_user_meta_data ->> 'role' in ('agent', 'supervisor', 'admin')
        then new.raw_user_meta_data ->> 'role'
      else 'agent'
    end,
    new.raw_user_meta_data ->> 'gate',
    coalesce(new.raw_user_meta_data ->> 'airport_code', 'FIH'),
    coalesce(new.raw_user_meta_data ->> 'airline_code', 'ET')
  )
  on conflict (id) do update set
    full_name    = excluded.full_name,
    role         = excluded.role,
    gate         = excluded.gate,
    airport_code = excluded.airport_code,
    airline_code = excluded.airline_code;
  return new;
end;
$$;

-- 2. Fonctions trigger : jamais appelées directement → retirer l'accès RPC.
--    (Le trigger continue de se déclencher : l'exécution interne d'un trigger
--     ne dépend pas du privilège EXECUTE du rôle appelant.)
revoke execute on function public.handle_new_user()               from public, anon, authenticated;
revoke execute on function public.lock_protected_profile_fields() from public, anon, authenticated;

-- 3. auth_role() est utilisée DANS les policies RLS → 'authenticated' DOIT
--    conserver EXECUTE. On retire l'accès large (public/anon) et on RE-GARANTIT
--    explicitement à 'authenticated' pour que la RLS reste intacte.
revoke execute on function public.auth_role() from public, anon;
grant  execute on function public.auth_role() to authenticated;
