export async function copyText(value) {
  const text = String(value || '');
  if (!text) throw new Error('empty');
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }
  const el = document.createElement('textarea');
  el.value = text;
  el.setAttribute('readonly', '');
  el.style.position = 'fixed';
  el.style.left = '-9999px';
  document.body.appendChild(el);
  el.select();
  document.execCommand('copy');
  el.remove();
}

export async function nativeShare({ title, text, url }) {
  if (!navigator.share) return false;
  await navigator.share({ title, text, url });
  return true;
}

export function setDocumentShareMeta({ title, description } = {}) {
  if (title) document.title = title;
  const desc = document.querySelector('meta[name="description"]');
  if (desc && description) desc.setAttribute('content', description);
}
