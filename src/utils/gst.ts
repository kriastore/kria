// GST split helpers for Kria.
//
// Handicraft products carry a flat 3% GST (CGST 1.5% + SGST 1.5%).
// Product prices are GST-INCLUSIVE, so the tax is back-calculated from the
// total the customer actually pays (the customer-facing total never changes).
// Shipping already includes 18% freight GST (9% + 9%) baked into the charge.

export const PRODUCT_GST_RATE = 3;
export const PRODUCT_CGST_RATE = 1.5;
export const PRODUCT_SGST_RATE = 1.5;

export const SHIPPING_GST_RATE = 18;
export const SHIPPING_CGST_RATE = 9;
export const SHIPPING_SGST_RATE = 9;

export const round2 = (n: number) => Math.round(n * 100) / 100;

export type GstSplit = {
  taxable: number;
  gst: number;
  cgst: number;
  sgst: number;
  rate: number;
};

// Back-calculate CGST/SGST from a GST-inclusive amount so that
// taxable + cgst + sgst === inclusive exactly (2-decimal rounding).
export function splitInclusiveGst(
  inclusive: number,
  rate = PRODUCT_GST_RATE
): GstSplit {
  const amount = Math.max(0, Number(inclusive) || 0);
  if (amount === 0) {
    return { taxable: 0, gst: 0, cgst: 0, sgst: 0, rate };
  }
  const taxable = round2((amount * 100) / (100 + rate));
  const gst = round2(amount - taxable);
  const cgst = round2(gst / 2);
  const sgst = round2(gst - cgst);
  return { taxable, gst, cgst, sgst, rate };
}

export type OrderGstBreakdown = {
  taxableValue: number;
  gst: number;
  cgst: number;
  sgst: number;
  gstRate: number;
  cgstRate: number;
  sgstRate: number;
  shippingTaxable: number;
  shippingGst: number;
  shippingCgst: number;
  shippingSgst: number;
  shippingGstRate: number;
  shippingCgstRate: number;
  shippingSgstRate: number;
  totalTax: number;
};

// Resolve the GST split for an order. Uses stored fields when present (new
// orders) and falls back to back-calculation for older orders.
export function orderGstBreakdown(order: any): OrderGstBreakdown {
  const shippingCharge = Number(order?.shippingCharge ?? 0);

  let taxableValue: number;
  let cgst: number;
  let sgst: number;
  let gst: number;
  let gstRate = Number(order?.gstRate ?? PRODUCT_GST_RATE);
  let cgstRate = Number(order?.cgstRate ?? PRODUCT_CGST_RATE);
  let sgstRate = Number(order?.sgstRate ?? PRODUCT_SGST_RATE);

  const hasSplit =
    order &&
    (typeof order.cgst === "number" ||
      typeof order.sgst === "number" ||
      typeof order.taxableValue === "number");

  if (hasSplit) {
    taxableValue = Number(order.taxableValue ?? 0);
    cgst = Number(order.cgst ?? 0);
    sgst = Number(order.sgst ?? 0);
    gst = Number(order.gst ?? round2(cgst + sgst));
  } else {
    // Inclusive back-calc from product portion of the total
    const productTotal = Math.max(0, Number(order?.total ?? 0) - shippingCharge);
    const split = splitInclusiveGst(productTotal, gstRate);
    taxableValue = split.taxable;
    gst = split.gst;
    cgst = split.cgst;
    sgst = split.sgst;
    gstRate = split.rate;
    cgstRate = round2(split.rate / 2);
    sgstRate = round2(split.rate / 2);
  }

  // Shipping freight split (18% inclusive)
  let shippingTaxable: number;
  let shippingGst: number;
  let shippingCgst: number;
  let shippingSgst: number;
  if (
    order &&
    (typeof order.shippingGst === "number" ||
      typeof order.shippingTaxable === "number")
  ) {
    shippingTaxable = Number(order.shippingTaxable ?? 0);
    shippingGst = Number(order.shippingGst ?? 0);
    shippingCgst = Number(order.shippingCgst ?? 0);
    shippingSgst = Number(order.shippingSgst ?? 0);
  } else {
    const s = splitInclusiveGst(shippingCharge, SHIPPING_GST_RATE);
    shippingTaxable = s.taxable;
    shippingGst = s.gst;
    shippingCgst = s.cgst;
    shippingSgst = s.sgst;
  }

  return {
    taxableValue,
    gst,
    cgst,
    sgst,
    gstRate,
    cgstRate,
    sgstRate,
    shippingTaxable,
    shippingGst,
    shippingCgst,
    shippingSgst,
    shippingGstRate: SHIPPING_GST_RATE,
    shippingCgstRate: SHIPPING_CGST_RATE,
    shippingSgstRate: SHIPPING_SGST_RATE,
    totalTax: round2(gst + shippingGst),
  };
}
