-- Le n° d'étiquette bagage (10 chiffres) n'est PAS unique au monde : les
-- compagnies réutilisent les 6 chiffres de série d'un vol/jour à l'autre
-- (même code compagnie, ex. 071). Un UNIQUE global sur tag_number faisait
-- collisionner le pré-enregistrement d'aujourd'hui avec celui d'hier : les
-- bagages dont la série existait déjà étaient silencieusement ignorés, donc
-- jamais liés au passager → fausses alertes "Bagage non autorisé".
--
-- La clé de liaison anti-fraude est serial_number + flight_id. L'unicité de
-- l'étiquette doit donc être PAR VOL, pas globale.

alter table public.baggage drop constraint if exists baggage_tag_number_key;

alter table public.baggage
  add constraint baggage_tag_number_flight_key unique (flight_id, tag_number);
