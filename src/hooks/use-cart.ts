import { useCartStore } from "@/stores/cart-store";
import { useSiteSettings } from "@/components/providers/SiteSettingsProvider";
import { isFreeShippingEnabled } from "@/lib/free-shipping";

export function useCart() {
  const store = useCartStore();
  const settings = useSiteSettings();

  const subtotal = store.subtotal();
  const totalItems = store.totalItems();
  const discount = store.couponDiscount;
  const afterDiscount = Math.max(0, subtotal - discount);

  const freeShippingEnabled = isFreeShippingEnabled(settings.freeShippingThreshold);
  const threshold = freeShippingEnabled ? settings.freeShippingThreshold : null;

  const shippingCost =
    freeShippingEnabled && afterDiscount >= (threshold as number)
      ? 0
      : settings.shippingRates.standard;
  const taxAmount = afterDiscount * settings.taxRate;
  const total = afterDiscount + shippingCost + taxAmount;

  return {
    ...store,
    subtotal,
    totalItems,
    discount,
    shippingCost,
    taxAmount,
    total,
    freeShippingEnabled,
    freeShippingThreshold: threshold,
    freeShippingRemaining: freeShippingEnabled
      ? Math.max(0, (threshold as number) - afterDiscount)
      : 0,
  };
}
