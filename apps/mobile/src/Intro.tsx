import { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, Easing, Pressable, StyleSheet, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Barcode, CheckCircle } from 'phosphor-react-native';
import { blue, Text, useTheme } from '@/ui';

/** Durée totale, fondu de sortie compris. */
const TOTAL_MS = 3000;

const STEPS = ['Check-in', 'Bagages', 'Embarquement'] as const;

/**
 * Intro d'ouverture, avant la connexion.
 *
 * Trois secondes sur fond d'encre, comme l'écran d'accueil d'Uber : un cadre
 * de scan se dessine, une ligne de lecture le balaie deux fois, la lecture se
 * confirme d'une coche, le mot-marque monte, puis les trois gestes du terrain
 * se cochent l'un après l'autre. Le tout s'efface en fondu sur l'écran de
 * connexion.
 *
 * Tout passe par `Animated` avec le pilote natif : aucune image, aucune
 * vidéo, rien à charger. Un appui n'importe où saute l'intro ; la préférence
 * système « réduire les animations » la réduit à un fondu.
 */
export function Intro({ onDone }: { onDone: () => void }) {
  const theme = useTheme();
  const done = useRef(false);
  const [reduced, setReduced] = useState<boolean | null>(null);

  // Valeurs animées : une par élément, jamais de recalcul de mise en page.
  const root = useRef(new Animated.Value(1)).current;
  const frame = useRef(new Animated.Value(0)).current;
  const barcode = useRef(new Animated.Value(0)).current;
  const line = useRef(new Animated.Value(0)).current;
  const lineOpacity = useRef(new Animated.Value(0)).current;
  const check = useRef(new Animated.Value(0)).current;
  const brand = useRef(new Animated.Value(0)).current;
  const tagline = useRef(new Animated.Value(0)).current;
  const steps = useRef(STEPS.map(() => new Animated.Value(0))).current;

  const finish = (fadeMs: number) => {
    if (done.current) return;
    done.current = true;
    Animated.timing(root, { toValue: 0, duration: fadeMs, useNativeDriver: true }).start(() => onDone());
  };

  useEffect(() => {
    let alive = true;
    AccessibilityInfo.isReduceMotionEnabled()
      .then((value) => {
        if (alive) setReduced(value);
      })
      .catch(() => {
        if (alive) setReduced(false);
      });
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    if (reduced === null) return;

    // Animations refusées : tout est posé d'un coup, puis un simple fondu.
    if (reduced) {
      [frame, barcode, brand, tagline, ...steps].forEach((v) => v.setValue(1));
      check.setValue(1);
      const id = setTimeout(() => finish(theme.duration.base), 900);
      return () => clearTimeout(id);
    }

    const ease = Easing.bezier(...theme.easing.out);
    const sweep = Animated.sequence([
      Animated.timing(lineOpacity, { toValue: 1, duration: 120, useNativeDriver: true }),
      Animated.timing(line, { toValue: 1, duration: 620, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      Animated.timing(line, { toValue: 0, duration: 620, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      Animated.timing(lineOpacity, { toValue: 0, duration: 120, useNativeDriver: true }),
    ]);

    const sequence = Animated.parallel([
      // Le cadre se dessine, puis le code-barres apparaît dedans.
      Animated.spring(frame, { toValue: 1, ...theme.spring.base, useNativeDriver: true }),
      Animated.sequence([
        Animated.delay(260),
        Animated.timing(barcode, { toValue: 1, duration: 320, easing: ease, useNativeDriver: true }),
      ]),
      // La ligne de lecture balaie le cadre, aller puis retour.
      Animated.sequence([Animated.delay(480), sweep]),
      // Lecture confirmée : le code-barres cède la place à la coche.
      Animated.sequence([
        Animated.delay(1960),
        Animated.parallel([
          Animated.timing(barcode, { toValue: 0, duration: 160, useNativeDriver: true }),
          Animated.spring(check, { toValue: 1, ...theme.spring.snappy, useNativeDriver: true }),
        ]),
      ]),
      // Le mot-marque monte, la ligne dessous suit.
      Animated.sequence([
        Animated.delay(640),
        Animated.timing(brand, { toValue: 1, duration: 520, easing: ease, useNativeDriver: true }),
      ]),
      Animated.sequence([
        Animated.delay(920),
        Animated.timing(tagline, { toValue: 1, duration: 420, easing: ease, useNativeDriver: true }),
      ]),
      // Les trois gestes se cochent en cascade.
      ...steps.map((v, i) =>
        Animated.sequence([
          Animated.delay(1320 + i * theme.stagger.step * 5),
          Animated.timing(v, { toValue: 1, duration: 360, easing: ease, useNativeDriver: true }),
        ]),
      ),
    ]);

    sequence.start();
    const id = setTimeout(() => finish(theme.duration.slow), TOTAL_MS - theme.duration.slow);
    return () => {
      clearTimeout(id);
      sequence.stop();
    };
    // Les valeurs animées et le thème sont stables sur toute la vie du composant.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reduced]);

  const rise = (v: Animated.Value, from = 18) => ({
    opacity: v,
    transform: [{ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [from, 0] }) }],
  });

  const ink = theme.colors.surfaceInverse;
  const paper = theme.colors.textInverse;
  const accent = blue[300];
  const FRAME = 132;

  return (
    <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: ink, opacity: root }]}>
      <StatusBar style="light" />
      <Pressable
        style={styles.fill}
        onPress={() => finish(theme.duration.fast)}
        accessibilityRole="button"
        accessibilityLabel="Passer l'introduction"
      >
        <View style={styles.center}>
          {/* Cadre de scan : quatre coins, la ligne de lecture, le code-barres puis la coche. */}
          <Animated.View
            style={{
              width: FRAME,
              height: FRAME,
              opacity: frame,
              transform: [{ scale: frame.interpolate({ inputRange: [0, 1], outputRange: [0.82, 1] }) }],
            }}
          >
            {(['tl', 'tr', 'bl', 'br'] as const).map((corner) => (
              <View
                key={corner}
                style={[
                  styles.corner,
                  { borderColor: paper, borderRadius: theme.radius.sm / 2 },
                  corner === 'tl' && styles.tl,
                  corner === 'tr' && styles.tr,
                  corner === 'bl' && styles.bl,
                  corner === 'br' && styles.br,
                ]}
              />
            ))}

            <Animated.View style={[styles.center, StyleSheet.absoluteFill, { opacity: barcode }]}>
              <Barcode size={56} color={paper} />
            </Animated.View>

            <Animated.View
              style={[
                styles.center,
                StyleSheet.absoluteFill,
                {
                  opacity: check,
                  transform: [{ scale: check.interpolate({ inputRange: [0, 1], outputRange: [0.5, 1] }) }],
                },
              ]}
            >
              <CheckCircle size={60} color={accent} weight="fill" />
            </Animated.View>

            <Animated.View
              style={[
                styles.line,
                {
                  backgroundColor: accent,
                  opacity: lineOpacity,
                  transform: [
                    { translateY: line.interpolate({ inputRange: [0, 1], outputRange: [14, FRAME - 16] }) },
                  ],
                },
              ]}
            />
          </Animated.View>

          <Animated.View style={[{ marginTop: theme.spacing['2xl'], alignItems: 'center' }, rise(brand)]}>
            <Text
              variant="display"
              style={{ color: paper, fontFamily: theme.fontFamily.brand, fontSize: 34, lineHeight: 40 }}
            >
              Police Bagage
            </Text>
          </Animated.View>

          <Animated.View style={[{ marginTop: theme.spacing.sm }, rise(tagline, 10)]}>
            <Text variant="body" style={{ color: paper, opacity: 0.64 }}>
              Chaque bagage contrôlé avant la soute
            </Text>
          </Animated.View>
        </View>

        {/* Les trois gestes du terrain, cochés l'un après l'autre. */}
        <View style={[styles.steps, { paddingBottom: theme.spacing['4xl'], gap: theme.spacing.lg }]}>
          {STEPS.map((label, i) => (
            <Animated.View key={label} style={[styles.step, { gap: theme.spacing.sm }, rise(steps[i], 8)]}>
              <View style={[styles.dot, { backgroundColor: accent }]} />
              <Text variant="labelStrong" style={{ color: paper }}>
                {label}
              </Text>
            </Animated.View>
          ))}
        </View>
      </Pressable>
    </Animated.View>
  );
}

const CORNER = 26;
const STROKE = 3;

const styles = StyleSheet.create({
  fill: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  corner: { position: 'absolute', width: CORNER, height: CORNER },
  tl: { top: 0, left: 0, borderTopWidth: STROKE, borderLeftWidth: STROKE },
  tr: { top: 0, right: 0, borderTopWidth: STROKE, borderRightWidth: STROKE },
  bl: { bottom: 0, left: 0, borderBottomWidth: STROKE, borderLeftWidth: STROKE },
  br: { bottom: 0, right: 0, borderBottomWidth: STROKE, borderRightWidth: STROKE },
  line: { position: 'absolute', left: 10, right: 10, height: 2, borderRadius: 1 },
  steps: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  step: { flexDirection: 'row', alignItems: 'center' },
  dot: { width: 6, height: 6, borderRadius: 3 },
});
