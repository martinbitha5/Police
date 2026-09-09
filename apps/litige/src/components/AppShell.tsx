'use client';

import { createContext, useContext, useEffect, useState, type CSSProperties, type ReactNode } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { Profile } from '@police/shared';
import { createClient } from '@/supabase/client';
import { useIsMobile } from '@/hooks/useIsMobile';
import { btnSecondary } from '@/ui/theme';
import { IconBag, IconLogout, IconMenu, IconPlane, IconSearch, IconLogin } from './icons';
import { SITE_APPS } from '@/lib/site-apps';
import { Footer } from './Footer';

const HUB = process.env.NEXT_PUBLIC_HUB ?? 'FIH';

// Raccourcis de la barre compacte sur téléphone, après le menu et les litiges.
// L'application n'a qu'un seul écran : les cellules restantes mènent aux
// portails voisins, dont l'espace superviseur en pastille pleine.
const APP_ICON: Record<string, (p: { size?: number }) => ReactNode> = {
  'Suivi bagage': IconSearch,
  'Vols du jour': IconPlane,
  'Espace superviseur': IconLogin,
};

const QUICK_APPS = SITE_APPS.map((a) => ({
  label: a.label,
  url: a.url,
  icon: APP_ICON[a.label] ?? IconBag,
  cta: a.label === 'Espace superviseur',
}));

function formatToday(): string {
  const s = new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  return s.charAt(0).toUpperCase() + s.slice(1);
}

const SessionCtx = createContext<Profile | null>(null);
export function useSession(): Profile | null { return useContext(SessionCtx); }

export function AppShell({ children }: { children: ReactNode }) {
  const router    = useRouter();
  const isMobile  = useIsMobile();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [authed, setAuthed]   = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    (async () => {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) { router.replace('/login'); return; }
      setAuthed(true);
      const { data: prof } = await supabase.from('profiles').select('*').eq('id', auth.user.id).single();
      setProfile((prof as Profile | null) ?? null);
    })();
  }, [router]);

  async function logout() {
    await createClient().auth.signOut();
    router.replace('/login');
  }

  // ── Mobile ──────────────────────────────────────────────────
  if (isMobile) {
    return (
      <SessionCtx.Provider value={profile}>
        <div style={m.root}>
          {/* Barre du haut, blanche, collante, deux états : la marque en haut
              de page, une rangée de raccourcis dès qu'on défile. L'échange est
              fait en CSS (globals.css, .pb-full / .pb-icons) d'après
              `data-scrolled`, sans état React qui se rejouerait à chaque pixel.
              Les deux états font 60 px, la hauteur sur laquelle le tiroir
              s'ouvre : une barre qui rétrécit décalerait la page en défilant. */}
          <header className="pb-topbar" style={m.topBar}>
            <div className="pb-bar pb-full" style={m.topBarInner}>
              <div style={m.topBrand}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/logo.png" alt="Litige Bagage" style={m.topLogo} />
                  <div>
                    <span style={m.topBrandName}>Litige Bagage</span>
                    <span style={m.topBrandHub}>Hub {HUB}</span>
                  </div>
                </div>
              </div>
              <div style={m.topRight}>
                {profile ? <div style={m.topAvatar}>{(profile.full_name ?? '?').charAt(0).toUpperCase()}</div> : null}
                <button style={m.menuBtn} onClick={() => setMenuOpen(v => !v)} aria-label="Menu">
                  <HamburgerIcon open={menuOpen} />
                </button>
              </div>
            </div>

            <nav className="pb-icons" style={m.topBarIcons} aria-label="Raccourcis">
              <button
                className={`pb-icon${menuOpen ? ' pb-icon-on' : ''}`}
                onClick={() => setMenuOpen(v => !v)}
                aria-label="Menu"
              >
                <IconMenu size={22} />
              </button>
              <Link href="/litiges" className="pb-icon pb-icon-on" aria-label="Litiges bagage" onClick={() => setMenuOpen(false)}>
                <IconBag size={20} />
              </Link>
              {QUICK_APPS.map((q) => {
                const Icon = q.icon;
                return (
                  <a
                    key={q.label}
                    href={q.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`pb-icon${q.cta ? ' pb-icon-cta' : ''}`}
                    aria-label={q.label}
                  >
                    {q.cta ? (
                      <span className="pb-icon-pill">
                        <Icon size={19} />
                      </span>
                    ) : (
                      <Icon size={20} />
                    )}
                  </a>
                );
              })}
            </nav>
          </header>

          {menuOpen ? (
            <div style={m.drawer}>
              <div style={m.drawerUser}>
                <div style={m.drawerAvatar}>{(profile?.full_name ?? '?').charAt(0).toUpperCase()}</div>
                <div>
                  <div style={m.drawerName}>{profile?.full_name ?? 'N/A'}</div>
                  <div style={m.drawerRole}>{profile?.role ?? ''}</div>
                </div>
              </div>
              <div className="nav-item" aria-current="page" style={{ ...m.drawerItem, ...m.drawerItemActive }}>
                {/* L'icône seule porte l'accent : le libellé reste noir. */}
                <span style={{ display: 'inline-flex', color: 'var(--accent)' }}>
                  <IconBag size={18} />
                </span>
                <span>Litiges bagage</span>
              </div>
              <button style={m.drawerLogout} onClick={logout}>
                <IconLogout size={16} /> Déconnexion
              </button>
            </div>
          ) : null}

          <main style={m.main}>
            {authed ? children : <div style={m.loading}>Chargement…</div>}
            <Footer />
          </main>
        </div>
      </SessionCtx.Provider>
    );
  }

  // ── Desktop ──────────────────────────────────────────────────
  return (
    <SessionCtx.Provider value={profile}>
      <div style={d.layout}>
        <aside style={d.sidebar}>
          <div style={d.brandBox}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.png" alt="Litige Bagage" style={d.brandLogo} />
            <div>
              <div style={d.brand}>Litige Bagage</div>
              <div style={d.brandSub}>Hub {HUB}</div>
            </div>
          </div>

          <nav style={d.nav} aria-label="Navigation principale">
            <div className="nav-item" aria-current="page" style={{ ...d.navItem, ...d.navItemActive }}>
              <span style={{ display: 'inline-flex', color: 'var(--accent)' }}>
                <IconBag size={18} />
              </span>
              <span>Litiges bagage</span>
            </div>
          </nav>

          <div style={d.dateBox}>{formatToday()}</div>

          {/* Partenaire : libellé et logo sur la même ligne */}
          <div style={d.partnerBox}>
            <span style={d.partnerLabel}>Partenaire</span>
            <span style={d.partnerPill}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/air.png" alt="Air Congo" style={d.partnerLogo} />
            </span>
          </div>

          <div style={d.user}>
            <div style={d.userRow}>
              <div style={d.avatar}>{(profile?.full_name ?? '?').charAt(0).toUpperCase()}</div>
              <div style={{ overflow: 'hidden' }}>
                <div style={d.userName}>{profile?.full_name ?? 'N/A'}</div>
                <div style={d.userRole}>{profile?.role ?? ''}</div>
              </div>
            </div>
            <button onClick={logout} style={d.logout}>
              <IconLogout size={16} /> Déconnexion
            </button>
          </div>
        </aside>

        <main style={d.main}>
          <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100%' }}>
            <div style={{ flex: 1 }}>
              {authed ? children : <div style={d.centered}>Chargement…</div>}
            </div>
            <Footer />
          </div>
        </main>
      </div>
    </SessionCtx.Provider>
  );
}

/** Icône hamburger / croix animée. */
function HamburgerIcon({ open }: { open: boolean }) {
  const bar: CSSProperties = { width: 22, height: 2, borderRadius: 2, background: 'var(--content-primary)', transition: 'all 0.2s' };
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5, padding: 2 }}>
      <span style={{ ...bar, transform: open ? 'rotate(45deg) translate(5px, 5px)' : 'none' }} />
      <span style={{ ...bar, opacity: open ? 0 : 1 }} />
      <span style={{ ...bar, transform: open ? 'rotate(-45deg) translate(5px, -5px)' : 'none' }} />
    </div>
  );
}

// Entrée de navigation : pilule pleine largeur. Au repos texte gris poids
// 500 ; active fond gris soutenu, texte noir poids 600. Le survol (fond
// --bg-neutral) est porté par la classe .nav-item dans globals.css.
const NAV_ITEM: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 12,
  padding: '10px 14px',
  borderRadius: 9999,
  color: 'var(--content-secondary)',
  fontSize: 14,
  fontWeight: 500,
  textDecoration: 'none',
};

const NAV_ITEM_ACTIVE: CSSProperties = {
  background: 'var(--bg-neutral-hover)',
  color: 'var(--content-primary)',
  fontWeight: 600,
};

// ── Styles mobile ───────────────────────────────────────────────
const m: Record<string, CSSProperties> = {
  root: { display: 'flex', flexDirection: 'column', minHeight: '100vh', background: 'var(--bg-screen)' },

  // L'enveloppe ne porte pas la mise en page : elle accueille deux rangées
  // dont une seule est visible à la fois. Le `display` reste aux classes
  // .pb-full / .pb-icons, qu'un style inline empêcherait de masquer.
  topBar: {
    position: 'sticky',
    top: 0,
    zIndex: 20,
    background: 'var(--bg-screen)',
    borderBottom: '1px solid var(--divider)',
  },
  topBarInner: {
    height: 60,
    justifyContent: 'space-between',
    padding: '0 16px',
  },
  // Pas de marge latérale : les cellules vont d'un bord à l'autre, séparées
  // par des filets, comme une rangée d'onglets.
  topBarIcons: { height: 60 },
  topBrand: { display: 'flex', alignItems: 'center', gap: 1 },
  topLogo: { width: 30, height: 30, borderRadius: 8, objectFit: 'cover' as const, display: 'block', flexShrink: 0 },
  topBrandName: {
    display: 'block',
    fontFamily: 'var(--font-display)',
    fontWeight: 700,
    fontSize: 15,
    letterSpacing: '-0.02em',
    color: 'var(--content-primary)',
  },
  topBrandHub: { display: 'block', color: 'var(--content-secondary)', fontSize: 12, fontWeight: 500 },
  topRight: { display: 'flex', alignItems: 'center', gap: 10 },
  topAvatar: {
    width: 34,
    height: 34,
    borderRadius: '50%',
    background: 'var(--bg-neutral)',
    color: 'var(--content-primary)',
    display: 'grid',
    placeItems: 'center',
    fontWeight: 700,
    fontSize: 14,
  },
  menuBtn: { background: 'transparent', border: 'none', padding: 6, display: 'grid', placeItems: 'center' },

  drawer: {
    position: 'fixed',
    top: 61,
    left: 0,
    right: 0,
    zIndex: 15,
    padding: '14px 14px 16px',
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
    background: 'var(--bg-screen)',
    borderBottom: '1px solid var(--divider)',
    boxShadow: 'var(--shadow-card)',
    // Petits écrans : le menu défile au lieu de déborder.
    maxHeight: 'calc(100vh - 61px)',
    overflowY: 'auto',
  },
  drawerUser: { display: 'flex', alignItems: 'center', gap: 12, padding: '6px 6px 14px', borderBottom: '1px solid var(--divider)', marginBottom: 6 },
  drawerAvatar: {
    width: 42,
    height: 42,
    borderRadius: '50%',
    background: 'var(--bg-neutral)',
    color: 'var(--content-primary)',
    display: 'grid',
    placeItems: 'center',
    fontWeight: 700,
    fontSize: 16,
    flexShrink: 0,
  },
  drawerName: { fontWeight: 600, fontSize: 15, color: 'var(--content-primary)' },
  drawerRole: { color: 'var(--content-secondary)', fontSize: 12, textTransform: 'capitalize', marginTop: 2 },
  drawerItem: { ...NAV_ITEM, padding: '12px 16px', fontSize: 15 },
  drawerItemActive: NAV_ITEM_ACTIVE,
  drawerLogout: { ...btnSecondary, width: '100%', marginTop: 8, fontSize: 14 },

  main: { flex: 1, padding: '0 0 24px' },
  loading: { color: 'var(--content-secondary)', display: 'grid', placeItems: 'center', height: '60vh' },
};

// ── Styles desktop ──────────────────────────────────────────────
const d: Record<string, CSSProperties> = {
  layout: { display: 'flex', minHeight: '100vh', background: 'var(--bg-screen)' },
  sidebar: {
    width: 260,
    background: 'var(--bg-screen)',
    borderRight: '1px solid var(--divider)',
    padding: '20px 12px 16px',
    display: 'flex',
    flexDirection: 'column',
    position: 'sticky',
    top: 0,
    height: '100vh',
    flexShrink: 0,
  },
  brandBox: { display: 'flex', alignItems: 'center', gap: 11, padding: '0 8px 22px' },
  brandLogo: {
    width: 34,
    height: 34,
    borderRadius: 8,
    objectFit: 'cover' as const,
    display: 'block',
    flexShrink: 0,
  },
  brand: {
    fontFamily: 'var(--font-display)',
    fontWeight: 700,
    fontSize: 15,
    letterSpacing: '-0.02em',
    color: 'var(--content-primary)',
  },
  brandSub: { color: 'var(--content-secondary)', fontSize: 12, marginTop: 1, fontWeight: 500 },

  nav: { display: 'flex', flexDirection: 'column', gap: 2 },
  navItem: NAV_ITEM,
  navItemActive: NAV_ITEM_ACTIVE,

  dateBox: { marginTop: 'auto', color: 'var(--content-tertiary)', fontSize: 12, padding: '0 14px 12px' },

  // Libellé et logo sur la MÊME ligne : le libellé à gauche, le logo à droite.
  partnerBox: {
    borderTop: '1px solid var(--divider)',
    padding: '12px 12px 10px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  partnerLabel: {
    fontSize: 12,
    fontWeight: 600,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
    color: 'var(--content-tertiary)',
  },
  partnerPill: {
    display: 'inline-flex',
    alignItems: 'center',
    background: 'var(--bg-elevated)',
    border: '1px solid var(--divider)',
    borderRadius: 9999,
    padding: '7px 13px',
    flexShrink: 0,
  },
  partnerLogo: { height: 22, objectFit: 'contain' as const, display: 'block' },

  user: { display: 'flex', flexDirection: 'column', gap: 10, borderTop: '1px solid var(--divider)', paddingTop: 14 },
  userRow: { display: 'flex', alignItems: 'center', gap: 10, padding: '0 4px' },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: '50%',
    background: 'var(--bg-neutral)',
    color: 'var(--content-primary)',
    display: 'grid',
    placeItems: 'center',
    fontWeight: 700,
    fontSize: 14,
    flexShrink: 0,
  },
  userName: { fontWeight: 600, fontSize: 14, color: 'var(--content-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  userRole: { color: 'var(--content-secondary)', fontSize: 12, textTransform: 'capitalize' },
  logout: { ...btnSecondary, width: '100%', height: 40, fontSize: 14 },

  main: { flex: 1, overflow: 'auto', minWidth: 0, background: 'var(--bg-screen)' },
  centered: { color: 'var(--content-secondary)', display: 'grid', placeItems: 'center', height: '60vh' },
};
