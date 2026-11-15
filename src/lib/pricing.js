export const toEuroAmount = (priceInCents) => {
  const n = Number(priceInCents || 0);
  if (!Number.isFinite(n)) return 0;
  return n / 100;
};

export const isFreePrice = (priceInCents) => {
  // Keep free detection aligned with displayed value (2 decimals).
  return toEuroAmount(priceInCents).toFixed(2) === '0.00';
};

export const albumTrackCount = (album) => {
  const fromIds = Array.isArray(album?.track_ids) ? album.track_ids.filter(Boolean).length : 0;
  if (fromIds > 0) return fromIds;
  const n = Number(album?.track_count);
  return Number.isFinite(n) && n > 0 ? n : fromIds;
};

export const formatPriceLabel = (priceInCents, currency = 'EUR', flags = {}) => {
  const symbol = currency === 'USD' ? '$' : '€';
  if (flags.is_free_price || flags.isFreePrice) {
    const min = flags.min_price ?? flags.minPrice;
    if (min != null && Number(min) > 0) {
      return `Prix libre · min ${toEuroAmount(min).toFixed(2)}${symbol}`;
    }
    return 'Prix libre';
  }
  if (isFreePrice(priceInCents)) return 'Gratuit';
  return `${toEuroAmount(priceInCents).toFixed(2)}${symbol}`;
};

export const formatItemPriceLabel = (item, currency = 'EUR') =>
  formatPriceLabel(item?.price, currency, {
    is_free_price: item?.is_free_price ?? item?.isFreePrice,
    min_price: item?.min_price ?? item?.minPrice
  });

