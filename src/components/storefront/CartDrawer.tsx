"use client";

import { useCartStore } from "@/stores/cart-store";
import { useCart } from "@/hooks/use-cart";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { buttonVariants } from "@/components/ui/button";
import { Minus, Plus, Trash2, ShoppingBag } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export function CartDrawer() {
  const isOpen = useCartStore((s) => s.isOpen);
  const setOpen = useCartStore((s) => s.setOpen);
  const { items, subtotal, shippingCost, taxAmount, total, totalItems, freeShippingRemaining, updateQuantity, removeItem } = useCart();

  return (
    <Sheet open={isOpen} onOpenChange={setOpen}>
      <SheetContent className="w-full sm:max-w-lg flex flex-col">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <ShoppingBag className="h-5 w-5" />
            Cart ({totalItems})
          </SheetTitle>
        </SheetHeader>

        {items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center">
            <ShoppingBag className="h-16 w-16 text-brand-text-muted mb-4" />
            <p className="text-lg font-medium mb-2">Your cart is empty</p>
            <p className="text-brand-text-muted mb-6">
              Add some sweet treats to get started!
            </p>
            <Link
              href="/products"
              onClick={() => setOpen(false)}
              className={buttonVariants({ className: "bg-brand-primary hover:bg-brand-primary-hover text-white" })}
            >
              Shop Now
            </Link>
          </div>
        ) : (
          <>
            {freeShippingRemaining > 0 && (
              <div className="bg-brand-mint/30 rounded-lg px-4 py-2 text-sm text-center">
                Add <strong>${freeShippingRemaining.toFixed(2)}</strong> more for free shipping!
              </div>
            )}

            <div className="flex-1 overflow-y-auto space-y-4 py-4">
              {items.map((item) => (
                <div key={item.productId} className="flex gap-3 items-start">
                  <div className="w-16 h-16 rounded-lg bg-gray-100 overflow-hidden flex-shrink-0">
                    {item.image && (
                      <Image
                        src={item.image}
                        alt={item.name}
                        width={64}
                        height={64}
                        className="w-full h-full object-cover"
                      />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <Link
                      href={`/products/${item.slug}`}
                      className="font-medium text-sm hover:text-brand-primary line-clamp-1"
                      onClick={() => setOpen(false)}
                    >
                      {item.name}
                    </Link>
                    <p className="text-brand-primary font-semibold text-sm mt-0.5">
                      ${item.price.toFixed(2)}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <button
                        onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                        className="p-1 rounded hover:bg-gray-100"
                        aria-label="Decrease quantity"
                      >
                        <Minus className="h-3 w-3" />
                      </button>
                      <span className="text-sm font-medium w-6 text-center">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                        className="p-1 rounded hover:bg-gray-100"
                        aria-label="Increase quantity"
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                      <button
                        onClick={() => removeItem(item.productId)}
                        className="p-1 rounded hover:bg-red-50 text-brand-text-muted hover:text-brand-error ml-auto"
                        aria-label="Remove item"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  <p className="font-semibold text-sm">
                    ${(item.price * item.quantity).toFixed(2)}
                  </p>
                </div>
              ))}
            </div>

            <div className="border-t pt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-brand-text-secondary">Subtotal</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-brand-text-secondary">Shipping</span>
                <span>{shippingCost === 0 ? "FREE" : `$${shippingCost.toFixed(2)}`}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-brand-text-secondary">Tax</span>
                <span>${taxAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-bold text-lg border-t pt-2">
                <span>Total</span>
                <span className="text-brand-primary">${total.toFixed(2)}</span>
              </div>
              <Link
                href="/checkout"
                onClick={() => setOpen(false)}
                className={buttonVariants({ className: "w-full bg-brand-primary hover:bg-brand-primary-hover text-white h-12 text-base" })}
              >
                Checkout
              </Link>
              <Link
                href="/cart"
                onClick={() => setOpen(false)}
                className={buttonVariants({ variant: "outline", className: "w-full" })}
              >
                View Cart
              </Link>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
