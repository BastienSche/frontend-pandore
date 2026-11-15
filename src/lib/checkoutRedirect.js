/**
 * Extrait l’URL de redirection Stripe Checkout / session depuis la réponse API.
 * Le backend peut renvoyer plusieurs formes selon l’implémentation.
 */
export function getCheckoutRedirectUrl(data) {
  if (!data || typeof data !== 'object') return null;
  const session = data.session && typeof data.session === 'object' ? data.session : null;
  return (
    data.url ||
    data.checkout_url ||
    data.session_url ||
    data.stripe_checkout_url ||
    data.redirect_url ||
    (session && session.url) ||
    null
  );
}

/** Redirects to Stripe Checkout. Returns false if the API did not provide a URL. */
export function startCheckoutRedirect(data) {
  const payUrl = getCheckoutRedirectUrl(data);
  if (!payUrl) return false;
  window.location.href = payUrl;
  return true;
}
