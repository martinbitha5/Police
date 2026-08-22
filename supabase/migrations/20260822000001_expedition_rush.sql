-- Expédition rush : bagages voyageant SANS passager à bord.
--
-- Deux familles de lignes cohabitent désormais dans `baggage` :
--  • kind = 'passenger'    : bagage d'un passager du vol. C'est tout l'existant,
--    la réconciliation au tapis et les 5 règles anti-fraude ne changent pas.
--  • kind = 'rush_forward' : bagage expédié sans passager sur ce vol, enregistré
--    par l'écran « Expédition rush ». passenger_id porte le passager du vol
--    D'ORIGINE quand le bagage vient d'un restant connu chez nous, et reste nul
--    pour un bagage externe (autre compagnie, autre réseau).
--
-- Un bagage expédié porte deux étiquettes physiques : l'originale (tag_number)
-- et l'étiquette RUSH imprimée au réacheminement (rush_tag_number). Les écrans
-- aval (dolly, soute, arrivée) le reconnaissent par l'une comme par l'autre.
--
-- Verrou anti-fraude : un rush_forward n'embarque jamais sans validation.
--  • restant connu   → rush_status = 'approved' d'office : le lien avec son
--    passager d'origine (origin_baggage_id) est la preuve de légitimité ;
--  • bagage inconnu  → rush_status = 'pending' : le dolly le refuse tant qu'un
--    superviseur n'a pas tranché (approved / denied) depuis le dashboard.

alter table public.baggage
  alter column passenger_id drop not null;

alter table public.baggage
  add column if not exists kind text not null default 'passenger'
    constraint baggage_kind_check check (kind in ('passenger', 'rush_forward')),
  add column if not exists rush_tag_number    text,
  add column if not exists rush_serial_number text,
  add column if not exists origin_baggage_id  uuid references public.baggage(id),
  add column if not exists rush_status text
    constraint baggage_rush_status_check check (rush_status in ('pending', 'approved', 'denied')),
  add column if not exists rush_status_at timestamptz,
  add column if not exists rush_status_by uuid references public.profiles(id);

-- Seul un rush_forward peut vivre sans passager.
alter table public.baggage
  add constraint baggage_passenger_required
  check (kind = 'rush_forward' or passenger_id is not null);

-- Liaison par la DEUXIÈME étiquette (l'agent scanne celle qui lui tombe sous la main).
create index if not exists baggage_rush_serial_idx
  on public.baggage (flight_id, rush_serial_number)
  where rush_serial_number is not null;

create index if not exists baggage_rush_forward_idx
  on public.baggage (flight_id)
  where kind = 'rush_forward';
