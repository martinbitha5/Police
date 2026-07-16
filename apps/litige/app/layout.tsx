import type { ReactNode } from 'react';
import { Inter, Archivo_Black } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'], display: 'swap', variable: '--font-inter' });
const archivo = Archivo_Black({ weight: '400', subsets: ['latin'], display: 'swap', variable: '--font-archivo' });

export const metadata = {
  title: 'Litige Bagage · Superviseur',
  description: 'Suivi et résolution des litiges bagage',
};

const CHUNK_RECOVERY = `(function(){function c(m){return /ChunkLoadError|Loading chunk|Loading CSS chunk|dynamically imported module|Importing a module script failed/i.test(m||'')}function r(){try{var k='__chunk_reload_ts',l=+sessionStorage.getItem(k)||0;if(Date.now()-l>10000){sessionStorage.setItem(k,Date.now());location.reload()}}catch(e){}}window.addEventListener('error',function(e){var t=e&&e.target;if(c(e&&e.message)||(t&&(t.tagName==='SCRIPT'||t.tagName==='LINK'))){r()}},true);window.addEventListener('unhandledrejection',function(e){var x=e&&e.reason;if(c(x&&(x.message||String(x)))){r()}});})();`;

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="fr" className={`${inter.variable} ${archivo.variable}`}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: CHUNK_RECOVERY }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
