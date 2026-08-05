export function getProductSlug(product: any): string {
  const name =
    product?.ProductName || product?.Description || product?.Product || "Unnamed Product";
  const sku = product?.SKU;
  return sku ? `${name}-${sku}` : name;
}

export function parseProductSlug(slug: string): { name: string; sku?: string } {
  const lastHyphen = slug.lastIndexOf("-");
  if (lastHyphen <= 0) return { name: slug };
  return { name: slug.slice(0, lastHyphen), sku: slug.slice(lastHyphen + 1) };
}
