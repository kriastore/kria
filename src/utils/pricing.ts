export interface PricingResult {
  selling: number;
  original: number;
  discount: number;
}

export function resolvePricing(product: {
  Price?: number | string;
  OriginalPrice?: number | string;
  DiscountPercent?: number | string;
}): PricingResult {
  const original = Number(product.OriginalPrice) || 0;

  const price = product.Price != null ? Number(product.Price) : undefined;
  const disc = product.DiscountPercent != null ? Number(product.DiscountPercent) : undefined;

  if (price != null && price > 0) {
    const discount =
      original > price
        ? Math.round(((original - price) / original) * 100)
        : 0;
    return { selling: price, original, discount };
  }

  if (disc != null && disc > 0) {
    const selling = Math.round(original * (1 - disc / 100));
    return { selling, original, discount: disc };
  }

  return { selling: original, original, discount: 0 };
}
