'use client';

import { useMemo, useState } from 'react';
import { TrustShell } from '@/components/TrustShell';
import { IconSearch, Mark } from '@/components/marks';
import { SUBPROCESSORS } from '@/lib/trust-data';

/** Sous-traitants : qui héberge ou soutient la plateforme, avec son rôle et sa localisation. */
export default function SubprocessorsPage() {
  const [q, setQ] = useState('');
  const needle = q.trim().toLowerCase();
  const rows = useMemo(
    () => (needle ? SUBPROCESSORS.filter((s) => `${s.name} ${s.role} ${s.where}`.toLowerCase().includes(needle)) : SUBPROCESSORS),
    [needle],
  );

  return (
    <TrustShell>
      <div className="tc-content tc-content-full">
        <div className="tc-toolbar">
          <h2 className="tc-h2" style={{ margin: 0 }}>Sous-traitants</h2>
          <label className="tc-search">
            <IconSearch />
            <input
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Rechercher"
              aria-label="Rechercher un sous-traitant"
            />
          </label>
        </div>

        <p className="tc-note">
          Prestataires qui hébergent ou soutiennent la plateforme. Chaque ligne indique le service rendu et
          la localisation du prestataire.
        </p>

        <div className="tc-card tc-card-lines">
          {rows.map((s) => (
            <div key={s.name} className="tc-line tc-line-sp">
              <Mark text={s.name.charAt(0)} />
              <div className="tc-line-body">
                <div className="tc-line-title">
                  <span>{s.name}</span>
                  <span className="tc-sp-role">{s.role}</span>
                </div>
                <div className="tc-line-sub">{s.where}</div>
              </div>
              <a href={s.url} target="_blank" rel="noopener noreferrer" className="tc-chip">Site</a>
            </div>
          ))}
          {rows.length === 0 ? <div className="tc-line"><span className="tc-line-sub">Aucun résultat.</span></div> : null}
        </div>

        <p className="tc-count" style={{ marginTop: 12 }}>{rows.length} sur {SUBPROCESSORS.length} sous-traitants</p>
      </div>
    </TrustShell>
  );
}
