import AsyncStorage from '@react-native-async-storage/async-storage';

// Préférences locales de l'agent, persistées sur l'appareil.
// Drapeau en mémoire pour une lecture synchrone par feedback.ts (vibrations).
const KEY_HAPTICS = 'pref.haptics';
const KEY_ONBOARDED = 'pref.onboarded';

/** L'onboarding a-t-il déjà été vu ? (lu une fois au démarrage par l'écran d'accueil) */
export async function getOnboarded(): Promise<boolean> {
  try {
    return (await AsyncStorage.getItem(KEY_ONBOARDED)) === '1';
  } catch {
    return false;
  }
}

export async function markOnboarded(): Promise<void> {
  try {
    await AsyncStorage.setItem(KEY_ONBOARDED, '1');
  } catch {
    // Ignore l'échec d'écriture.
  }
}

/** Réinitialise l'onboarding : à la prochaine ouverture, l'écran d'accueil
 *  s'affiche de nouveau (appelé à la déconnexion). */
export async function resetOnboarded(): Promise<void> {
  try {
    await AsyncStorage.removeItem(KEY_ONBOARDED);
  } catch {
    // Ignore l'échec d'écriture.
  }
}

let hapticsEnabled = true;
const listeners = new Set<() => void>();

export function hapticsOn(): boolean {
  return hapticsEnabled;
}

/** Charge les préférences au démarrage (appelé une fois dans le layout racine). */
export async function loadSettings(): Promise<void> {
  try {
    const v = await AsyncStorage.getItem(KEY_HAPTICS);
    if (v !== null) hapticsEnabled = v === '1';
  } catch {
    // Stockage indisponible — on garde les valeurs par défaut.
  }
}

export async function setHaptics(on: boolean): Promise<void> {
  hapticsEnabled = on;
  listeners.forEach((l) => l());
  try {
    await AsyncStorage.setItem(KEY_HAPTICS, on ? '1' : '0');
  } catch {
    // Ignore l'échec d'écriture.
  }
}

/** S'abonne aux changements de préférences (retourne une fonction de désabonnement). */
export function subscribeSettings(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
