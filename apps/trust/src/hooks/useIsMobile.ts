import { useEffect, useState } from 'react';

/**
 * Détecte un écran mobile (largeur < `maxWidth`, défaut 640px — breakpoint sm).
 * Démarre à `false` (desktop) côté serveur puis se met à jour au montage :
 * pas de décalage d'hydratation.
 */
export function useIsMobile(maxWidth = 640): boolean {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${maxWidth - 1}px)`);
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, [maxWidth]);

  return isMobile;
}
