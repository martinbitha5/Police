'use client';

import { createContext, useContext, useEffect, useState, type CSSProperties, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import type { Profile } from '@police/shared';
import { createClient } from '@/supabase/client';
import { glassStrong } from '@/ui/theme';
import { IconBag, IconLogout } from './icons';

const HUB = process.env.NEXT_PUBLIC_HUB ?? 'FIH';

function formatToday(): string {
  const s = new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  return s.charAt(0).toUpperCase() + s.slice(1);
}

const SessionCtx = createContext<Profile | null>(null);
export function useSession(): Profile | null {
  return useContext(SessionCtx);
}

export function AppShell({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [authed, setAuthed] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    (async () => {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) {
        router.replace('/login');
        return;
      }
      setAuthed(true);
      const { data: prof } = await supabase.from('profiles').select('*').eq('id', auth.user.id).single();
      setProfile((prof as Profile | null) ?? null);
    })();
  }, [router]);

  async function logout() {
    await createClient().auth.signOut();
    router.replace('/login');
  }

  return (
    <SessionCtx.Provider value={profile}>
      <div style={s.layout}>
        <aside style={s.sidebar}>
          <div style={s.brandBox}>
            <div style={s.brandMark}>
              <IconBag size={20} />
            </div>
            <div>
              <div style={s.brand}>Litige Bagage</div>
              <div style={s.brandSub}>Hub {HUB}</div>
            </div>
          </div>

          <nav style={s.nav}>
            <div style={{ ...s.navItem, ...s.navItemActive }}>
              <span style={s.navAccent} />
              <IconBag size={18} />
              <span>Litiges bagage</span>
            </div>
          </nav>

          <div style={s.dateBox}>{formatToday()}</div>

          <div style={s.user}>
            <div style={s.userRow}>
              <div style={s.avatar}>{(profile?.full_name ?? '?').charAt(0).toUpperCase()}</div>
              <div style={{ overflow: 'hidden' }}>
                <div style={s.userName}>{profile?.full_name ?? '—'}</div>
                <div style={s.userRole}>{profile?.role ?? ''}</div>
              </div>
            </div>
            <button onClick={logout} style={s.logout}>
              <IconLogout size={16} />
              Déconnexion
            </button>
          </div>
        </aside>

        <main style={s.main}>{authed ? children : <div style={s.centered}>Chargement…</div>}</main>
      </div>
    </SessionCtx.Provider>
  );
}

const s: Record<string, CSSProperties> = {
  layout: { display: 'flex', minHeight: '100vh' },
  sidebar: {
    ...glassStrong,
    width: 264,
    borderTop: 'none',
    borderBottom: 'none',
    borderLeft: 'none',
    padding: '20px 14px',
    display: 'flex',
    flexDirection: 'column',
    position: 'sticky',
    top: 0,
    height: '100vh',
  },
  brandBox: { display: 'flex', alignItems: 'center', gap: 12, padding: '0 6px 20px' },
  brandMark: {
    width: 38,
    height: 38,
    borderRadius: 11,
    background: 'var(--primary)',
    color: '#fff',
    display: 'grid',
    placeItems: 'center',
    flexShrink: 0,
    boxShadow: '0 6px 16px rgba(37,99,235,0.45)',
  },
  brand: { fontWeight: 800, fontSize: 16, letterSpacing: -0.3 },
  brandSub: { color: 'var(--muted)', fontSize: 12, marginTop: 1 },

  nav: { display: 'flex', flexDirection: 'column', gap: 4 },
  navItem: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '11px 14px',
    borderRadius: 10,
    color: 'var(--muted)',
    fontSize: 14,
    fontWeight: 600,
    textDecoration: 'none',
  },
  navItemActive: { background: 'rgba(37,99,235,0.16)', color: 'var(--text)' },
  navAccent: { position: 'absolute', left: 0, top: 9, bottom: 9, width: 3, borderRadius: 3, background: 'var(--primary)' },

  dateBox: { marginTop: 'auto', color: 'var(--muted)', fontSize: 12, padding: '0 8px 12px' },

  user: { display: 'flex', flexDirection: 'column', gap: 10, borderTop: '1px solid var(--glass-border)', paddingTop: 14 },
  userRow: { display: 'flex', alignItems: 'center', gap: 10 },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: '50%',
    background: 'linear-gradient(135deg, var(--primary), #1d4ed8)',
    color: '#fff',
    display: 'grid',
    placeItems: 'center',
    fontWeight: 700,
    flexShrink: 0,
  },
  userName: { fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  userRole: { color: 'var(--muted)', fontSize: 12, textTransform: 'capitalize' },
  logout: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    background: 'transparent',
    border: '1px solid var(--glass-border)',
    color: 'var(--danger)',
    borderRadius: 10,
    padding: '9px 10px',
    fontWeight: 600,
    fontSize: 14,
  },

  main: { flex: 1, overflow: 'auto', minWidth: 0 },
  centered: { color: 'var(--muted)', display: 'grid', placeItems: 'center', height: '60vh' },
};
