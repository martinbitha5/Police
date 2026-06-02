-- Corrige l'unicité passager.
-- Avant : unique (pnr, flight_id) → faux, car un PNR est une réservation
-- partagée (une famille a le MÊME PNR). Le 2e passager du même PNR sur le même
-- vol était rejeté « déjà enregistré » sans jamais être inséré.
-- Après : unique (flight_id, pnr, seat) → l'identité d'un passager dans un vol
-- est PNR + siège. Un vrai re-scan (même siège) reste détecté comme doublon.

alter table public.passengers
  drop constraint if exists passengers_pnr_flight_id_key;

alter table public.passengers
  add constraint passengers_flight_pnr_seat_key unique (flight_id, pnr, seat);
