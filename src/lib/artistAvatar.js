import { resolveApiUrl } from '@/lib/apiClient';

/** Masques sobres servis par le front. Un artiste sans avatar perso en reçoit un, stable. */
export const DEFAULT_ARTIST_AVATARS = [
  '/avatars/mask-01.jpg',
  '/avatars/mask-02.jpg',
  '/avatars/mask-03.jpg',
  '/avatars/mask-04.jpg',
  '/avatars/mask-05.jpg',
  '/avatars/mask-06.jpg',
  '/avatars/mask-07.jpg',
  '/avatars/mask-08.jpg',
];

function hashId(id) {
  const s = String(id || 'artist');
  let h = 2166136261;
  for (let i = 0; i < s.length; i += 1) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function defaultArtistAvatar(id) {
  return DEFAULT_ARTIST_AVATARS[hashId(id) % DEFAULT_ARTIST_AVATARS.length];
}

function customAvatar(url) {
  const value = String(url || '').trim();
  if (!value) return '';
  if (value.includes('/avatars/mask-')) return '';
  return value;
}

/** Avatar choisi par l’artiste, sinon le masque stocké / calculé. */
export function artistAvatarSrc(artist) {
  const custom = customAvatar(artist?.avatar_url) || customAvatar(artist?.picture);
  if (custom) return resolveApiUrl(custom);
  const stored = String(artist?.avatar_url || artist?.picture || '').trim();
  if (stored.includes('/avatars/mask-')) return stored;
  return defaultArtistAvatar(artist?.user_id || artist?.artist_id || artist?.artist_name || '');
}
