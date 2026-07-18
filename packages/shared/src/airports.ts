// Aéroports desservis par Air Congo — référence partagée (portail vols, dashboard).
// Toutes les lignes partent de Kinshasa (FIH), qui est le hub du réseau.

export interface Airport {
  /** Code IATA (ex. "FBM"). */
  code: string;
  /** Ville desservie (ex. "Lubumbashi"). */
  city: string;
  /** Pays de l'aéroport. */
  country: string;
  /** true = ligne intérieure RDC, false = ligne internationale. */
  domestic: boolean;
}

/** Hub du réseau : toutes les lignes en partent ou y reviennent. */
export const HUB_CODE = 'FIH';

export const AIRPORTS: readonly Airport[] = [
  // ── Lignes domestiques (RD Congo) ──────────────────────────
  { code: 'FIH', city: 'Kinshasa', country: 'RD Congo', domestic: true },
  { code: 'FBM', city: 'Lubumbashi', country: 'RD Congo', domestic: true },
  { code: 'GOM', city: 'Goma', country: 'RD Congo', domestic: true },
  { code: 'FKI', city: 'Kisangani', country: 'RD Congo', domestic: true },
  { code: 'KND', city: 'Kindu', country: 'RD Congo', domestic: true },
  { code: 'MJM', city: 'Mbuji-Mayi', country: 'RD Congo', domestic: true },
  { code: 'GMA', city: 'Gemena', country: 'RD Congo', domestic: true },
  { code: 'KGA', city: 'Kananga', country: 'RD Congo', domestic: true },
  { code: 'FMI', city: 'Kalemie', country: 'RD Congo', domestic: true },
  { code: 'BUX', city: 'Bunia', country: 'RD Congo', domestic: true },
  { code: 'BNC', city: 'Beni', country: 'RD Congo', domestic: true },
  { code: 'IRP', city: 'Isiro', country: 'RD Congo', domestic: true },
  { code: 'BDT', city: 'Gbadolite', country: 'RD Congo', domestic: true },

  // ── Lignes internationales ─────────────────────────────────
  { code: 'JNB', city: 'Johannesburg', country: 'Afrique du Sud', domestic: false },
  { code: 'EBB', city: 'Entebbe', country: 'Ouganda', domestic: false },
  { code: 'DLA', city: 'Douala', country: 'Cameroun', domestic: false },
  { code: 'COO', city: 'Cotonou', country: 'Bénin', domestic: false },
  { code: 'DAR', city: 'Dar es Salaam', country: 'Tanzanie', domestic: false },
  { code: 'BRU', city: 'Bruxelles', country: 'Belgique', domestic: false },
] as const;

const BY_CODE: Record<string, Airport> = Object.fromEntries(AIRPORTS.map((a) => [a.code, a]));

/** Aéroport correspondant au code IATA, ou undefined si inconnu. */
export function findAirport(code: string): Airport | undefined {
  return BY_CODE[code.trim().toUpperCase()];
}

/** Ville d'un code IATA — repli sur le code lui-même si l'aéroport est inconnu. */
export function airportCity(code: string): string {
  return findAirport(code)?.city ?? code;
}

/** Libellé complet : "Lubumbashi (FBM)" — repli sur le code seul si inconnu. */
export function airportLabel(code: string): string {
  const a = findAirport(code);
  return a ? `${a.city} (${a.code})` : code;
}
