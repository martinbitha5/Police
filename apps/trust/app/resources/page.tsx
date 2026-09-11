import { TrustShell } from '@/components/TrustShell';
import { CopyLink } from '@/components/CopyLink';
import { IconLock } from '@/components/marks';
import { AUDITS, OTHER_RESOURCES, requestMailto, type Resource } from '@/lib/trust-data';

export const metadata = { title: 'Ressources · Trust Center · Police Bagage' };

function ResourceRow({ r }: { r: Resource }) {
  return (
    <div id={r.id} className="tc-line">
      <div className="tc-line-body">
        <div className="tc-line-title">
          <span>{r.title}</span>
          <CopyLink anchor={r.id} label={r.title} />
        </div>
        {r.note ? <div className="tc-line-sub">{r.note}</div> : null}
      </div>
      {r.kind === 'request' ? (
        <a href={requestMailto(r.title)} className="tc-btn tc-btn-ghost">
          <IconLock /> Demander l’accès
        </a>
      ) : (
        <span className="tc-btn tc-btn-ghost tc-btn-off" aria-disabled="true">Bientôt</span>
      )}
    </div>
  );
}

export default function ResourcesPage() {
  return (
    <TrustShell>
      <div className="tc-page">
        <aside className="tc-side">
          <div className="tc-side-title">Ressources</div>
          <nav className="tc-side-nav" aria-label="Catégories">
            <a href="#audits" className="tc-side-link">Audits</a>
            <a href="#autres" className="tc-side-link">Autres ressources</a>
          </nav>
        </aside>

        <div className="tc-content">
          <p className="tc-note">
            Les documents ci-dessous sont communiqués sur demande aux compagnies partenaires, aux autorités
            et aux auditeurs, sous réserve de confidentialité. La demande se fait par e-mail ; une réponse
            est apportée sous cinq jours ouvrés.
          </p>

          <h2 id="audits" className="tc-h2 tc-anchor">Audits</h2>
          <div className="tc-card tc-card-lines">
            {AUDITS.map((r) => <ResourceRow key={r.id} r={r} />)}
          </div>

          <h2 id="autres" className="tc-h2 tc-anchor">Autres ressources</h2>
          <div className="tc-card tc-card-lines">
            {OTHER_RESOURCES.map((r) => <ResourceRow key={r.id} r={r} />)}
          </div>
        </div>
      </div>
    </TrustShell>
  );
}
