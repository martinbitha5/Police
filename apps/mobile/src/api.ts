import type {
  BaggageScanResult,
  BoardingGateResult,
  BaggageActionResult,
  BaggageLoadAllResult,
} from '@police/shared';

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'https://api-police.brsats.com';

export interface BoardingScanResponse {
  passenger: {
    fullName: string;
    pnr: string;
    seat: string;
    class: string;
    declaredBaggageCount: number;
    legs: { origin: string; destination: string; flightNumber: string; order: number }[];
  };
}

async function post<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const json = await res.json();
  if (!res.ok) {
    throw new Error((json as { error?: string }).error ?? `Erreur ${res.status}`);
  }
  return json as T;
}

export function scanBoarding(raw: string, flightId: string, scannedBy?: string): Promise<BoardingScanResponse> {
  return post<BoardingScanResponse>('/scan/boarding', { raw, flightId, scannedBy });
}

export function scanBaggage(
  tag: string,
  flightId: string,
  gate?: string | null,
  scannedBy?: string,
): Promise<BaggageScanResult> {
  return post<BaggageScanResult>('/scan/baggage', { tag, flightId, gate, scannedBy });
}

export function scanEmbarquement(
  raw: string,
  flightId: string,
  scannedBy?: string,
): Promise<BoardingGateResult> {
  return post<BoardingGateResult>('/scan/embarquement', { raw, flightId, scannedBy });
}

/** Rush : marque le bagage restant pour réacheminement sur le prochain vol. */
export function rushBaggage(tag: string, flightId: string, scannedBy?: string): Promise<BaggageActionResult> {
  return post<BaggageActionResult>('/scan/rush', { tag, flightId, scannedBy });
}

/** Charger : pousse en soute tous les bagages enregistrés non-rush (groupé, sans scan). */
export function loadAllBaggage(flightId: string, scannedBy?: string): Promise<BaggageLoadAllResult> {
  return post<BaggageLoadAllResult>('/scan/load-all', { flightId, scannedBy });
}
