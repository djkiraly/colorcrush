"use client";

import { useSiteSettings } from "@/components/providers/SiteSettingsProvider";

export default function AboutPage() {
  const siteConfig = useSiteSettings();

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <h1 className="text-4xl font-heading font-bold text-brand-secondary mb-6">
        About {siteConfig.name}
      </h1>
      <div className="prose max-w-none text-brand-text-secondary space-y-6">
        <p className="text-lg">
          Welcome to {siteConfig.name}, where every piece of candy tells a story of craftsmanship,
          quality, and pure joy. Founded with a passion for creating extraordinary sweets,
          we source the finest ingredients from around the world to bring you candies that
          are as beautiful as they are delicious.
        </p>
        <h2 className="text-2xl font-heading font-semibold text-brand-secondary mt-8">
          Our Mission
        </h2>
        <p>
          We believe that candy is more than just a treat — it&apos;s an experience.
          From our handcrafted chocolates to our artisan gummies, every product is made
          with care and attention to detail. We&apos;re committed to using natural ingredients,
          sustainable practices, and eco-friendly packaging.
        </p>
        <h2 className="text-2xl font-heading font-semibold text-brand-secondary mt-8">
          What Makes Us Special
        </h2>
        <ul className="list-disc pl-6 space-y-2">
          <li>Handcrafted in small batches for maximum freshness</li>
          <li>Premium ingredients sourced from trusted suppliers</li>
          <li>Options for every dietary need: vegan, sugar-free, gluten-free</li>
          <li>Beautiful packaging perfect for gifting</li>
          <li>Customizable gift boxes for any occasion</li>
        </ul>
        <h2 className="text-2xl font-heading font-semibold text-brand-secondary mt-8">
          Visit Us
        </h2>
        <p>
          {siteConfig.contact.address}<br />
          Phone: {siteConfig.contact.phone}<br />
          Email: {siteConfig.contact.email}
        </p>
      </div>
    </div>
  );
}
