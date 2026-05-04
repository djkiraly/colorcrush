import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CartItem } from "@/types";
import type { ShippingRateOption } from "@/lib/shipping/rates";

interface CartStore {
  items: CartItem[];
  couponCode: string | null;
  couponDiscount: number;
  isOpen: boolean;
  selectedRate: ShippingRateOption | null;

  addItem: (item: Omit<CartItem, "quantity">, quantity?: number) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
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
          const existing = state.items.find(
            (i) => i.productId === item.productId
          );
          if (existing) {
            return {
              items: state.items.map((i) =>
                i.productId === item.productId
                  ? { ...i, quantity: i.quantity + quantity }
                  : i
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

      removeItem: (productId) => {
        set((state) => ({
          items: state.items.filter((i) => i.productId !== productId),
          selectedRate: null,
        }));
      },

      updateQuantity: (productId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(productId);
          return;
        }
        set((state) => ({
          items: state.items.map((i) =>
            i.productId === productId ? { ...i, quantity } : i
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
      name: "sweet-haven-cart",
      partialize: (state) => ({
        items: state.items,
        couponCode: state.couponCode,
        couponDiscount: state.couponDiscount,
      }),
    }
  )
);
