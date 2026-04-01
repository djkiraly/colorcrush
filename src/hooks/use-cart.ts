import { useCartStore } from "@/stores/cart-store";
import { siteConfig } from "../../site.config";

export function useCart() {
  const store = useCartStore();

  const subtotal = store.subtotal();
  const totalItems = store.totalItems();
  const discount = store.couponDiscount;
  const afterDiscount = Math.max(0, subtotal - discount);
  const shippingCost =
    afterDiscount >= siteConfig.freeShippingThreshold
      ? 0
      : siteConfig.shippingRates.standard;
  const taxAmount = afterDiscount * siteConfig.taxRate;
  const total = afterDiscount + shippingCost + taxAmount;

  return {
    ...store,
    subtotal,
    totalItems,
    discount,
    shippingCost,
    taxAmount,
    total,
    freeShippingThreshold: siteConfig.freeShippingThreshold,
    freeShippingRemaining: Math.max(
      0,
      siteConfig.freeShippingThreshold - afterDiscount
    ),
  };
}
