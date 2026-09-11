'use client';

import { useMemo, useState } from 'react';
import { TrustShell } from '@/components/TrustShell';
import { IconCheck, IconSearch, StatusDot } from '@/components/marks';
import { CONTROL_GROUPS, CONTROLS_TOTAL, UPDATED } from '@/lib/trust-data';

/**
 * Contrôles : un tableau par famille (contrôle, description, état), une
 * navigation latérale par famille et une recherche qui filtre les lignes.
 */
export default function ControlsPage() {
  const [q, setQ] = useState('');
  const needle = q.trim().toLowerCase();

  const groups = useMemo(
    () =>
      CONTROL_GROUPS.map((g) => ({
        ...g,
        items: needle ? g.items.filter((it) => `${it.title} ${it.desc}`.toLowerCase().includes(needle)) : g.items,
      })),
    [needle],
  );
  const shown = groups.reduce((n, g) => n + g.items.length, 0);

  return (
    <TrustShell>
      <div className="tc-page">
        <aside className="tc-side">
          <div className="tc-side-title">
            Contrôles
            <span className="tc-pill"><IconCheck size={13} /> Mis à jour le {UPDATED}</span>
          </div>
          <nav className="tc-side-nav" aria-label="Familles de contrôles">
            {CONTROL_GROUPS.map((g) => (
              <a key={g.slug} href={`#${g.slug}`} className="tc-side-link">{g.title}</a>
            ))}
          </nav>
        </aside>

        <div className="tc-content">
          <div className="tc-toolbar">
            <label className="tc-search">
              <IconSearch />
              <input
                type="search"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Rechercher un contrôle"
                aria-label="Rechercher un contrôle"
              />
            </label>
            <span className="tc-count">{shown} sur {CONTROLS_TOTAL} contrôles</span>
          </div>

          {groups.map((g) =>
            g.items.length === 0 ? null : (
              <section key={g.slug} id={g.slug} className="tc-anchor">
                <h2 className="tc-h2">{g.title}</h2>
                <div className="tc-card tc-card-lines">
                  <div className="tc-thead">
                    <span>Contrôle</span>
                    <span>État</span>
                  </div>
                  {g.items.map((it) => (
                    <div key={it.title} className="tc-line tc-line-ctl">
                      <div className="tc-line-body">
                        <div className="tc-line-title">{it.title}</div>
                        <div className="tc-line-sub">{it.desc}</div>
                      </div>
                      <div className="tc-line-state">
                        <StatusDot status={it.status} />
                        <span className="tc-line-state-text">{it.status}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            ),
          )}

          {shown === 0 ? <p className="tc-note">Aucun contrôle ne correspond à cette recherche.</p> : null}

          <p className="tc-legend">
            <StatusDot status="en place" /> en place
            <span className="tc-legend-gap" />
            <StatusDot status="en cours" /> en cours de mise en place
          </p>
        </div>
      </div>
    </TrustShell>
  );
}
