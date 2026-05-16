/**
 * Custom error class for shipping rate lookups.
 *
 * `safe: true` means the message is admin/customer-friendly and may be returned
 * as-is. `safe: false` means it might contain SDK internals or stack data and
 * should be replaced with a generic message before reaching the client.
 */
export class ShippingRatesError extends Error {
  readonly safe: boolean;
  readonly carrierMessages?: string[];

  constructor(message: string, safe: boolean, carrierMessages?: string[]) {
    super(message);
    this.name = "ShippingRatesError";
    this.safe = safe;
    this.carrierMessages = carrierMessages;
  }
}
