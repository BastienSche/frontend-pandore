/**
 * Découpe une chaîne genre (ex. "Hip-hop, Rap" ou "Electronic / House") en segments.
 * Délimiteurs : virgule, point-virgule, slash (séquences fusionnées).
 */
export function splitGenreTags(raw) {
  if (raw == null) return [];
  const s = String(raw).trim();
  if (!s) return [];
  return s
    .split(/[,;/]+/)
    .map((part) => part.trim())
    .filter(Boolean);
}
