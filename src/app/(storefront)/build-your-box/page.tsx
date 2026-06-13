"use client";

import { useState, useEffect, useMemo } from "react";
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

type BoxSize = {
  id: string;
  label: string;
  pieces: number;
  price: number;
  cols: number;
  rows: number;
  sortOrder: number;
};
type TaxItem = { slug: string; label: string; hex?: string };
type ByobConfig = {
  enabled: boolean;
  boxes: BoxSize[];
  tastes: TaxItem[];
  colors: TaxItem[];
  flavors: TaxItem[];
};

interface Candy {
  id: string;
  name: string;
  slug: string;
  price: number;
  image: string | null;
  taste: string | null;
  color: string | null;
  flavor: string | null;
  stock: number;
}

export default function BuildYourBoxPage() {
  const [config, setConfig] = useState<ByobConfig | null>(null);
  const [candies, setCandies] = useState<Candy[]>([]);
  const [loading, setLoading] = useState(true);

  const [step, setStep] = useState(1);
  const [selectedSize, setSelectedSize] = useState<BoxSize | null>(null);
  const [slots, setSlots] = useState<(Candy | null)[]>([]);
  const [pickerSlot, setPickerSlot] = useState<number | null>(null);
  const [giftMessage, setGiftMessage] = useState("");
  const [isGift, setIsGift] = useState(false);

  // Filter chips
  const [fTaste, setFTaste] = useState<string | null>(null);
  const [fColor, setFColor] = useState<string | null>(null);
  const [fFlavor, setFFlavor] = useState<string | null>(null);

  const addItem = useCartStore((s) => s.addItem);
  const setCartOpen = useCartStore((s) => s.setOpen);
  const siteConfig = useSiteSettings();

  useEffect(() => {
    Promise.all([
      fetch("/api/byob/config").then((r) => r.json()),
      fetch("/api/byob/products").then((r) => r.json()),
    ])
      .then(([cfg, prods]) => {
        const b: ByobConfig | null = cfg.byob
          ? { ...cfg.byob, boxes: [...(cfg.byob.boxes ?? [])].sort((a, b) => a.sortOrder - b.sortOrder) }
          : null;
        setConfig(b);
        setCandies(prods.products || []);
        if (b && b.boxes.length > 0) setSelectedSize(b.boxes[0]);
      })
      .catch(() => toast.error("Could not load Build Your Box"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (selectedSize) setSlots(new Array(selectedSize.pieces).fill(null));
  }, [selectedSize]);

  const filteredCandies = useMemo(
    () =>
      candies.filter(
        (c) =>
          (!fTaste || c.taste === fTaste) &&
          (!fColor || c.color === fColor) &&
          (!fFlavor || c.flavor === fFlavor)
      ),
    [candies, fTaste, fColor, fFlavor]
  );

  if (loading) {
    return <div className="max-w-6xl mx-auto px-4 py-16 text-center text-brand-text-muted">Loading…</div>;
  }

  if (!config || !config.enabled || config.boxes.length === 0) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <Package className="h-12 w-12 mx-auto mb-4 text-brand-text-muted" />
        <h1 className="text-2xl font-heading font-bold text-brand-secondary mb-2">Build Your Own Box</h1>
        <p className="text-brand-text-secondary">
          This feature is currently unavailable. Please check back soon!
        </p>
      </div>
    );
  }

  const size = selectedSize ?? config.boxes[0];
  const filledCount = slots.filter(Boolean).length;
  const isComplete = filledCount === size.pieces;

  const handleSelectCandy = (candy: Candy) => {
    if (pickerSlot === null) return;
    const next = [...slots];
    next[pickerSlot] = candy;
    setSlots(next);
    setPickerSlot(null);
  };

  const handleRemoveSlot = (index: number) => {
    const next = [...slots];
    next[index] = null;
    setSlots(next);
  };

  const handleAddToCart = () => {
    const contents = slots.filter(Boolean).map((c) => ({ productId: c!.id, name: c!.name }));
    addItem({
      productId: `box-${size.id}-${Date.now()}`,
      name: `Custom ${size.label}`,
      price: size.price,
      image: slots.find((s) => s?.image)?.image || "",
      slug: "build-your-box",
      isCustomBox: true,
      boxId: size.id,
      boxContents: contents,
    });
    setCartOpen(true);
    toast.success("Custom box added to cart!");
  };

  const FilterRow = ({
    label,
    items,
    active,
    onPick,
  }: {
    label: string;
    items: TaxItem[];
    active: string | null;
    onPick: (slug: string | null) => void;
  }) => {
    if (items.length === 0) return null;
    return (
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-semibold text-brand-text-muted w-16">{label}</span>
        <button
          onClick={() => onPick(null)}
          className={`text-xs px-3 py-1 rounded-full border transition-colors ${
            active === null ? "bg-brand-secondary text-white border-brand-secondary" : "border-gray-300 hover:border-brand-primary"
          }`}
        >
          All
        </button>
        {items.map((it) => (
          <button
            key={it.slug}
            onClick={() => onPick(it.slug)}
            className={`text-xs px-3 py-1 rounded-full border transition-colors inline-flex items-center gap-1.5 ${
              active === it.slug ? "bg-brand-primary text-white border-brand-primary" : "border-gray-300 hover:border-brand-primary"
            }`}
          >
            {it.hex ? <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: it.hex }} /> : null}
            {it.label}
          </button>
        ))}
      </div>
    );
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-heading font-bold text-brand-secondary mb-2">Build Your Own Box</h1>
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
                step >= s.num ? "bg-brand-primary text-white" : "bg-gray-200 text-brand-text-muted"
              }`}
            >
              {step > s.num ? <Check className="h-4 w-4" /> : s.num}
            </div>
            <span className={`text-sm font-medium ${step >= s.num ? "text-brand-text" : "text-brand-text-muted"}`}>
              {s.label}
            </span>
            {s.num < 3 && <ChevronRight className="h-4 w-4 text-brand-text-muted" />}
          </div>
        ))}
      </div>

      {/* Step 1: Choose Size */}
      {step === 1 && (
        <div>
          <h2 className="text-xl font-heading font-semibold text-brand-secondary mb-6">Select Your Box Size</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {config.boxes.map((b) => (
              <button
                key={b.id}
                onClick={() => {
                  setSelectedSize(b);
                  setSlots(new Array(b.pieces).fill(null));
                }}
                className={`p-6 rounded-2xl border-2 text-center transition-all ${
                  size.id === b.id ? "border-brand-primary bg-brand-primary/5" : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <Package className="h-10 w-10 mx-auto mb-3 text-brand-secondary" />
                <p className="font-heading font-semibold text-brand-secondary">{b.label}</p>
                <p className="text-2xl font-bold text-brand-primary mt-2">${b.price.toFixed(2)}</p>
              </button>
            ))}
          </div>
          <div className="mt-8 flex justify-end">
            <Button onClick={() => setStep(2)} className="bg-brand-primary hover:bg-brand-primary-hover text-white px-8">
              Next: Fill Your Box
            </Button>
          </div>
        </div>
      )}

      {/* Step 2: Fill Box */}
      {step === 2 && (
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-heading font-semibold text-brand-secondary">Fill Your {size.label}</h2>
            <p className="text-sm text-brand-text-muted">{filledCount}/{size.pieces} slots filled</p>
          </div>

          <div className="grid gap-3 max-w-lg mx-auto mb-8" style={{ gridTemplateColumns: `repeat(${size.cols}, 1fr)` }}>
            {slots.map((slot, index) => (
              <button
                key={index}
                onClick={() => (slot ? handleRemoveSlot(index) : setPickerSlot(index))}
                className={`aspect-square rounded-xl border-2 border-dashed flex flex-col items-center justify-center transition-all relative ${
                  slot ? "border-brand-primary bg-brand-primary/5" : "border-gray-300 hover:border-brand-primary hover:bg-brand-primary/5"
                }`}
              >
                {slot ? (
                  <>
                    {slot.image && (
                      <Image src={slot.image} alt={slot.name} width={60} height={60} className="rounded-lg object-cover" />
                    )}
                    <p className="text-xs font-medium mt-1 line-clamp-1 px-1">{slot.name}</p>
                    <span
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveSlot(index);
                      }}
                      className="absolute -top-1 -right-1 bg-brand-error text-white rounded-full p-0.5"
                      aria-label="Remove"
                    >
                      <X className="h-3 w-3" />
                    </span>
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
            <Button variant="outline" onClick={() => setStep(1)}>Back</Button>
            <Button
              onClick={() => setStep(3)}
              disabled={!isComplete}
              className="bg-brand-primary hover:bg-brand-primary-hover text-white px-8"
            >
              {isComplete ? "Next: Review" : `Fill ${size.pieces - filledCount} more slot(s)`}
            </Button>
          </div>

          {/* Candy Picker Dialog */}
          <Dialog open={pickerSlot !== null} onOpenChange={() => setPickerSlot(null)}>
            <DialogContent className="max-w-[calc(100%-2rem)] sm:max-w-2xl max-h-[75vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Choose a Treat</DialogTitle>
              </DialogHeader>

              <div className="space-y-2 mt-2 sticky top-0 bg-white pb-3 z-10 border-b">
                <FilterRow label="Category" items={config.tastes} active={fTaste} onPick={setFTaste} />
                <FilterRow label="Color" items={config.colors} active={fColor} onPick={setFColor} />
                <FilterRow label="Flavor" items={config.flavors} active={fFlavor} onPick={setFFlavor} />
              </div>

              {filteredCandies.length === 0 ? (
                <p className="text-sm text-brand-text-muted text-center py-8">
                  No candies match these filters.
                </p>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-4">
                  {filteredCandies.map((candy) => (
                    <button
                      key={candy.id}
                      onClick={() => handleSelectCandy(candy)}
                      className="p-3 rounded-xl border hover:border-brand-primary hover:bg-brand-primary/5 transition-all text-center"
                    >
                      <div className="w-16 h-16 mx-auto rounded-lg bg-gray-100 overflow-hidden mb-2">
                        {candy.image && (
                          <Image src={candy.image} alt={candy.name} width={64} height={64} className="w-full h-full object-cover" />
                        )}
                      </div>
                      <p className="text-xs font-medium line-clamp-2">{candy.name}</p>
                    </button>
                  ))}
                </div>
              )}
            </DialogContent>
          </Dialog>
        </div>
      )}

      {/* Step 3: Review */}
      {step === 3 && (
        <div>
          <h2 className="text-xl font-heading font-semibold text-brand-secondary mb-6">Review Your Box</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <h3 className="font-medium mb-4">{size.label}</h3>
              <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${size.cols}, 1fr)` }}>
                {slots.map((slot, i) => (
                  <div key={i} className="aspect-square rounded-lg bg-brand-pink/10 flex items-center justify-center overflow-hidden">
                    {slot?.image && <Image src={slot.image} alt={slot.name} width={50} height={50} className="object-cover" />}
                  </div>
                ))}
              </div>
              <div className="mt-4 space-y-1">
                {slots.filter(Boolean).map((slot, i) => (
                  <p key={i} className="text-sm text-brand-text-secondary">{slot!.name}</p>
                ))}
              </div>
            </div>

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
                  <span className="text-brand-primary">${size.price.toFixed(2)}</span>
                </div>
              </div>

              <div className="flex gap-4">
                <Button variant="outline" onClick={() => setStep(2)} className="flex-1">Back</Button>
                <Button onClick={handleAddToCart} className="flex-1 bg-brand-primary hover:bg-brand-primary-hover text-white h-12">
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
