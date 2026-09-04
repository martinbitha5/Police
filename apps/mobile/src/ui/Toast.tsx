import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CheckCircle, Info, Warning, WarningOctagon } from 'phosphor-react-native';
import { useTheme } from './theme';
import { Pressable } from './Pressable';
import { Text } from './Text';

/**
 * Toast.
 *
 * Un seul toast à la fois : le suivant remplace le précédent. Une pile de
 * toasts est un journal, pas du feedback.
 */

export type ToastTone = 'success' | 'error' | 'info' | 'warning';

export interface ToastOptions {
  tone?: ToastTone;
  /** Durée d'affichage en ms. 0 = persistant jusqu'au tap. */
  duration?: number;
}

interface ToastApi {
  show: (message: string, options?: ToastOptions) => void;
  success: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;
  dismiss: () => void;
}

interface ActiveToast {
  id: number;
  message: string;
  tone: ToastTone;
}

const ToastContext = createContext<ToastApi | null>(null);

export function useToast(): ToastApi {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast doit être utilisé à l'intérieur d'un <ToastProvider>.");
  }
  return context;
}

const DEFAULT_DURATION = 3500;
/** Une erreur mérite plus de temps de lecture qu'une confirmation. */
const ERROR_DURATION = 5000;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toast, setToast] = useState<ActiveToast | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const counter = useRef(0);

  const dismiss = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
    setToast(null);
  }, []);

  const show = useCallback((message: string, options?: ToastOptions) => {
    if (timer.current) clearTimeout(timer.current);
    const tone = options?.tone ?? 'info';
    counter.current += 1;
    setToast({ id: counter.current, message, tone });

    const duration = options?.duration ?? (tone === 'error' ? ERROR_DURATION : DEFAULT_DURATION);
    if (duration > 0) {
      timer.current = setTimeout(() => setToast(null), duration);
    }
  }, []);

  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  const api = useMemo<ToastApi>(
    () => ({
      show,
      success: (message) => show(message, { tone: 'success' }),
      error: (message) => show(message, { tone: 'error' }),
      info: (message) => show(message, { tone: 'info' }),
      dismiss,
    }),
    [show, dismiss],
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      <ToastHost toast={toast} onDismiss={dismiss} />
    </ToastContext.Provider>
  );
}

function ToastHost({ toast, onDismiss }: { toast: ActiveToast | null; onDismiss: () => void }) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  // `current` reste monté le temps de l'animation de sortie.
  const [current, setCurrent] = useState<ActiveToast | null>(toast);
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (toast) {
      setCurrent(toast);
      progress.setValue(0);
      const anim = Animated.timing(progress, {
        toValue: 1,
        duration: theme.duration.base,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      });
      anim.start();
      return () => anim.stop();
    }
    const anim = Animated.timing(progress, {
      toValue: 0,
      duration: theme.duration.exit,
      easing: Easing.in(Easing.cubic),
      useNativeDriver: true,
    });
    anim.start(({ finished }) => {
      if (finished) setCurrent(null);
    });
    return () => anim.stop();
  }, [toast, progress, theme.duration.base, theme.duration.exit]);

  if (!current) return null;

  // Icônes blanches sur le pavé noir : les tons sémantiques sont calibrés
  // pour du blanc, pas pour du noir. La distinction repose sur la forme
  // (coche, octogone, triangle, cercle), lisible par tous.
  const iconColor = theme.colors.textInverse;

  const icons: Record<ToastTone, React.ReactNode> = {
    success: <CheckCircle size={theme.iconSize.sm} color={iconColor} weight="fill" />,
    error: <WarningOctagon size={theme.iconSize.sm} color={iconColor} weight="fill" />,
    warning: <Warning size={theme.iconSize.sm} color={iconColor} weight="fill" />,
    info: <Info size={theme.iconSize.sm} color={iconColor} weight="fill" />,
  };

  return (
    <View
      pointerEvents="box-none"
      style={[
        StyleSheet.absoluteFill,
        styles.host,
        { paddingTop: insets.top + theme.spacing.sm, zIndex: theme.zIndex.toast },
      ]}
    >
      <Animated.View
        style={{
          maxWidth: 560,
          width: '100%',
          paddingHorizontal: theme.screenPadding,
          opacity: progress,
          transform: [
            { translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [-12, 0] }) },
          ],
        }}
      >
        <Pressable
          noScale
          onPress={onDismiss}
          accessibilityRole="alert"
          accessibilityLiveRegion="polite"
          accessibilityLabel={current.message}
          accessibilityHint="Appuyez pour masquer"
          style={[
            styles.toast,
            theme.elevation[3],
            {
              backgroundColor: theme.colors.surfaceInverse,
              borderRadius: theme.radius.lg,
              paddingVertical: theme.spacing.md,
              paddingHorizontal: theme.spacing.base,
              gap: theme.spacing.sm,
            },
          ]}
        >
          {icons[current.tone]}
          <Text variant="label" color="textInverse" style={styles.message} numberOfLines={3}>
            {current.message}
          </Text>
        </Pressable>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  host: { alignItems: 'center' },
  toast: { flexDirection: 'row', alignItems: 'center' },
  message: { flex: 1 },
});
