/**
 * Icône lucide Heart : remplissage rose quand like (track/album) ou suivi (artiste) actif.
 */
export const HEART_ACTIVE_CLASS = 'fill-pink-400 text-pink-400';

export function heartIconActiveClass(isActive) {
  return isActive ? HEART_ACTIVE_CLASS : '';
}
