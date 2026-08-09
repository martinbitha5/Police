import type { ClockCheck } from './flights-store';

// Mise en mots de l'écart d'horloge, pour l'écran Vols et les Paramètres.
//
// Le décalage d'un PDA ne se voit pas : la liste des vols reste plausible, les
// scans partent sur le mauvais vol et personne ne remonte la cause. Ces
// fonctions servent à l'écrire en clair, dans les mots de l'agent.

/** En deçà, l'écart relève de la latence réseau et ne mérite pas d'être signalé. */
export const CLOCK_TOLERANCE_MS = 2 * 60 * 1000;

/** Le PDA et l'aéroport ne sont pas le même jour : c'est le cas grave. */
export function wrongDay(clock: ClockCheck): boolean {
  return clock.serverDay !== null && clock.serverDay !== clock.deviceDay;
}

/** L'horloge mérite-t-elle d'être signalée à l'agent ? */
export function clockIsOff(clock: ClockCheck): boolean {
  return wrongDay(clock) || (clock.driftMs !== null && Math.abs(clock.driftMs) > CLOCK_TOLERANCE_MS);
}

/** "2026-08-08" → "8 août". Découpe la chaîne pour ne pas repasser par UTC. */
export function dayLabel(iso: string): string {
  const [y, m, d] = iso.split('-').map((n) => parseInt(n, 10));
  if (!y || !m || !d) return iso;
  return new Date(y, m - 1, d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' });
}

/** Durée d'un écart d'horloge en clair : "12 min", "23 h 12", "2 j 4 h". */
export function driftLabel(ms: number): string {
  const total = Math.abs(ms);
  // Seuil sur la durée brute : un arrondi des minutes ferait passer 30 s pour
  // « 1 min », donc au-dessus du seuil au lieu d'en dessous.
  if (total < 60_000) return 'moins d’une minute';

  const minutes = Math.round(total / 60_000);
  if (minutes < 60) return `${minutes} min`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    const rest = minutes % 60;
    return rest === 0 ? `${hours} h` : `${hours} h ${String(rest).padStart(2, '0')}`;
  }

  const days = Math.floor(hours / 24);
  const restHours = hours % 24;
  return restHours === 0 ? `${days} j` : `${days} j ${restHours} h`;
}

/** "décalée de 23 h 12, en retard" — ou "à l'heure" tant que l'écart est négligeable. */
export function clockSummary(clock: ClockCheck): string {
  if (clock.driftMs === null) return 'Serveur injoignable';
  if (Math.abs(clock.driftMs) <= CLOCK_TOLERANCE_MS) return 'À l’heure';
  const sense = clock.driftMs > 0 ? 'en avance' : 'en retard';
  return `Décalée de ${driftLabel(clock.driftMs)}, ${sense}`;
}
