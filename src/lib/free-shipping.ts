// A blank Free Shipping Threshold in admin settings is persisted as
// Number.MAX_SAFE_INTEGER (see admin/settings/page.tsx). Treat that — along
// with missing / non-positive values — as "free shipping disabled" so no
// public-facing copy or math references free shipping.
export function isFreeShippingEnabled(
  threshold: number | undefined | null
): threshold is number {
  // TEMP: Free shipping is not being offered for now. Force-disabled so the
  // cart never computes a $0 ("FREE") shipping line and no public-facing
  // free-shipping copy renders, regardless of the admin Free Shipping
  // Threshold setting. To re-enable, restore the original return below.
  return false;
  // return Boolean(
  //   threshold &&
  //     Number.isFinite(threshold) &&
  //     threshold > 0 &&
  //     threshold < Number.MAX_SAFE_INTEGER
  // );
}
