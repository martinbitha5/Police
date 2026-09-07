-- Matricule lisible des comptes.
--
-- L'identifiant technique d'un compte est un UUID : illisible, impossible à
-- dicter au téléphone, inutilisable sur le terrain. On ajoute un matricule
-- maison, court et prononçable, de la forme « ET-014 » : le code IATA de la
-- compagnie, un tiret, un numéro séquentiel dans cette compagnie.
--
-- Il est attribué automatiquement à la création du profil et ne change plus,
-- même si la personne change de rôle ou d'escale.

alter table public.profiles
  add column if not exists staff_code text;

create unique index if not exists profiles_staff_code_key
  on public.profiles (staff_code);

-- Prochain matricule libre pour une compagnie. Le verrou de transaction
-- sérialise deux créations simultanées, qui sinon tireraient le même numéro.
create or replace function public.next_staff_code(p_airline text)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  prefix text := upper(coalesce(nullif(trim(p_airline), ''), 'XX'));
  n      int;
begin
  perform pg_advisory_xact_lock(hashtext('staff_code:' || prefix)::bigint);

  select coalesce(max((substring(staff_code from '[0-9]+$'))::int), 0) + 1
    into n
    from public.profiles
   where staff_code like prefix || '-%';

  return prefix || '-' || lpad(n::text, 3, '0');
end;
$$;

create or replace function public.set_staff_code()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.staff_code is null then
    new.staff_code := public.next_staff_code(new.airline_code);
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_set_staff_code on public.profiles;
create trigger profiles_set_staff_code
  before insert on public.profiles
  for each row
  execute function public.set_staff_code();

-- Comptes déjà en base : numérotés par compagnie, dans leur ordre d'ancienneté.
with numbered as (
  select
    id,
    upper(coalesce(nullif(trim(airline_code), ''), 'XX')) as prefix,
    row_number() over (
      partition by upper(coalesce(nullif(trim(airline_code), ''), 'XX'))
      order by created_at, id
    ) as n
  from public.profiles
  where staff_code is null
)
update public.profiles p
   set staff_code = numbered.prefix || '-' || lpad(numbered.n::text, 3, '0')
  from numbered
 where p.id = numbered.id;

-- Le matricule est une donnée d'identité : seul un admin peut le corriger,
-- personne ne réécrit le sien depuis son écran de profil.
create or replace function public.lock_protected_profile_fields()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if public.auth_role() <> 'admin' then
    new.id         := old.id;
    new.role       := old.role;
    new.staff_code := old.staff_code;
  end if;
  return new;
end;
$$;

-- Fonctions internes : jamais appelées en RPC depuis le client.
revoke execute on function public.next_staff_code(text) from public, anon, authenticated;
revoke execute on function public.set_staff_code()      from public, anon, authenticated;
