import type { Flight } from '@police/shared';

/** Champs vol exposés publiquement — aucune donnée passager / bagage. */
export type PublicFlight = Pick<
  Flight,
  'flight_number' | 'origin' | 'destination' | 'stops' | 'departure_time' | 'arrival_time' | 'status' | 'date'
>;

export interface FlightsResponse {
  date: string;
  hub: string;
  flights: PublicFlight[];
}
