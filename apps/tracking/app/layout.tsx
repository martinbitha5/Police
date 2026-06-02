import type { ReactNode } from 'react';
import './globals.css';
import { LanguageProvider } from '@/i18n/LanguageProvider';

export const metadata = {
  title: 'Police Tracking — Suivi bagage',
  description: 'Suivez l’état de votre bagage en temps réel — service officiel aéroportuaire.',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="fr">
      <body>
        <LanguageProvider>{children}</LanguageProvider>
      </body>
    </html>
  );
}
