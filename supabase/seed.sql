-- Données de référence chargées en local (supabase db reset).

insert into public.airline_codes (numeric_code, iata_code, name) values
  ('071', 'ET', 'Ethiopian / Air Congo')
on conflict (numeric_code) do nothing;
