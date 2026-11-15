/** Comptes allowlist (comparaison exacte, casse ignorée). */
export const ADMIN_EMAILS = [
  'bastien.schektman@gmail.com',
  'merwan.snk@gmail.com',
  'merwane.snk@gmail.com',
];

export function canonicalEmail(email) {
  return String(email || '').trim().toLowerCase();
}

/** Identité de boîte Gmail (points / +tag). Ne pas utiliser pour l'admin. */
export function normalizeEmail(email) {
  const raw = canonicalEmail(email);
  if (!raw.includes('@')) return raw;
  const at = raw.lastIndexOf('@');
  let local = raw.slice(0, at);
  let domain = raw.slice(at + 1);
  if (domain === 'gmail.com' || domain === 'googlemail.com') {
    local = local.split('+')[0].replace(/\./g, '');
    domain = 'gmail.com';
  }
  return `${local}@${domain}`;
}

const ADMIN_EMAIL_SET = new Set(ADMIN_EMAILS.map(canonicalEmail));

export function isAdminEmail(email) {
  return ADMIN_EMAIL_SET.has(canonicalEmail(email));
}
