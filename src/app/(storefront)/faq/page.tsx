"use client";

import { useSiteSettings } from "@/components/providers/SiteSettingsProvider";

export default function FAQPage() {
  const siteConfig = useSiteSettings();

  const faqs = [
    {
      q: "How long does shipping take?",
      a: "Standard shipping takes 5-7 business days. Express shipping is 2-3 business days, and overnight is available for next-day delivery.",
    },
    {
      q: `Do you offer free shipping?`,
      a: `Yes! We offer free standard shipping on all orders over $${siteConfig.freeShippingThreshold}.`,
    },
    {
      q: "Can I customize a gift box?",
      a: "Absolutely! Our Build Your Box feature lets you choose the size and fill each compartment with your favorite treats.",
    },
    {
      q: "Do you have sugar-free options?",
      a: "Yes, we have a full line of sugar-free candies including chocolates, gummies, hard candy, and caramel chews.",
    },
    {
      q: "What are your allergen policies?",
      a: "All of our products clearly list allergens. Our facility processes products containing milk, soy, wheat, tree nuts, and peanuts. Please check individual product pages for specific allergen information.",
    },
    {
      q: "Can I return or exchange items?",
      a: "Due to the perishable nature of our products, we cannot accept returns. However, if you receive damaged or incorrect items, please contact us within 48 hours and we'll make it right.",
    },
    {
      q: "Do you offer corporate or bulk orders?",
      a: "Yes! We love working with businesses for corporate gifts, events, and party favors. Contact us at " + siteConfig.contact.email + " for custom quotes.",
    },
    {
      q: "How do I track my order?",
      a: "Once your order ships, you'll receive an email with your tracking number. You can also check your order status in your account dashboard.",
    },
  ];

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <h1 className="text-4xl font-heading font-bold text-brand-secondary mb-6 text-center">
        Frequently Asked Questions
      </h1>
      <p className="text-brand-text-secondary text-center mb-12">
        Can&apos;t find what you&apos;re looking for?{" "}
        <a href="/contact" className="text-brand-primary hover:underline">
          Contact us
        </a>
      </p>

      <div className="space-y-6">
        {faqs.map((faq, i) => (
          <div key={i} className="bg-white rounded-xl p-6 shadow-sm">
            <h3 className="font-heading font-semibold text-brand-secondary mb-2">
              {faq.q}
            </h3>
            <p className="text-brand-text-secondary text-sm leading-relaxed">
              {faq.a}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
