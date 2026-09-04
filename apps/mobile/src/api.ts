import type {
  BaggageScanResult,
  BoardingGateResult,
  BaggageActionResult,
  BaggageLoadAllResult,
  DollyScanResult,
  ArrivalScanResult,
  ExpeditionRushResult,
  SoutePosition,
} from '@police/shared';
import { isAuthRetryableFetchError } from '@supabase/supabase-js';
import { supabase, signOutLocal } from './supabase';

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'https://api-police.brsats.com';

/** Message unique quand la session n'est plus exploitable sur cet appareil. */
const SESSION_LOST = 'Session expirée. Reconnectez-vous.';

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
  // Pas de corps = lecture simple (GET). Les scans, eux, portent toujours un corps.
  const read = body === undefined;
  return fetch(`${API_URL}${path}`, {
    method: read ? 'GET' : 'POST',
    headers: {
      ...(read ? {} : { 'Content-Type': 'application/json' }),
      Authorization: `Bearer ${token}`,
    },
    body: read ? undefined : JSON.stringify(body),
  });
}

async function request<T>(path: string, body?: unknown): Promise<T> {
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
    throw new Error('Serveur indisponible. Réessayez dans quelques instants.');
  }

  if (!res.ok) {
    throw new Error((json as { error?: string }).error ?? `Erreur ${res.status}`);
  }
  return json as T;
}

/** Journée d'exploitation et heure serveur, référence face à l'horloge du PDA. */
export interface OperatingDay {
  airport: string | null;
  /** Journée en cours à l'aéroport de l'agent (AAAA-MM-JJ). */
  day: string;
  /** Instant serveur au moment de la réponse (ISO 8601). */
  serverTime: string;
}

/**
 * Quel jour est-il à l'aéroport ? Question posée au serveur, pas à l'appareil.
 *
 * Une horloge de PDA décalée fait afficher les vols d'un autre jour sans que
 * rien ne le signale. L'appelant reste libre de retomber sur l'horloge locale
 * si l'API est injoignable : mieux vaut la liste d'hier que pas de liste.
 */
export function fetchOperatingDay(): Promise<OperatingDay> {
  return request<OperatingDay>('/operating-day');
}

export function scanBoarding(raw: string, flightId: string, scannedBy?: string): Promise<BoardingScanResponse> {
  return request<BoardingScanResponse>('/scan/boarding', { raw, flightId, scannedBy });
}

export function scanBaggage(
  tag: string,
  flightId: string,
  gate?: string | null,
  scannedBy?: string,
): Promise<BaggageScanResult> {
  return request<BaggageScanResult>('/scan/baggage', { tag, flightId, gate, scannedBy });
}

export function scanEmbarquement(
  raw: string,
  flightId: string,
  scannedBy?: string,
): Promise<BoardingGateResult> {
  return request<BoardingGateResult>('/scan/embarquement', { raw, flightId, scannedBy });
}

/** Restants : marque le bagage restant pour réacheminement sur le prochain vol. */
export function rushBaggage(tag: string, flightId: string, scannedBy?: string): Promise<BaggageActionResult> {
  return request<BaggageActionResult>('/scan/rush', { tag, flightId, scannedBy });
}

/**
 * Expédition rush : bagage voyageant SANS passager sur ce vol.
 * Sans otherTag = premier scan (identification) ; avec = enregistrement.
 * soloTag = le bagage ne porte qu'une seule étiquette, enregistrer avec elle.
 */
export function expeditionRush(
  tag: string,
  flightId: string,
  otherTag?: string,
  soloTag?: boolean,
): Promise<ExpeditionRushResult> {
  return request<ExpeditionRushResult>('/scan/expedition-rush', { tag, otherTag, soloTag, flightId });
}

/** Charger : pousse en soute tous les bagages enregistrés non-rush (groupé, sans scan). */
export function loadAllBaggage(flightId: string, scannedBy?: string): Promise<BaggageLoadAllResult> {
  return request<BaggageLoadAllResult>('/scan/load-all', { flightId, scannedBy });
}

/** Dolly : contrôle rayon X — n'admet que les bagages enregistrés, renvoie la progression. */
export function scanDolly(tag: string, flightId: string, scannedBy?: string): Promise<DollyScanResult> {
  return request<DollyScanResult>('/scan/dolly', { tag, flightId, scannedBy });
}

/** Arrivée : réception à destination — confirme qu'un bagage chargé est bien arrivé. */
export function scanArrivee(tag: string, flightId: string, scannedBy?: string): Promise<ArrivalScanResult> {
  return request<ArrivalScanResult>('/scan/arrivee', { tag, flightId, scannedBy });
}

/** Soute : identifie dans quel compartiment (avant/arrière) le bagage est chargé. */
export function scanSoute(
  tag: string,
  flightId: string,
  soute: SoutePosition,
  scannedBy?: string,
): Promise<BaggageActionResult> {
  return request<BaggageActionResult>('/scan/soute', { tag, flightId, soute, scannedBy });
}
