# Shipping QA — Manual Smoke Test Plan

Run through these end-to-end before moving Shippo to live mode.

## Setup

- `SHIPPO_TEST_MODE=true` in `.env.local`
- `SHIPPO_API_KEY` set (test key from https://apps.goshippo.com/settings/api)
- USPS, UPS, FedEx test carriers connected in Shippo dashboard
- `npx tsx scripts/seed-boxes.ts` has run successfully
- Origin address in `site.config.ts > shipping.origin` is correct
- Origin phone TODO has been filled in (or you've accepted that some carriers may complain)

---

## Test cases

### 1. Cart under 2 lb → flat rate only

1. Add a single 4 oz product to cart (e.g. one Small Bag candy)
2. Go to `/checkout`, enter a valid US shipping address
3. **Expected:** "Standard Shipping — $6.99" appears as the only option
4. **Verify in DevTools network tab:** the request to `/api/shipping/rates` returns one rate with `rateId: "flat-standard"` and `isFlatRate: true`. No call to Shippo API was made server-side (only one HTTP call to our own endpoint).

### 2. Cart over 2 lb → live carrier rates, sorted ascending

1. Add enough product to push total weight above 32 oz (e.g. 9 × 4 oz items = 36 oz)
2. Enter a valid US destination at `/checkout`
3. **Expected:** 1–3 rate cards appear (USPS / UPS / FedEx depending on Shippo response). Cheapest rate is at the top and pre-selected.
4. **Verify:** rate amounts increase top-to-bottom; carrier names are uppercased.

### 3. Toggle UPS off in admin settings

1. In the database, set `site_settings.value` for `key='shipping'` to `{ "carriersEnabled": { "ups": false } }` (or use the future admin UI once built)
2. Reload checkout, re-trigger rate fetch
3. **Expected:** UPS rates disappear; only USPS + FedEx appear

### 4. Address change re-fetches rates and clears prior selection

1. Heavy cart, enter Address A → rates load, first one auto-selected
2. Change ZIP / state to Address B
3. **Expected:** rate list reloads from scratch; previously-selected rate is cleared (none selected); auto-selects the cheapest of the new list. Pay button is briefly disabled during fetch.

### 5. Place a test order — `shippoRateId` saved

1. Heavy cart, complete checkout with a Stripe test card (`4242 4242 4242 4242`)
2. Inspect `orders` table for the new row
3. **Expected:** `shippoRateId`, `shippingCarrier`, `shippingService`, `shippingRateCents`, `shippingEstimatedDays` are all populated. `paidAt` is non-null. Status is `confirmed`.

### 6. Admin clicks "Buy Label"

1. Open the freshly-paid order at `/admin/orders/{id}`
2. Click **Buy & Print Label**
3. **Expected:** Stripe-style success toast; new tab opens to PDF; page reloads showing "Label purchased" panel with tracking number (linked to Shippo's tracking URL) and a "View label PDF" link.
4. Verify `shippoTransactionId`, `shippoLabelUrl`, `shippoTrackingNumber`, `shippoTrackingUrl` are all set on the order row.

### 7. Re-click "Buy Label" → blocked

1. On the same order, the button has been replaced by the success panel — there is no second button.
2. If you bypass the UI and POST to `/api/admin/orders/{id}/label` again, **expect** a 400 with `error: "Label already purchased"`.

### 8. Flat-rate order in admin → dashboard message

1. Place a small (under-2-lb) test order via the storefront → it gets the `flat-standard` rateId
2. Open it in admin, click **Buy & Print Label**
3. **Expected:** error toast: "Flat-rate orders need a manually purchased label — buy this one in the Shippo dashboard". No mutation to order.

---

## Things NOT covered by this plan (manual checks)

- Real-world print of a generated PDF on a thermal label printer
- Shippo balance top-up flow
- Tracking webhook ingestion (we don't subscribe to these yet)
- International addresses (validator hard-codes `country: "US"`)
- Packing optimization beyond box-by-weight (we don't tessellate items)
