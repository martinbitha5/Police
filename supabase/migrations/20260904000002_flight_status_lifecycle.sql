-- Cycle de vie complet d'un vol.
--
-- « Porte fermée » (closed) disait seulement que l'embarquement était terminé :
-- l'avion pouvait être encore au sol une heure. Rien ne permettait de dire
-- qu'il était parti, ni qu'il était arrivé à destination. Le superviseur
-- dispose maintenant de la suite du parcours :
--
--   scheduled  Programmé
--   delayed    Retardé            (l'avion n'est pas parti à l'heure prévue)
--   boarding   Embarquement
--   closed     Embarquement terminé (porte fermée, avion au sol)
--   departed   Décollé
--   arrived    Arrivé
--   cancelled  Annulé
--
-- Les scans de check-in et d'embarquement se verrouillent dès `closed` et
-- restent verrouillés pour `departed`, `arrived` et `cancelled` (règle portée
-- par les applications via `isFlightLocked` de @police/shared).

alter table public.flights
  drop constraint if exists flights_status_check;

alter table public.flights
  add constraint flights_status_check
  check (status in ('scheduled', 'delayed', 'boarding', 'closed', 'departed', 'arrived', 'cancelled'));
