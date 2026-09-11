import Link from 'next/link';
import { TrustShell } from '@/components/TrustShell';
import { IconCheck, IconChevron, IconLock, Mark, StatusDot, Tag } from '@/components/marks';
import { AUDITS, COMPLIANCE, CONTROL_GROUPS, OTHER_RESOURCES, SUBPROCESSORS, UPDATED } from '@/lib/trust-data';

/**
 * Aperçu : à gauche la conformité et les ressources, à droite les contrôles
 * par famille (trois par carte, le reste sur la page Contrôles) puis les
 * sous-traitants. Même disposition que le Trust Center pris pour modèle.
 */
export default function OverviewPage() {
  return (
    <TrustShell>
      <div className="tc-grid">
        <div className="tc-col">
          <section className="tc-block">
            <div className="tc-h2-row">
              <h2 className="tc-h2">Conformité</h2>
            </div>
            <div className="tc-card">
              {COMPLIANCE.map((c) => (
                <div key={c.name} className="tc-row">
                  <span className={`tc-seal${c.status === 'en cours' ? ' tc-seal-wip' : ''}`} aria-hidden="true">
                    {c.name.includes('27001') ? <span className="tc-seal-text">ISO<br />27001</span> : <IconCheck size={16} />}
                  </span>
                  <div className="tc-row-body">
                    <div className="tc-row-title">{c.name} <Tag status={c.status} /></div>
                    <div className="tc-row-sub">{c.detail}</div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="tc-block">
            <div className="tc-h2-row">
              <h2 className="tc-h2">Ressources</h2>
              <Link href="/resources" className="tc-link">Tout voir</Link>
            </div>
            <div className="tc-card">
              <div className="tc-sub">Audits</div>
              <ul className="tc-list">
                {AUDITS.map((r) => (
                  <li key={r.id} className="tc-res">
                    <Link href={`/resources#${r.id}`} className="tc-res-link">{r.title}</Link>
                    <span className="tc-res-lock"><IconLock /></span>
                  </li>
                ))}
              </ul>
              <div className="tc-sub">Autres ressources</div>
              <ul className="tc-list">
                {OTHER_RESOURCES.map((r) => (
                  <li key={r.id} className="tc-res">
                    <Link href={`/resources#${r.id}`} className="tc-res-link">{r.title}</Link>
                    <span className="tc-res-lock"><IconLock /></span>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        </div>

        <div className="tc-col tc-col-wide">
          <section className="tc-block">
            <div className="tc-h2-row">
              <h2 className="tc-h2">Contrôles</h2>
              <span className="tc-pill"><IconCheck size={13} /> Mis à jour le {UPDATED}</span>
              <Link href="/controls" className="tc-link tc-link-right">Tout voir</Link>
            </div>
            <div className="tc-groups">
              {CONTROL_GROUPS.map((g) => (
                <div key={g.slug} className="tc-card tc-group">
                  <Link href={`/controls#${g.slug}`} className="tc-group-title">
                    <span>{g.title}</span>
                    <IconChevron />
                  </Link>
                  <ul className="tc-list">
                    {g.items.slice(0, 3).map((it) => (
                      <li key={it.title} className="tc-ctl">
                        <StatusDot status={it.status} />
                        <span className="tc-ctl-text">{it.title}</span>
                      </li>
                    ))}
                  </ul>
                  {g.items.length > 3 ? (
                    <Link href={`/controls#${g.slug}`} className="tc-link">
                      Voir {g.items.length - 3} autres contrôles
                    </Link>
                  ) : null}
                </div>
              ))}
            </div>
          </section>

          <section className="tc-block">
            <div className="tc-h2-row">
              <h2 className="tc-h2">Sous-traitants</h2>
              <Link href="/subprocessors" className="tc-link">Tout voir</Link>
            </div>
            <div className="tc-card">
              {SUBPROCESSORS.slice(0, 4).map((s) => (
                <div key={s.name} className="tc-sp">
                  <Mark text={s.name.charAt(0)} />
                  <span className="tc-sp-name">{s.name}</span>
                  <span className="tc-sp-role">{s.role}</span>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </TrustShell>
  );
}
