import Link from 'next/link';
import { SITE_APPS } from '@/lib/site-apps';
import { IconPlane, IconSearch, IconBag, IconLogin } from './icons';

/**
 * Rangée de raccourcis affichée à la place de l'en-tête sur téléphone dès
 * qu'on défile (voir globals.css, .pb-full / .pb-icons).
 *
 * L'échange est fait en CSS d'après `data-scrolled` : la barre ne se
 * reconstruit pas à chaque pixel défilé. Sur écran large elle ne sort jamais,
 * l'en-tête complet y tient sans gêner.
 */

const ICONS: Record<string, (p: { size?: number }) => React.ReactElement> = {
  'Suivi bagage': IconSearch,
  'Litiges bagage': IconBag,
  'Espace superviseur': IconLogin,
};

export function QuickBar() {
  return (
    <nav className="pb-icons pb-icons-fixed" style={{ height: 60 }} aria-label="Raccourcis">
      <Link href="/" className="pb-icon pb-icon-on" aria-label="Vols du jour">
        <IconPlane size={20} />
      </Link>
      {SITE_APPS.map((app) => {
        const Icon = ICONS[app.label] ?? IconPlane;
        const cta = app.label === 'Espace superviseur';
        return (
          <a
            key={app.url}
            href={app.url}
            target="_blank"
            rel="noopener noreferrer"
            className={`pb-icon${cta ? ' pb-icon-cta' : ''}`}
            aria-label={app.label}
          >
            {cta ? (
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
  );
}
