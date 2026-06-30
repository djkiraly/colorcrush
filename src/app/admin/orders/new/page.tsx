"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Trash2, Plus, Search } from "lucide-react";

type CatalogItem = {
  kind: "catalog";
  productId: string;
  productName: string;
  catalogPrice: number;
  unitPrice: number;
  quantity: number;
};

type CustomItem = {
  kind: "custom";
  description: string;
  unitPrice: number;
  quantity: number;
};

type LineItem = CatalogItem | CustomItem;

type CustomerOption = { id: string; name: string; email: string };
type AddressOption = {
  id: string;
  label: string | null;
  line1: string;
  line2: string | null;
  city: string;
  state: string;
  zip: string;
  country: string;
  isGuest: boolean;
};
type ProductOption = {
  id: string;
  name: string;
  sku: string;
  price: string;
};

const EMPTY_ADDRESS = {
  label: "",
  line1: "",
  line2: "",
  city: "",
  state: "",
  zip: "",
  country: "US",
};

export default function NewManualOrderPage() {
  const router = useRouter();

  // Customer
  const [customerMode, setCustomerMode] = useState<"existing" | "new">("existing");
  const [customer, setCustomer] = useState<CustomerOption | null>(null);
  const [newCustomer, setNewCustomer] = useState({ name: "", email: "", phone: "" });

  // Customer addresses (loaded when an existing customer is picked)
  const [savedAddresses, setSavedAddresses] = useState<AddressOption[]>([]);
  const [shippingAddrMode, setShippingAddrMode] = useState<"saved" | "inline">("inline");
  const [shippingAddrId, setShippingAddrId] = useState<string>("");
  const [shippingInline, setShippingInline] = useState({ ...EMPTY_ADDRESS });

  const [billingSameAsShipping, setBillingSameAsShipping] = useState(true);
  const [billingAddrMode, setBillingAddrMode] = useState<"saved" | "inline">("inline");
  const [billingAddrId, setBillingAddrId] = useState<string>("");
  const [billingInline, setBillingInline] = useState({ ...EMPTY_ADDRESS });

  // Items
  const [items, setItems] = useState<LineItem[]>([]);

  // Adjustments
  const [shippingMethod, setShippingMethod] = useState<"standard" | "express" | "overnight">("standard");
  const [couponCode, setCouponCode] = useState("");
  const [manualDiscountType, setManualDiscountType] = useState<"none" | "fixed" | "percent">("none");
  const [manualDiscountValue, setManualDiscountValue] = useState("");
  const [manualDiscountReason, setManualDiscountReason] = useState("");
  const [taxOverride, setTaxOverride] = useState("");

  // Order options
  const [isGift, setIsGift] = useState(false);
  const [giftMessage, setGiftMessage] = useState("");
  const [notes, setNotes] = useState("");

  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (customerMode === "existing" && customer) {
      fetch(`/api/customers/${customer.id}`)
        .then((r) => r.json())
        .then((d) => {
          const addrs = (d.addresses || []).filter((a: AddressOption) => !a.isGuest);
          setSavedAddresses(addrs);
          if (addrs.length > 0) {
            setShippingAddrMode("saved");
            setShippingAddrId(addrs.find((a: AddressOption & { isDefault?: boolean }) => (a as { isDefault?: boolean }).isDefault)?.id || addrs[0].id);
          } else {
            setShippingAddrMode("inline");
          }
        })
        .catch(() => setSavedAddresses([]));
    } else {
      setSavedAddresses([]);
      setShippingAddrMode("inline");
    }
  }, [customer, customerMode]);

  // Live totals computation (mirrors server logic; advisory only)
  const totals = useMemo(() => {
    const subtotal = items.reduce((s, i) => s + i.unitPrice * i.quantity, 0);
    let manualDiscount = 0;
    const v = parseFloat(manualDiscountValue) || 0;
    if (manualDiscountType === "percent") manualDiscount = subtotal * (v / 100);
    else if (manualDiscountType === "fixed") manualDiscount = v;

    const discounted = Math.max(0, subtotal - manualDiscount);
    const rates = { standard: 5.99, express: 12.99, overnight: 24.99 } as const;
    const shipping = discounted >= 50 ? 0 : rates[shippingMethod];

    const tax = taxOverride !== "" ? parseFloat(taxOverride) || 0 : Math.round(discounted * 0.08 * 100) / 100;
    const total = discounted + shipping + tax;
    return { subtotal, manualDiscount, shipping, tax, total };
  }, [items, manualDiscountType, manualDiscountValue, taxOverride, shippingMethod]);

  function addCatalogItem(p: ProductOption) {
    setItems((prev) => [
      ...prev,
      {
        kind: "catalog",
        productId: p.id,
        productName: p.name,
        catalogPrice: parseFloat(p.price),
        unitPrice: parseFloat(p.price),
        quantity: 1,
      },
    ]);
  }

  function addCustomItem() {
    setItems((prev) => [
      ...prev,
      { kind: "custom", description: "", quantity: 1, unitPrice: 0 },
    ]);
  }

  function updateItem(index: number, patch: Partial<LineItem>) {
    setItems((prev) =>
      prev.map((it, i) => (i === index ? ({ ...it, ...patch } as LineItem) : it))
    );
  }

  function removeItem(index: number) {
    setItems((prev) => prev.filter((_, i) => i !== index));
  }

  async function submit() {
    if (items.length === 0) {
      toast.error("Add at least one item");
      return;
    }
    if (customerMode === "existing" && !customer) {
      toast.error("Select a customer");
      return;
    }
    if (customerMode === "new" && (!newCustomer.email || !newCustomer.name)) {
      toast.error("Customer name and email are required");
      return;
    }

    const shippingAddress =
      shippingAddrMode === "saved" && shippingAddrId
        ? { mode: "saved" as const, addressId: shippingAddrId }
        : { mode: "inline" as const, ...shippingInline };

    const billingAddress = billingSameAsShipping
      ? undefined
      : billingAddrMode === "saved" && billingAddrId
      ? { mode: "saved" as const, addressId: billingAddrId }
      : { mode: "inline" as const, ...billingInline };

    const payload = {
      customer:
        customerMode === "existing"
          ? { mode: "existing", userId: customer!.id }
          : { mode: "new", ...newCustomer },
      shippingAddress,
      billingSameAsShipping,
      billingAddress,
      items: items.map((it) =>
        it.kind === "catalog"
          ? {
              kind: "catalog",
              productId: it.productId,
              quantity: it.quantity,
              ...(it.unitPrice !== it.catalogPrice ? { unitPriceOverride: it.unitPrice } : {}),
            }
          : {
              kind: "custom",
              description: it.description,
              quantity: it.quantity,
              unitPrice: it.unitPrice,
            }
      ),
      shippingMethod,
      couponCode: couponCode.trim() || undefined,
      manualDiscount:
        manualDiscountType !== "none" && manualDiscountValue
          ? {
              type: manualDiscountType,
              value: parseFloat(manualDiscountValue) || 0,
              reason: manualDiscountReason || undefined,
            }
          : undefined,
      taxOverride: taxOverride !== "" ? parseFloat(taxOverride) : undefined,
      giftMessage: giftMessage || undefined,
      isGift,
      notes: notes || undefined,
    };

    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/orders/draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      toast.success(`Draft order ${data.orderNumber} created`);
      router.push(`/admin/orders/${data.orderId}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-heading font-bold text-brand-secondary mb-6">Create Order</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Customer */}
          <Section title="Customer">
            <div className="flex gap-2 mb-3">
              <ToggleButton active={customerMode === "existing"} onClick={() => setCustomerMode("existing")}>
                Existing customer
              </ToggleButton>
              <ToggleButton active={customerMode === "new"} onClick={() => setCustomerMode("new")}>
                New customer
              </ToggleButton>
            </div>
            {customerMode === "existing" ? (
              <CustomerSearch selected={customer} onSelect={setCustomer} />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Field label="Name">
                  <Input
                    value={newCustomer.name}
                    onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })}
                  />
                </Field>
                <Field label="Email">
                  <Input
                    type="email"
                    value={newCustomer.email}
                    onChange={(e) => setNewCustomer({ ...newCustomer, email: e.target.value })}
                  />
                </Field>
                <Field label="Phone (optional)">
                  <Input
                    value={newCustomer.phone}
                    onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })}
                  />
                </Field>
              </div>
            )}
          </Section>

          {/* Shipping Address */}
          <Section title="Shipping address">
            <AddressEntry
              savedAddresses={savedAddresses}
              mode={shippingAddrMode}
              setMode={setShippingAddrMode}
              addrId={shippingAddrId}
              setAddrId={setShippingAddrId}
              inline={shippingInline}
              setInline={setShippingInline}
            />
          </Section>

          {/* Billing Address */}
          <Section title="Billing">
            <label className="flex items-center gap-2 mb-3">
              <Switch checked={billingSameAsShipping} onCheckedChange={setBillingSameAsShipping} />
              <span className="text-sm">Same as shipping</span>
            </label>
            {!billingSameAsShipping && (
              <AddressEntry
                savedAddresses={savedAddresses}
                mode={billingAddrMode}
                setMode={setBillingAddrMode}
                addrId={billingAddrId}
                setAddrId={setBillingAddrId}
                inline={billingInline}
                setInline={setBillingInline}
              />
            )}
          </Section>

          {/* Line items */}
          <Section title="Line items">
            <div className="space-y-3">
              {items.length === 0 && (
                <p className="text-sm text-muted-foreground">No items yet — add a product or a custom line below.</p>
              )}
              {items.map((it, i) => (
                <LineItemRow key={i} item={it} onChange={(patch) => updateItem(i, patch)} onRemove={() => removeItem(i)} />
              ))}
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <ProductSearch onPick={addCatalogItem} />
              <Button type="button" variant="secondary" onClick={addCustomItem}>
                <Plus className="h-4 w-4" /> Add custom line
              </Button>
            </div>
          </Section>

          {/* Adjustments */}
          <Section title="Adjustments">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Field label="Coupon code">
                <Input value={couponCode} onChange={(e) => setCouponCode(e.target.value)} placeholder="e.g. SUMMER10" />
              </Field>
              <Field label="Shipping method">
                <select
                  value={shippingMethod}
                  onChange={(e) => setShippingMethod(e.target.value as typeof shippingMethod)}
                  className="w-full border rounded-lg px-3 py-2 text-sm bg-background"
                >
                  <option value="standard">Standard</option>
                  <option value="express">Express</option>
                  <option value="overnight">Overnight</option>
                </select>
              </Field>
              <Field label="Manual discount">
                <div className="flex gap-2">
                  <select
                    value={manualDiscountType}
                    onChange={(e) => setManualDiscountType(e.target.value as typeof manualDiscountType)}
                    className="border rounded-lg px-2 py-2 text-sm bg-background"
                  >
                    <option value="none">None</option>
                    <option value="percent">%</option>
                    <option value="fixed">$</option>
                  </select>
                  <Input
                    type="number"
                    step="0.01"
                    value={manualDiscountValue}
                    onChange={(e) => setManualDiscountValue(e.target.value)}
                    disabled={manualDiscountType === "none"}
                    placeholder="0"
                  />
                </div>
              </Field>
              <Field label="Discount reason (optional)">
                <Input
                  value={manualDiscountReason}
                  onChange={(e) => setManualDiscountReason(e.target.value)}
                  disabled={manualDiscountType === "none"}
                />
              </Field>
              <Field label="Tax override (leave blank for default)">
                <Input
                  type="number"
                  step="0.01"
                  value={taxOverride}
                  onChange={(e) => setTaxOverride(e.target.value)}
                  placeholder="auto"
                />
              </Field>
            </div>
          </Section>

          {/* Order options */}
          <Section title="Order options">
            <label className="flex items-center gap-2 mb-3">
              <Switch checked={isGift} onCheckedChange={setIsGift} />
              <span className="text-sm">This is a gift</span>
            </label>
            {isGift && (
              <Field label="Gift message">
                <Textarea value={giftMessage} onChange={(e) => setGiftMessage(e.target.value)} rows={2} />
              </Field>
            )}
            <Field label="Internal notes (admin only)">
              <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
            </Field>
          </Section>
        </div>

        {/* Sticky totals */}
        <div className="lg:col-span-1">
          <div className="sticky top-6 bg-white rounded-xl p-6 shadow-sm space-y-3">
            <h3 className="font-heading font-semibold mb-2">Totals (preview)</h3>
            <Row label="Subtotal" value={`$${totals.subtotal.toFixed(2)}`} />
            {totals.manualDiscount > 0 && (
              <Row label="Discount" value={`-$${totals.manualDiscount.toFixed(2)}`} />
            )}
            <Row label="Shipping" value={`$${totals.shipping.toFixed(2)}`} />
            <Row label="Tax" value={`$${totals.tax.toFixed(2)}`} />
            <div className="border-t pt-2 flex justify-between font-semibold">
              <span>Total</span>
              <span>${totals.total.toFixed(2)}</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Final totals (including coupon validation) are computed on save.
            </p>
            <Button onClick={submit} disabled={submitting} className="w-full">
              {submitting ? "Saving..." : "Save as draft"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// Subcomponents
// ─────────────────────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl p-6 shadow-sm">
      <h2 className="font-heading font-semibold mb-4">{title}</h2>
      {children}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {children}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-sm text-muted-foreground">
      <span>{label}</span>
      <span className="text-foreground">{value}</span>
    </div>
  );
}

function ToggleButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-3 py-1.5 rounded-lg text-sm border ${
        active
          ? "bg-brand-primary text-white border-transparent"
          : "bg-white text-muted-foreground border-input"
      }`}
    >
      {children}
    </button>
  );
}

function CustomerSearch({
  selected,
  onSelect,
}: {
  selected: CustomerOption | null;
  onSelect: (c: CustomerOption | null) => void;
}) {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<CustomerOption[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!q.trim()) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setResults([]); // reset results when query is empty
      return;
    }
    const t = setTimeout(() => {
      fetch(`/api/customers?q=${encodeURIComponent(q)}&limit=10`)
        .then((r) => r.json())
        .then((d) => setResults(d.customers || []))
        .catch(() => setResults([]));
    }, 200);
    return () => clearTimeout(t);
  }, [q]);

  if (selected) {
    return (
      <div className="flex items-center justify-between rounded-lg border bg-muted px-3 py-2">
        <div className="text-sm">
          <div className="font-medium">{selected.name}</div>
          <div className="text-muted-foreground">{selected.email}</div>
        </div>
        <Button variant="ghost" size="sm" onClick={() => onSelect(null)}>
          Change
        </Button>
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder="Search by name or email…"
          className="pl-9"
        />
      </div>
      {open && results.length > 0 && (
        <div className="absolute z-10 mt-1 w-full max-h-72 overflow-auto rounded-lg border bg-popover shadow">
          {results.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => {
                onSelect(c);
                setOpen(false);
                setQ("");
              }}
              className="w-full text-left px-3 py-2 hover:bg-accent text-sm"
            >
              <div className="font-medium">{c.name}</div>
              <div className="text-muted-foreground text-xs">{c.email}</div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function ProductSearch({ onPick }: { onPick: (p: ProductOption) => void }) {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<ProductOption[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!q.trim()) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setResults([]); // reset results when query is empty
      return;
    }
    const t = setTimeout(() => {
      fetch(`/api/products?search=${encodeURIComponent(q)}&limit=10&includeInactive=true`)
        .then((r) => r.json())
        .then((d) => setResults(d.products || []))
        .catch(() => setResults([]));
    }, 200);
    return () => clearTimeout(t);
  }, [q]);

  return (
    <div className="relative flex-1 min-w-[240px]">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder="Add product (search by name or SKU)…"
          className="pl-9"
        />
      </div>
      {open && results.length > 0 && (
        <div className="absolute z-10 mt-1 w-full max-h-72 overflow-auto rounded-lg border bg-popover shadow">
          {results.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => {
                onPick(p);
                setOpen(false);
                setQ("");
                setResults([]);
              }}
              className="w-full text-left px-3 py-2 hover:bg-accent text-sm"
            >
              <div className="font-medium">{p.name}</div>
              <div className="text-muted-foreground text-xs">
                {p.sku} · ${parseFloat(p.price).toFixed(2)}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function LineItemRow({
  item,
  onChange,
  onRemove,
}: {
  item: LineItem;
  onChange: (patch: Partial<LineItem>) => void;
  onRemove: () => void;
}) {
  return (
    <div className="grid grid-cols-12 gap-2 items-end">
      <div className="col-span-5">
        {item.kind === "catalog" ? (
          <div className="text-sm py-2">
            <div className="font-medium">{item.productName}</div>
            {item.unitPrice !== item.catalogPrice && (
              <div className="text-xs text-amber-600">price overridden (catalog ${item.catalogPrice.toFixed(2)})</div>
            )}
          </div>
        ) : (
          <Input
            value={item.description}
            onChange={(e) => onChange({ description: e.target.value })}
            placeholder="Custom item description"
          />
        )}
      </div>
      <div className="col-span-2">
        <Input
          type="number"
          min={1}
          value={item.quantity}
          onChange={(e) => onChange({ quantity: Math.max(1, parseInt(e.target.value) || 1) })}
        />
      </div>
      <div className="col-span-3">
        <Input
          type="number"
          step="0.01"
          min={0}
          value={item.unitPrice}
          onChange={(e) => onChange({ unitPrice: Math.max(0, parseFloat(e.target.value) || 0) })}
        />
      </div>
      <div className="col-span-1 text-sm text-right py-2">
        ${(item.unitPrice * item.quantity).toFixed(2)}
      </div>
      <div className="col-span-1">
        <Button type="button" variant="ghost" size="icon" onClick={onRemove}>
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

function AddressEntry({
  savedAddresses,
  mode,
  setMode,
  addrId,
  setAddrId,
  inline,
  setInline,
}: {
  savedAddresses: AddressOption[];
  mode: "saved" | "inline";
  setMode: (m: "saved" | "inline") => void;
  addrId: string;
  setAddrId: (s: string) => void;
  inline: typeof EMPTY_ADDRESS;
  setInline: (a: typeof EMPTY_ADDRESS) => void;
}) {
  return (
    <div>
      {savedAddresses.length > 0 && (
        <div className="flex gap-2 mb-3">
          <ToggleButton active={mode === "saved"} onClick={() => setMode("saved")}>
            Saved address
          </ToggleButton>
          <ToggleButton active={mode === "inline"} onClick={() => setMode("inline")}>
            Different address
          </ToggleButton>
        </div>
      )}
      {mode === "saved" && savedAddresses.length > 0 ? (
        <select
          value={addrId}
          onChange={(e) => setAddrId(e.target.value)}
          className="w-full border rounded-lg px-3 py-2 text-sm bg-background"
        >
          {savedAddresses.map((a) => (
            <option key={a.id} value={a.id}>
              {a.label ? `${a.label} — ` : ""}
              {a.line1}, {a.city}, {a.state} {a.zip}
            </option>
          ))}
        </select>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Field label="Label (optional)">
            <Input value={inline.label} onChange={(e) => setInline({ ...inline, label: e.target.value })} />
          </Field>
          <Field label="Country">
            <Input value={inline.country} onChange={(e) => setInline({ ...inline, country: e.target.value })} />
          </Field>
          <Field label="Address line 1">
            <Input value={inline.line1} onChange={(e) => setInline({ ...inline, line1: e.target.value })} />
          </Field>
          <Field label="Address line 2">
            <Input value={inline.line2} onChange={(e) => setInline({ ...inline, line2: e.target.value })} />
          </Field>
          <Field label="City">
            <Input value={inline.city} onChange={(e) => setInline({ ...inline, city: e.target.value })} />
          </Field>
          <Field label="State">
            <Input value={inline.state} onChange={(e) => setInline({ ...inline, state: e.target.value })} />
          </Field>
          <Field label="ZIP">
            <Input value={inline.zip} onChange={(e) => setInline({ ...inline, zip: e.target.value })} />
          </Field>
        </div>
      )}
    </div>
  );
}
