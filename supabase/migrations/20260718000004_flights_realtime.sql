-- Ajoute flights au realtime : le statut du vol (embarquement / porte fermée /
-- annulé) se propage en direct au mobile et au dashboard web. Le store mobile
-- écoutait déjà les UPDATE de flights, mais la table n'était pas publiée — les
-- événements n'étaient donc jamais diffusés.

alter publication supabase_realtime add table public.flights;
alter table public.flights replica identity full;
