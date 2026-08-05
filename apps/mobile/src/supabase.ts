import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !anonKey) {
  throw new Error('EXPO_PUBLIC_SUPABASE_URL et EXPO_PUBLIC_SUPABASE_ANON_KEY sont requis');
}

export const supabase = createClient(url, anonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

/**
 * Déconnexion limitée à CET appareil.
 *
 * Sur le terrain, plusieurs PDA peuvent tourner sur le même compte agent. La
 * portée par défaut de Supabase ('global') révoque le refresh token côté
 * serveur, donc TOUTES les sessions du compte : un agent qui se déconnecte, ou
 * un simple incident réseau au démarrage, faisait tomber les autres PDA en
 * « Session invalide ou expirée » au scan suivant. En portée 'local' on ne
 * vide que le stockage de cet appareil.
 */
export function signOutLocal() {
  return supabase.auth.signOut({ scope: 'local' });
}
