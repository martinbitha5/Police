-- Ajoute le statut « cancelled » (Annulé) aux vols.
-- Permet au superviseur d'annuler un vol prévu ; visible côté public.

alter table public.flights
  drop constraint if exists flights_status_check;

alter table public.flights
  add constraint flights_status_check
  check (status in ('scheduled', 'boarding', 'closed', 'cancelled'));
