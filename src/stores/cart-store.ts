import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CartItem } from "@/types";
import type { ShippingRateOption } from "@/lib/shipping/rates";

// Each cart line is identified by `productId + (variantId ?? "")`. Pass that
// composite string to removeItem / updateQuantity. Existing callers using just
// productId still work for simple (no-variant) products.
export function lineKey(item: Pick<CartItem, "productId" | "variantId">) {
  return item.variantId ? `${item.productId}::${item.variantId}` : item.productId;
}

interface CartStore {
  items: CartItem[];
  couponCode: string | null;
  couponDiscount: number;
  isOpen: boolean;
  selectedRate: ShippingRateOption | null;

  addItem: (item: Omit<CartItem, "quantity">, quantity?: number) => void;
  removeItem: (key: string) => void;
  updateQuantity: (key: string, quantity: number) => void;
  clearCart: () => void;
  setOpen: (open: boolean) => void;
  setCoupon: (code: string | null, discount: number) => void;
  setSelectedRate: (rate: ShippingRateOption | null) => void;

  totalItems: () => number;
  subtotal: () => number;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      couponCode: null,
      couponDiscount: 0,
      isOpen: false,
      selectedRate: null,

      addItem: (item, quantity = 1) => {
        set((state) => {
          const key = lineKey(item);
          const existing = state.items.find((i) => lineKey(i) === key);
          if (existing) {
            return {
              items: state.items.map((i) =>
                lineKey(i) === key ? { ...i, quantity: i.quantity + quantity } : i
              ),
              selectedRate: null,
            };
          }
          return {
            items: [...state.items, { ...item, quantity }],
            selectedRate: null,
          };
        });
      },

      removeItem: (key) => {
        set((state) => ({
          items: state.items.filter((i) => lineKey(i) !== key),
          selectedRate: null,
        }));
      },

      updateQuantity: (key, quantity) => {
        if (quantity <= 0) {
          get().removeItem(key);
          return;
        }
        set((state) => ({
          items: state.items.map((i) =>
            lineKey(i) === key ? { ...i, quantity } : i
          ),
          selectedRate: null,
        }));
      },

      clearCart: () => {
        set({ items: [], couponCode: null, couponDiscount: 0, selectedRate: null });
      },

      setOpen: (open) => set({ isOpen: open }),

      setCoupon: (code, discount) =>
        set({ couponCode: code, couponDiscount: discount }),

      setSelectedRate: (rate) => set({ selectedRate: rate }),

      totalItems: () => get().items.reduce((sum, i) => sum + i.quantity, 0),

      subtotal: () =>
        get().items.reduce((sum, i) => sum + i.price * i.quantity, 0),
    }),
    {
      name: "sweet-haven-cart-v2",
      partialize: (state) => ({
        items: state.items,
        couponCode: state.couponCode,
        couponDiscount: state.couponDiscount,
      }),
    }
  )
);
