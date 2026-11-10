const LS_KEY = 'kloud:browseFilters';

export const BROWSE_SORTS = [
  { id: 'newest', label: 'Nouveautés' },
  { id: 'popular', label: 'Plus écoutés' },
  { id: 'title', label: 'A–Z' },
  { id: 'price_asc', label: 'Prix croissant' },
  { id: 'price_desc', label: 'Prix décroissant' }
];

export const OWNED_FILTERS = [
  { id: 'discover', label: 'À découvrir' },
  { id: 'owned', label: 'Déjà achetés' },
  { id: 'all', label: 'Tout' }
];

export const RECENCY_FILTERS = [
  { id: 'all', label: 'Toutes dates' },
  { id: '7d', label: '7 jours' },
  { id: '30d', label: '30 jours' }
];

export const defaultBrowseFilters = (isAuthenticated) => ({
  sort: 'newest',
  owned: isAuthenticated ? 'discover' : 'all',
  recency: 'all',
  genre: '',
  hideAlbumTracks: true
});

export function loadBrowseFilters(isAuthenticated) {
  const base = defaultBrowseFilters(isAuthenticated);
  try {
    const raw = window.localStorage.getItem(LS_KEY);
    if (!raw) return base;
    const saved = JSON.parse(raw);
    return {
      sort: BROWSE_SORTS.some((s) => s.id === saved.sort) ? saved.sort : base.sort,
      owned: isAuthenticated && OWNED_FILTERS.some((s) => s.id === saved.owned) ? saved.owned : base.owned,
      recency: RECENCY_FILTERS.some((s) => s.id === saved.recency) ? saved.recency : base.recency,
      genre: typeof saved.genre === 'string' ? saved.genre : '',
      hideAlbumTracks: saved.hideAlbumTracks !== false
    };
  } catch {
    return base;
  }
}

export function saveBrowseFilters(filters) {
  try {
    window.localStorage.setItem(LS_KEY, JSON.stringify(filters));
  } catch {
    // ignore
  }
}

export function createdMs(iso) {
  if (!iso) return 0;
  const t = Date.parse(iso);
  return Number.isFinite(t) ? t : 0;
}

export function isOwnedTrack(track, ownership) {
  if (!ownership) return false;
  if (ownership.trackIds?.has(track?.track_id)) return true;
  if (track?.album_id && ownership.albumIds?.has(track.album_id)) return true;
  return false;
}

export function isOwnedAlbum(album, ownership) {
  return Boolean(ownership?.albumIds?.has(album?.album_id));
}

export function collectGenres(items) {
  const set = new Set();
  (items || []).forEach((item) => {
    const raw = String(item?.genre || '').trim();
    if (!raw) return;
    raw.split(/[,;/]+/).forEach((part) => {
      const g = part.trim();
      if (g) set.add(g);
    });
  });
  return [...set].sort((a, b) => a.localeCompare(b, 'fr', { sensitivity: 'base' }));
}

function matchesGenre(item, genre) {
  if (!genre) return true;
  const raw = String(item?.genre || '').toLowerCase();
  return raw.split(/[,;/]+/).some((part) => part.trim() === genre.toLowerCase());
}

function matchesRecency(item, recency) {
  if (!recency || recency === 'all') return true;
  const ms = createdMs(item?.created_at || item?.release_date);
  if (!ms) return false;
  const days = recency === '7d' ? 7 : 30;
  return Date.now() - ms <= days * 24 * 60 * 60 * 1000;
}

function priceValue(item) {
  const n = Number(item?.price);
  return Number.isFinite(n) ? n : 0;
}

export function sortCatalogItems(items, sortId) {
  const list = [...(items || [])];
  list.sort((a, b) => {
    if (sortId === 'popular') return (Number(b.play_count) || 0) - (Number(a.play_count) || 0);
    if (sortId === 'title') {
      return String(a.title || a.artist_name || a.name || '').localeCompare(
        String(b.title || b.artist_name || b.name || ''),
        'fr',
        { sensitivity: 'base' }
      );
    }
    if (sortId === 'price_asc') return priceValue(a) - priceValue(b);
    if (sortId === 'price_desc') return priceValue(b) - priceValue(a);
    return createdMs(b.created_at || b.release_date) - createdMs(a.created_at || a.release_date);
  });
  return list;
}

export function isPayWhatYouWant(item) {
  return Boolean(item?.is_free_price || item?.isFreePrice);
}

export function filterCatalogItems(items, { ownedMode, recency, genre, hideAlbumTracks, ownership, kind, payWhatYouWant }) {
  return (items || []).filter((item) => {
    if (kind === 'track' && hideAlbumTracks && item?.album_id) return false;
    if (!matchesGenre(item, genre)) return false;
    if (!matchesRecency(item, recency)) return false;
    if (payWhatYouWant && !isPayWhatYouWant(item)) return false;
    if (ownedMode === 'discover' || ownedMode === 'owned') {
      const owned = kind === 'album' ? isOwnedAlbum(item, ownership) : isOwnedTrack(item, ownership);
      if (ownedMode === 'discover' && owned) return false;
      if (ownedMode === 'owned' && !owned) return false;
    }
    return true;
  });
}
