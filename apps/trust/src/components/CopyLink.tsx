'use client';

import { useState } from 'react';

/** Copie dans le presse-papiers l'adresse de la page courante, ancrée sur l'élément. */
export function CopyLink({ anchor, label }: { anchor: string; label: string }) {
  const [done, setDone] = useState(false);
  async function copy() {
    try {
      const url = `${window.location.origin}${window.location.pathname}#${anchor}`;
      await navigator.clipboard.writeText(url);
      setDone(true);
      window.setTimeout(() => setDone(false), 1500);
    } catch {
      // presse-papiers refusé : rien à faire, l'adresse reste dans la barre du navigateur
    }
  }
  return (
    <button type="button" className="tc-chip" onClick={copy} aria-label={`Copier le lien vers ${label}`}>
      {done ? 'Lien copié' : 'Copier le lien'}
    </button>
  );
}
