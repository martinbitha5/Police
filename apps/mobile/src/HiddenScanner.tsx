import { useCallback, useEffect, useRef } from 'react';
import { View, TextInput, StyleSheet, type NativeSyntheticEvent, type TextInputSubmitEditingEventData } from 'react-native';
import { useFocusEffect } from 'expo-router';

interface Props {
  onScan: (value: string) => void;
}

// Délai sans nouvelle frappe au bout duquel on considère le scan terminé,
// même si DataWedge n'envoie pas de terminateur Enter.
const SCAN_IDLE_MS = 120;

/**
 * Capteur de scan INVISIBLE : un champ texte hors écran qui garde le focus en
 * permanence pour recevoir les frappes DataWedge injectées au clavier. Aucune
 * UI affichée — l'agent scanne, la donnée entre directement.
 * Validation automatique — soit sur terminateur \r\n, soit après une courte
 * pause sans nouvelle frappe (débounce), pour gérer les profils DataWedge sans
 * terminateur.
 */
export function HiddenScanner({ onScan }: Props) {
  const ref = useRef<TextInput>(null);
  const buffer = useRef('');
  const idleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const focus = useCallback(() => {
    ref.current?.focus();
  }, []);

  useEffect(() => {
    focus();
    const id = setInterval(focus, 500);
    return () => clearInterval(id);
  }, [focus]);

  useFocusEffect(
    useCallback(() => {
      focus();
    }, [focus]),
  );

  const clearIdle = useCallback(() => {
    if (idleTimer.current) {
      clearTimeout(idleTimer.current);
      idleTimer.current = null;
    }
  }, []);

  const emit = useCallback(
    (raw: string) => {
      clearIdle();
      const value = raw.replace(/[\r\n]+/g, '').trim();
      buffer.current = '';
      ref.current?.clear();
      if (value) onScan(value);
      requestAnimationFrame(focus);
    },
    [onScan, focus, clearIdle],
  );

  const handleChange = useCallback(
    (t: string) => {
      buffer.current = t;
      clearIdle();
      // Terminateur présent → on valide immédiatement.
      if (/[\r\n]/.test(t)) {
        emit(t);
        return;
      }
      // Sinon, on attend une courte pause sans nouvelle frappe.
      idleTimer.current = setTimeout(() => emit(buffer.current), SCAN_IDLE_MS);
    },
    [emit, clearIdle],
  );

  const handleSubmit = useCallback(
    (e: NativeSyntheticEvent<TextInputSubmitEditingEventData>) => {
      emit(e.nativeEvent.text ?? buffer.current);
    },
    [emit],
  );

  useEffect(() => clearIdle, [clearIdle]);

  return (
    <View style={styles.hidden} pointerEvents="none">
      <TextInput
        ref={ref}
        onChangeText={handleChange}
        onSubmitEditing={handleSubmit}
        onBlur={() => requestAnimationFrame(focus)}
        blurOnSubmit={false}
        autoFocus
        multiline
        showSoftInputOnFocus={false}
        caretHidden
        autoCapitalize="none"
        autoCorrect={false}
        spellCheck={false}
        style={styles.input}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  // Champ hors écran : invisible et sans emprise sur la mise en page, mais
  // toujours monté et focalisé pour capter les frappes DataWedge.
  hidden: { position: 'absolute', width: 1, height: 1, opacity: 0, top: -1000, left: -1000 },
  input: { width: 1, height: 1 },
});
