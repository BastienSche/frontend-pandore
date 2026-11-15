export const SMART_LINK_KINDS = [
  { id: 'instagram', label: 'Instagram', placeholder: 'https://instagram.com/tonpseudo' },
  { id: 'tiktok', label: 'TikTok', placeholder: 'https://tiktok.com/@tonpseudo' },
  { id: 'youtube', label: 'YouTube', placeholder: 'https://youtube.com/@ta-chaine' },
  { id: 'presave', label: 'Pre-save', placeholder: 'https://distrokid.com/hyperfollow/…' },
  { id: 'spotify', label: 'Spotify', placeholder: 'https://open.spotify.com/artist/…' },
  { id: 'apple', label: 'Apple Music', placeholder: 'https://music.apple.com/…' },
  { id: 'soundcloud', label: 'SoundCloud', placeholder: 'https://soundcloud.com/…' },
  { id: 'website', label: 'Site web', placeholder: 'https://…' },
  { id: 'custom', label: 'Autre', placeholder: 'https://…' }
];

const KIND_BY_HOST = [
  [/instagram\.com$/i, 'instagram'],
  [/tiktok\.com$/i, 'tiktok'],
  [/(youtube\.com|youtu\.be)$/i, 'youtube'],
  [/open\.spotify\.com$/i, 'spotify'],
  [/music\.apple\.com$/i, 'apple'],
  [/soundcloud\.com$/i, 'soundcloud'],
  [/(ffm\.to|feature\.fm|distrokid\.com|hyperfollow\.com|presave\.io)$/i, 'presave']
];

export const emptySmartLink = () => ({ kind: 'instagram', url: '', label: '' });

export function inferSmartLinkKind(url) {
  try {
    const host = new URL(url).hostname.replace(/^www\./, '');
    const hit = KIND_BY_HOST.find(([re]) => re.test(host));
    if (hit) return hit[1];
  } catch {
    // ignore
  }
  return 'website';
}

export function normalizeSmartLinks(raw) {
  const list = Array.isArray(raw) ? raw : [];
  const out = [];
  list.forEach((item) => {
    if (typeof item === 'string') {
      const url = item.trim();
      if (!url) return;
      out.push({ kind: inferSmartLinkKind(url), url, label: '' });
      return;
    }
    const url = String(item?.url || '').trim();
    if (!url) return;
    const kind = String(item?.kind || inferSmartLinkKind(url) || 'website');
    out.push({
      kind: SMART_LINK_KINDS.some((k) => k.id === kind) ? kind : 'custom',
      url,
      label: String(item?.label || '').trim()
    });
  });
  return out;
}

export function smartLinkLabel(link) {
  if (link?.label) return link.label;
  const found = SMART_LINK_KINDS.find((k) => k.id === link?.kind);
  return found?.label || 'Lien';
}

export function publicPageUrl(path) {
  const p = path.startsWith('/') ? path : `/${path}`;
  if (typeof window === 'undefined') return p;
  return `${window.location.origin}${p}`;
}
