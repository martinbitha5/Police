import * as Haptics from 'expo-haptics';
import { hapticsOn } from './settings';

// Retour tactile distinct par résultat de scan. Sur un PDA Zebra en
// environnement bruyant, l'agent ne fixe pas l'écran : le motif de vibration
// est le signal principal. Le bip audible de lecture est assuré par DataWedge.
// Désactivable depuis l'écran Paramètres.

async function buzz(type: Haptics.NotificationFeedbackType) {
  if (!hapticsOn()) return;
  try {
    await Haptics.notificationAsync(type);
  } catch {
    // Haptics indisponible (émulateur, web) — on ignore.
  }
}

/** ✅ Bagage/passager accepté : une vibration de succès. */
export function feedbackSuccess(): void {
  void buzz(Haptics.NotificationFeedbackType.Success);
}

/** ⚠️ Doublon ou rejet non frauduleux : vibration d'avertissement. */
export function feedbackWarning(): void {
  void buzz(Haptics.NotificationFeedbackType.Warning);
}

/** 🚨 Alerte fraude : triple vibration d'erreur appuyée pour la distinguer. */
export function feedbackFraud(): void {
  void (async () => {
    for (let i = 0; i < 3; i += 1) {
      await buzz(Haptics.NotificationFeedbackType.Error);
      await new Promise((r) => setTimeout(r, 180));
    }
  })();
}
