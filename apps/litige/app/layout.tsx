import type { ReactNode } from 'react';
import './globals.css';

export const metadata = {
  title: 'Litige Bagage — Superviseur',
  description: 'Suivi et résolution des litiges bagage',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
