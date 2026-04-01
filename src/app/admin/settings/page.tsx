"use client";

import { siteConfig } from "../../../../site.config";

export default function AdminSettingsPage() {
  return (
    <div>
      <h1 className="text-2xl font-heading font-bold text-brand-secondary mb-6">
        Settings
      </h1>

      <div className="space-y-6 max-w-3xl">
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <h2 className="font-heading font-semibold mb-4">Store Configuration</h2>
          <p className="text-sm text-brand-text-muted mb-4">
            Store settings are managed via <code className="bg-gray-100 px-2 py-1 rounded">site.config.ts</code>.
            Edit this file to change your store name, colors, shipping rates, and more.
          </p>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div><span className="text-brand-text-muted">Store Name:</span> {siteConfig.name}</div>
            <div><span className="text-brand-text-muted">Currency:</span> {siteConfig.currency}</div>
            <div><span className="text-brand-text-muted">Tax Rate:</span> {(siteConfig.taxRate * 100).toFixed(0)}%</div>
            <div><span className="text-brand-text-muted">Free Shipping:</span> ${siteConfig.freeShippingThreshold}+</div>
            <div><span className="text-brand-text-muted">Standard Shipping:</span> ${siteConfig.shippingRates.standard}</div>
            <div><span className="text-brand-text-muted">Express Shipping:</span> ${siteConfig.shippingRates.express}</div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm">
          <h2 className="font-heading font-semibold mb-4">Feature Flags</h2>
          <div className="grid grid-cols-2 gap-4 text-sm">
            {Object.entries(siteConfig.features).map(([key, value]) => (
              <div key={key} className="flex items-center justify-between">
                <span className="capitalize">{key.replace(/([A-Z])/g, " $1")}</span>
                <span className={value ? "text-brand-success" : "text-brand-text-muted"}>
                  {value ? "Enabled" : "Disabled"}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm">
          <h2 className="font-heading font-semibold mb-4">Theme Colors</h2>
          <div className="flex gap-3 flex-wrap">
            {Object.entries(siteConfig.colors.accent).map(([name, color]) => (
              <div key={name} className="text-center">
                <div className="w-12 h-12 rounded-lg shadow-sm border" style={{ backgroundColor: color }} />
                <p className="text-xs text-brand-text-muted mt-1 capitalize">{name}</p>
              </div>
            ))}
            <div className="text-center">
              <div className="w-12 h-12 rounded-lg shadow-sm border" style={{ backgroundColor: siteConfig.colors.primary }} />
              <p className="text-xs text-brand-text-muted mt-1">Primary</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 rounded-lg shadow-sm border" style={{ backgroundColor: siteConfig.colors.secondary }} />
              <p className="text-xs text-brand-text-muted mt-1">Secondary</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
