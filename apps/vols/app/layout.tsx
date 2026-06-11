import type { ReactNode } from 'react';
import './globals.css';

export const metadata = {
  title: 'Vols du jour — Aéroport',
  description: 'Consultez les vols du jour et leur statut en temps réel : programmé, embarquement, fermé ou annulé.',
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
};

const CHUNK_RECOVERY = `(function(){function c(m){return /ChunkLoadError|Loading chunk|Loading CSS chunk|dynamically imported module|Importing a module script failed/i.test(m||'')}function r(){try{var k='__chunk_reload_ts',l=+sessionStorage.getItem(k)||0;if(Date.now()-l>10000){sessionStorage.setItem(k,Date.now());location.reload()}}catch(e){}}window.addEventListener('error',function(e){var t=e&&e.target;if(c(e&&e.message)||(t&&(t.tagName==='SCRIPT'||t.tagName==='LINK'))){r()}},true);window.addEventListener('unhandledrejection',function(e){var x=e&&e.reason;if(c(x&&(x.message||String(x)))){r()}});})();`;

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="fr">
      <head>
        <script dangerouslySetInnerHTML={{ __html: CHUNK_RECOVERY }} />
        <link rel="preload" href="/air%20congo.jpg" as="image" />
        <link rel="preload" href="/air.png" as="image" />
      </head>
      <body>{children}</body>
    </html>
  );
}
