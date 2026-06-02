-- ─────────────────────────────────────────────────────────────
-- Création automatique du profil à l'inscription d'un utilisateur.
-- Alimenté par les user_metadata passés à supabase.auth.admin.createUser :
--   { full_name, role, gate }
-- ─────────────────────────────────────────────────────────────

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, role, gate)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    coalesce(new.raw_user_meta_data ->> 'role', 'agent'),
    new.raw_user_meta_data ->> 'gate'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();
