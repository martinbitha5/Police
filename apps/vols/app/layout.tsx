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

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
