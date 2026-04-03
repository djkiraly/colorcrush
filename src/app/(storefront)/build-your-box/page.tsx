"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useCartStore } from "@/stores/cart-store";
import { toast } from "sonner";
import { useSiteSettings } from "@/components/providers/SiteSettingsProvider";
import { X, Check, Gift, ChevronRight, Package } from "lucide-react";

const BOX_SIZES = [
  { pieces: 4, price: 12, label: "4-Piece Box", cols: 2, rows: 2 },
  { pieces: 8, price: 22, label: "8-Piece Box", cols: 4, rows: 2 },
  { pieces: 12, price: 30, label: "12-Piece Box", cols: 4, rows: 3 },
  { pieces: 16, price: 38, label: "16-Piece Box", cols: 4, rows: 4 },
];

interface Product {
  id: string;
  name: string;
  slug: string;
  price: string;
  image: string | null;
}

export default function BuildYourBoxPage() {
  const [step, setStep] = useState(1);
  const [selectedSize, setSelectedSize] = useState(BOX_SIZES[0]);
  const [slots, setSlots] = useState<(Product | null)[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [pickerSlot, setPickerSlot] = useState<number | null>(null);
  const [giftMessage, setGiftMessage] = useState("");
  const [isGift, setIsGift] = useState(false);
  const addItem = useCartStore((s) => s.addItem);
  const setCartOpen = useCartStore((s) => s.setOpen);
  const siteConfig = useSiteSettings();

  useEffect(() => {
    async function fetchProducts() {
      const res = await fetch("/api/products?limit=50");
      const data = await res.json();
      setProducts(data.products || []);
    }
    fetchProducts();
  }, []);

  useEffect(() => {
    setSlots(new Array(selectedSize.pieces).fill(null));
  }, [selectedSize]);

  const filledCount = slots.filter(Boolean).length;
  const isComplete = filledCount === selectedSize.pieces;

  const handleSelectProduct = (product: Product) => {
    if (pickerSlot === null) return;
    const newSlots = [...slots];
    newSlots[pickerSlot] = product;
    setSlots(newSlots);
    setPickerSlot(null);
  };

  const handleRemoveSlot = (index: number) => {
    const newSlots = [...slots];
    newSlots[index] = null;
    setSlots(newSlots);
  };

  const handleAddToCart = () => {
    addItem({
      productId: `box-${selectedSize.pieces}-${Date.now()}`,
      name: `Custom ${selectedSize.label}`,
      price: selectedSize.price,
      image: "",
      slug: "build-your-box",
    });
    setCartOpen(true);
    toast.success("Custom box added to cart!");
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-heading font-bold text-brand-secondary mb-2">
        Build Your Own Box
      </h1>
      <p className="text-brand-text-secondary mb-8">
        Choose your box size, fill it with your favorite treats, and create the perfect gift.
      </p>

      {/* Progress Steps */}
      <div className="flex items-center gap-2 sm:gap-4 mb-10">
        {[
          { num: 1, label: "Choose Size" },
          { num: 2, label: "Fill Your Box" },
          { num: 3, label: "Review & Add" },
        ].map((s) => (
          <div key={s.num} className="flex items-center gap-2">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                step >= s.num
                  ? "bg-brand-primary text-white"
                  : "bg-gray-200 text-brand-text-muted"
              }`}
            >
              {step > s.num ? <Check className="h-4 w-4" /> : s.num}
            </div>
            <span
              className={`text-sm font-medium ${
                step >= s.num ? "text-brand-text" : "text-brand-text-muted"
              }`}
            >
              {s.label}
            </span>
            {s.num < 3 && <ChevronRight className="h-4 w-4 text-brand-text-muted" />}
          </div>
        ))}
      </div>

      {/* Step 1: Choose Size */}
      {step === 1 && (
        <div>
          <h2 className="text-xl font-heading font-semibold text-brand-secondary mb-6">
            Select Your Box Size
          </h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {BOX_SIZES.map((size) => (
              <button
                key={size.pieces}
                onClick={() => {
                  setSelectedSize(size);
                  setSlots(new Array(size.pieces).fill(null));
                }}
                className={`p-6 rounded-2xl border-2 text-center transition-all ${
                  selectedSize.pieces === size.pieces
                    ? "border-brand-primary bg-brand-primary/5"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <Package className="h-10 w-10 mx-auto mb-3 text-brand-secondary" />
                <p className="font-heading font-semibold text-brand-secondary">
                  {size.label}
                </p>
                <p className="text-2xl font-bold text-brand-primary mt-2">
                  ${size.price}
                </p>
              </button>
            ))}
          </div>
          <div className="mt-8 flex justify-end">
            <Button
              onClick={() => setStep(2)}
              className="bg-brand-primary hover:bg-brand-primary-hover text-white px-8"
            >
              Next: Fill Your Box
            </Button>
          </div>
        </div>
      )}

      {/* Step 2: Fill Box */}
      {step === 2 && (
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-heading font-semibold text-brand-secondary">
              Fill Your {selectedSize.label}
            </h2>
            <p className="text-sm text-brand-text-muted">
              {filledCount}/{selectedSize.pieces} slots filled
            </p>
          </div>

          {/* Box Grid */}
          <div
            className="grid gap-3 max-w-lg mx-auto mb-8"
            style={{
              gridTemplateColumns: `repeat(${selectedSize.cols}, 1fr)`,
            }}
          >
            {slots.map((slot, index) => (
              <button
                key={index}
                onClick={() => (slot ? handleRemoveSlot(index) : setPickerSlot(index))}
                className={`aspect-square rounded-xl border-2 border-dashed flex flex-col items-center justify-center transition-all relative ${
                  slot
                    ? "border-brand-primary bg-brand-primary/5"
                    : "border-gray-300 hover:border-brand-primary hover:bg-brand-primary/5"
                }`}
              >
                {slot ? (
                  <>
                    {slot.image && (
                      <Image
                        src={slot.image}
                        alt={slot.name}
                        width={60}
                        height={60}
                        className="rounded-lg object-cover"
                      />
                    )}
                    <p className="text-xs font-medium mt-1 line-clamp-1 px-1">
                      {slot.name}
                    </p>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveSlot(index);
                      }}
                      className="absolute -top-1 -right-1 bg-brand-error text-white rounded-full p-0.5"
                      aria-label="Remove"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </>
                ) : (
                  <>
                    <span className="text-2xl text-brand-text-muted">+</span>
                    <span className="text-xs text-brand-text-muted">Add treat</span>
                  </>
                )}
              </button>
            ))}
          </div>

          <div className="flex justify-between">
            <Button variant="outline" onClick={() => setStep(1)}>
              Back
            </Button>
            <Button
              onClick={() => setStep(3)}
              disabled={!isComplete}
              className="bg-brand-primary hover:bg-brand-primary-hover text-white px-8"
            >
              {isComplete ? "Next: Review" : `Fill ${selectedSize.pieces - filledCount} more slot(s)`}
            </Button>
          </div>

          {/* Product Picker Dialog */}
          <Dialog open={pickerSlot !== null} onOpenChange={() => setPickerSlot(null)}>
            <DialogContent className="max-w-[calc(100%-2rem)] sm:max-w-2xl max-h-[60vh] sm:max-h-[70vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Choose a Treat</DialogTitle>
              </DialogHeader>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-4">
                {products.map((product) => (
                  <button
                    key={product.id}
                    onClick={() => handleSelectProduct(product)}
                    className="p-3 rounded-xl border hover:border-brand-primary hover:bg-brand-primary/5 transition-all text-center"
                  >
                    <div className="w-16 h-16 mx-auto rounded-lg bg-gray-100 overflow-hidden mb-2">
                      {product.image && (
                        <Image
                          src={product.image}
                          alt={product.name}
                          width={64}
                          height={64}
                          className="w-full h-full object-cover"
                        />
                      )}
                    </div>
                    <p className="text-xs font-medium line-clamp-2">
                      {product.name}
                    </p>
                  </button>
                ))}
              </div>
            </DialogContent>
          </Dialog>
        </div>
      )}

      {/* Step 3: Review */}
      {step === 3 && (
        <div>
          <h2 className="text-xl font-heading font-semibold text-brand-secondary mb-6">
            Review Your Box
          </h2>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Box Preview */}
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <h3 className="font-medium mb-4">{selectedSize.label}</h3>
              <div
                className="grid gap-2"
                style={{
                  gridTemplateColumns: `repeat(${selectedSize.cols}, 1fr)`,
                }}
              >
                {slots.map((slot, i) => (
                  <div
                    key={i}
                    className="aspect-square rounded-lg bg-brand-pink/10 flex items-center justify-center overflow-hidden"
                  >
                    {slot?.image && (
                      <Image src={slot.image} alt={slot.name} width={50} height={50} className="object-cover" />
                    )}
                  </div>
                ))}
              </div>
              <div className="mt-4 space-y-1">
                {slots.filter(Boolean).map((slot, i) => (
                  <p key={i} className="text-sm text-brand-text-secondary">
                    {slot!.name}
                  </p>
                ))}
              </div>
            </div>

            {/* Options & Summary */}
            <div className="space-y-6">
              {siteConfig.features.giftMessages && (
                <div className="bg-white rounded-2xl p-6 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Gift className="h-5 w-5 text-brand-primary" />
                      <Label className="font-medium">Add Gift Message</Label>
                    </div>
                    <Switch checked={isGift} onCheckedChange={setIsGift} />
                  </div>
                  {isGift && (
                    <Textarea
                      placeholder="Write a sweet message..."
                      value={giftMessage}
                      onChange={(e) => setGiftMessage(e.target.value)}
                      rows={3}
                    />
                  )}
                </div>
              )}

              <div className="bg-white rounded-2xl p-6 shadow-sm">
                <div className="flex justify-between text-lg font-bold">
                  <span>Total</span>
                  <span className="text-brand-primary">
                    ${selectedSize.price.toFixed(2)}
                  </span>
                </div>
              </div>

              <div className="flex gap-4">
                <Button variant="outline" onClick={() => setStep(2)} className="flex-1">
                  Back
                </Button>
                <Button
                  onClick={handleAddToCart}
                  className="flex-1 bg-brand-primary hover:bg-brand-primary-hover text-white h-12"
                >
                  Add to Cart
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
