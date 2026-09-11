import type { ReactNode } from 'react';
import { Inter, Figtree } from 'next/font/google';
import './globals.css';
import { RevealObserver } from '@/components/RevealObserver';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' });
// Figtree tient le rôle d'UberMove pour les titres, comme sur les autres portails.
const figtree = Figtree({ weight: ['500', '600', '700', '800'], subsets: ['latin'], display: 'swap', variable: '--font-figtree' });

export const metadata = {
  title: 'Trust Center · Police Bagage',
  description:
    'Sécurité, conformité, documents et sous-traitants de la plateforme Police Bagage, éditée par African Transport Systems (ATS Handling).',
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
};

const CHUNK_RECOVERY = `(function(){function c(m){return /ChunkLoadError|Loading chunk|Loading CSS chunk|dynamically imported module|Importing a module script failed/i.test(m||'')}function r(){try{var k='__chunk_reload_ts',l=+sessionStorage.getItem(k)||0;if(Date.now()-l>10000){sessionStorage.setItem(k,Date.now());location.reload()}}catch(e){}}window.addEventListener('error',function(e){var t=e&&e.target;if(c(e&&e.message)||(t&&(t.tagName==='SCRIPT'||t.tagName==='LINK'))){r()}},true);window.addEventListener('unhandledrejection',function(e){var x=e&&e.reason;if(c(x&&(x.message||String(x)))){r()}});})();`;

// Animations au défilement, posées avant la première peinture (voir vols/web).
const SCROLL_EFFECTS = `(function(){try{var r=document.documentElement;if(!(window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches)){r.classList.add('js-reveal')}var t=function(){r.setAttribute('data-scrolled',(window.scrollY>60)?'true':'false')};t();addEventListener('scroll',t,{passive:true})}catch(e){}})();`;

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="fr" className={`${inter.variable} ${figtree.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: CHUNK_RECOVERY }} />
        <script dangerouslySetInnerHTML={{ __html: SCROLL_EFFECTS }} />
      </head>
      <body>
        <RevealObserver />
        {children}
      </body>
    </html>
  );
}
