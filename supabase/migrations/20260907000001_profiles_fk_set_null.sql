-- Suppression d'un compte agent depuis le portail admin.
--
-- profiles.id cascade depuis auth.users, mais les 16 colonnes « qui a fait quoi »
-- pointaient vers profiles(id) en NO ACTION. Dès qu'un agent avait scanné une
-- seule ligne, Postgres refusait d'effacer son profil, la cascade échouait et
-- GoTrue renvoyait « Database error deleting user ».
--
-- On passe ces contraintes en ON DELETE SET NULL : les scans, alertes et litiges
-- restent en base, seule l'attribution à l'agent supprimé devient nulle. Toutes
-- ces colonnes sont déjà nullables.

alter table public.baggage
  drop constraint baggage_scanned_by_fkey,
  add constraint baggage_scanned_by_fkey
    foreign key (scanned_by) references public.profiles (id) on delete set null,
  drop constraint baggage_on_dolly_by_fkey,
  add constraint baggage_on_dolly_by_fkey
    foreign key (on_dolly_by) references public.profiles (id) on delete set null,
  drop constraint baggage_in_hold_by_fkey,
  add constraint baggage_in_hold_by_fkey
    foreign key (in_hold_by) references public.profiles (id) on delete set null,
  drop constraint baggage_rush_by_fkey,
  add constraint baggage_rush_by_fkey
    foreign key (rush_by) references public.profiles (id) on delete set null,
  drop constraint baggage_rush_status_by_fkey,
  add constraint baggage_rush_status_by_fkey
    foreign key (rush_status_by) references public.profiles (id) on delete set null,
  drop constraint baggage_soute_by_fkey,
  add constraint baggage_soute_by_fkey
    foreign key (soute_by) references public.profiles (id) on delete set null,
  drop constraint baggage_arrived_by_fkey,
  add constraint baggage_arrived_by_fkey
    foreign key (arrived_by) references public.profiles (id) on delete set null,
  drop constraint baggage_announced_by_fkey,
  add constraint baggage_announced_by_fkey
    foreign key (announced_by) references public.profiles (id) on delete set null,
  drop constraint baggage_cancelled_by_fkey,
  add constraint baggage_cancelled_by_fkey
    foreign key (cancelled_by) references public.profiles (id) on delete set null,
  drop constraint baggage_pulled_by_fkey,
  add constraint baggage_pulled_by_fkey
    foreign key (pulled_by) references public.profiles (id) on delete set null;

alter table public.passengers
  drop constraint passengers_scanned_by_fkey,
  add constraint passengers_scanned_by_fkey
    foreign key (scanned_by) references public.profiles (id) on delete set null,
  drop constraint passengers_boarded_by_fkey,
  add constraint passengers_boarded_by_fkey
    foreign key (boarded_by) references public.profiles (id) on delete set null,
  drop constraint passengers_offloaded_by_fkey,
  add constraint passengers_offloaded_by_fkey
    foreign key (offloaded_by) references public.profiles (id) on delete set null;

alter table public.baggage_disputes
  drop constraint baggage_disputes_created_by_fkey,
  add constraint baggage_disputes_created_by_fkey
    foreign key (created_by) references public.profiles (id) on delete set null,
  drop constraint baggage_disputes_resolved_by_fkey,
  add constraint baggage_disputes_resolved_by_fkey
    foreign key (resolved_by) references public.profiles (id) on delete set null;

alter table public.fraud_alerts
  drop constraint fraud_alerts_resolved_by_fkey,
  add constraint fraud_alerts_resolved_by_fkey
    foreign key (resolved_by) references public.profiles (id) on delete set null;
