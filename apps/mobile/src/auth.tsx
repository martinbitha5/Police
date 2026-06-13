import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { Session } from '@supabase/supabase-js';
import type { Profile } from '@police/shared';
import { supabase } from './supabase';
import { resetOnboarded } from './settings';

interface AuthState {
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthState | undefined>(undefined);

/**
 * Traduit les messages d'erreur techniques de Supabase en messages clairs
 * pour l'agent (pas de jargon développeur).
 */
function friendlyAuthError(raw: string): string {
  const m = raw.toLowerCase();

  if (m.includes('invalid login credentials')) {
    return 'Email ou mot de passe incorrect. Vérifiez vos identifiants.';
  }
  if (m.includes('email not confirmed')) {
    return 'Ce compte n’est pas encore activé. Contactez votre superviseur.';
  }
  if (m.includes('invalid email') || m.includes('unable to validate email')) {
    return 'Adresse email invalide.';
  }
  if (m.includes('user not found')) {
    return 'Aucun compte ne correspond à cet email.';
  }
  if (m.includes('too many requests') || m.includes('rate limit')) {
    return 'Trop de tentatives. Patientez un instant avant de réessayer.';
  }
  if (
    m.includes('network') ||
    m.includes('fetch') ||
    m.includes('failed to fetch') ||
    m.includes('timeout')
  ) {
    return 'Connexion impossible. Vérifiez votre réseau et réessayez.';
  }
  if (m.includes('password')) {
    return 'Mot de passe incorrect.';
  }

  // Repli générique — jamais le message brut technique.
  return 'Connexion impossible. Vérifiez vos identifiants et réessayez.';
}

async function fetchProfile(userId: string): Promise<Profile | null> {
  try {
    const { data } = await supabase.from('profiles').select('*').eq('id', userId).single();
    return (data as Profile | null) ?? null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    // Charge le profil en arrière-plan : ne bloque jamais l'affichage initial.
    const loadProfile = async (userId: string) => {
      const p = await fetchProfile(userId);
      if (mounted) setProfile(p);
    };

    // getSession() lit la session locale (AsyncStorage) — quasi instantané.
    // On libère l'écran de chargement tout de suite, sans attendre le réseau.
    supabase.auth
      .getSession()
      .then(({ data, error }) => {
        if (!mounted) return;
        if (error) {
          // Session corrompue ou refresh token invalide dès le démarrage
          setLoading(false);
          void supabase.auth.signOut();
          return;
        }
        setSession(data.session);
        setLoading(false);
        if (data.session) void loadProfile(data.session.user.id);
      })
      .catch(() => {
        if (mounted) {
          setLoading(false);
          void supabase.auth.signOut();
        }
      });

    const { data: sub } = supabase.auth.onAuthStateChange((event, next) => {
      if (!mounted) return;
      setSession(next);
      if (next) {
        void loadProfile(next.user.id);
      } else {
        setProfile(null);
        // Refresh token révoqué côté serveur : vider le flag onboarding
        // pour que le prochain démarrage repasse proprement par le login.
        if (event === 'SIGNED_OUT') {
          void resetOnboarded();
        }
      }
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  async function signIn(email: string, password: string) {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error ? friendlyAuthError(error.message) : null };
  }

  async function signOut() {
    // Réinitialise l'onboarding : après déconnexion + fermeture de l'app,
    // la réouverture repasse par l'écran d'accueil, puis le login.
    await resetOnboarded();
    await supabase.auth.signOut();
  }

  async function refreshProfile() {
    const uid = session?.user.id;
    if (uid) setProfile(await fetchProfile(uid));
  }

  return (
    <AuthContext.Provider value={{ session, profile, loading, signIn, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth doit être utilisé dans AuthProvider');
  return ctx;
}
