/** Seuls ces deux comptes peuvent ouvrir /admin. */
export const ADMIN_EMAILS = [
  'bastien.schektman@gmail.com',
  'merwan.snk@gmail.com',
];

export function normalizeEmail(email) {
  const raw = String(email || '').trim().toLowerCase();
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

const ADMIN_EMAIL_SET = new Set(ADMIN_EMAILS.map(normalizeEmail));

export function isAdminEmail(email) {
  return ADMIN_EMAIL_SET.has(normalizeEmail(email));
}
