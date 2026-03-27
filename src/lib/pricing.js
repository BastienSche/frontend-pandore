export const toEuroAmount = (priceInCents) => {
  const n = Number(priceInCents || 0);
  if (!Number.isFinite(n)) return 0;
  return n / 100;
};

export const isFreePrice = (priceInCents) => {
  // Keep free detection aligned with displayed value (2 decimals).
  return toEuroAmount(priceInCents).toFixed(2) === '0.00';
};

export const formatPriceLabel = (priceInCents, currency = 'EUR') => {
  if (isFreePrice(priceInCents)) return 'Gratuit';
  const symbol = currency === 'USD' ? '$' : '€';
  return `${toEuroAmount(priceInCents).toFixed(2)}${symbol}`;
};

