import type {
  BaggageScanResult,
  BoardingGateResult,
  BaggageActionResult,
  BaggageLoadAllResult,
  DollyScanResult,
  ArrivalScanResult,
  SoutePosition,
} from '@police/shared';
import { isAuthRetryableFetchError } from '@supabase/supabase-js';
import { supabase, signOutLocal } from './supabase';

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'https://api-police.brsats.com';

/** Message unique quand la session n'est plus exploitable sur cet appareil. */
const SESSION_LOST = 'Session expirée — reconnectez-vous.';

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

function send(path: string, body: unknown, token: string): Promise<Response> {
  return fetch(`${API_URL}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });
}

async function post<T>(path: string, body: unknown): Promise<T> {
  // L'API valide le JWT de l'agent et en dérive l'identité du scanneur : sans
  // token, elle rejette (401). On lit la session courante avant chaque appel.
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) {
    // Pas de déconnexion ici : getSession() renvoie aussi une session vide
    // quand le réseau tombe pendant un renouvellement, alors que la session
    // stockée est saine. Le scan suivant repassera tout seul.
    throw new Error(SESSION_LOST);
  }

  let res = await send(path, body, token);

  // 401 : l'API a refusé le jeton. Deux causes réelles sur le terrain : soit
  // l'horloge du PDA est décalée (l'app croit son jeton encore valide et ne le
  // renouvelle donc pas), soit la session a été supprimée côté serveur. Dans
  // les deux cas le refus vient du preHandler d'authentification, donc AVANT
  // toute écriture en base : rejouer le scan ne peut pas créer de doublon ni
  // de bagage confirmé deux fois. On force un jeton neuf et on retente une fois.
  if (res.status === 401) {
    const { data: refreshed, error } = await supabase.auth.refreshSession();
    const fresh = refreshed.session?.access_token;
    if (fresh) {
      res = await send(path, body, fresh);
    }

    if (!fresh || res.status === 401) {
      if (isAuthRetryableFetchError(error)) {
        // Réseau coupé pendant le renouvellement : la session n'est pas morte,
        // on la garde et l'agent peut rescanner dès que la liaison revient.
        throw new Error('Connexion perdue, réessayez.');
      }
      // Session réellement révoquée ou expirée : on vide CET appareil, ce qui
      // ramène l'agent à l'écran de connexion (AuthGate) au lieu de le laisser
      // bloqué sur un écran de scan qui échoue en boucle.
      await signOutLocal();
      throw new Error(SESSION_LOST);
    }
  }

  let json: unknown;
  try {
    json = await res.json();
  } catch {
    throw new Error('Serveur indisponible — réessayez dans quelques instants.');
  }

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

/** Dolly : contrôle rayon X — n'admet que les bagages enregistrés, renvoie la progression. */
export function scanDolly(tag: string, flightId: string, scannedBy?: string): Promise<DollyScanResult> {
  return post<DollyScanResult>('/scan/dolly', { tag, flightId, scannedBy });
}

/** Arrivée : réception à destination — confirme qu'un bagage chargé est bien arrivé. */
export function scanArrivee(tag: string, flightId: string, scannedBy?: string): Promise<ArrivalScanResult> {
  return post<ArrivalScanResult>('/scan/arrivee', { tag, flightId, scannedBy });
}

/** Soute : identifie dans quel compartiment (avant/arrière) le bagage est chargé. */
export function scanSoute(
  tag: string,
  flightId: string,
  soute: SoutePosition,
  scannedBy?: string,
): Promise<BaggageActionResult> {
  return post<BaggageActionResult>('/scan/soute', { tag, flightId, soute, scannedBy });
}
