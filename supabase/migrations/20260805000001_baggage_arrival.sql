-- Arrivée : contrôle de réception des bagages à l'aéroport de destination.
--
-- Dernière étape du parcours. L'agent de l'escale d'arrivée scanne chaque
-- bagage sorti de la soute. La cible est le nombre de bagages réellement
-- partis (in_hold = true et rush = false) : 100 bagages chargés au départ =
-- 100 bagages à scanner à l'arrivée. Tout écart devient visible immédiatement
-- (bagage manquant), et le passager voit passer son bagage au statut
-- « Arrivé » sur le portail de suivi.

alter table public.baggage
  add column if not exists arrived    boolean     not null default false,
  add column if not exists arrived_at timestamptz,
  add column if not exists arrived_by uuid references public.profiles(id);

create index if not exists baggage_arrived_idx on public.baggage (flight_id) where arrived = true;
