"use client";

import Link from "next/link";
import { siteConfig } from "../../../site.config";
import { NewsletterSignup } from "./NewsletterSignup";

export function Footer() {
  return (
    <footer className="bg-brand-secondary text-white">
      {/* Newsletter Section */}
      <div className="bg-brand-pink/20 border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <NewsletterSignup />
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand */}
          <div>
            <h3 className="text-xl font-heading font-bold mb-4">
              {siteConfig.name}
            </h3>
            <p className="text-white/70 text-sm leading-relaxed">
              {siteConfig.description}
            </p>
            <div className="flex gap-4 mt-4">
              {Object.entries(siteConfig.social).map(([name, url]) => (
                <a
                  key={name}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-white/60 hover:text-white transition-colors capitalize text-sm"
                >
                  {name}
                </a>
              ))}
            </div>
          </div>

          {/* Shop */}
          <div>
            <h4 className="font-heading font-semibold mb-4">Shop</h4>
            <ul className="space-y-2 text-sm text-white/70">
              <li><Link href="/products" className="hover:text-white transition-colors">All Products</Link></li>
              <li><Link href="/categories/chocolates" className="hover:text-white transition-colors">Chocolates</Link></li>
              <li><Link href="/categories/gummies-jellies" className="hover:text-white transition-colors">Gummies & Jellies</Link></li>
              <li><Link href="/categories/gift-boxes" className="hover:text-white transition-colors">Gift Boxes</Link></li>
              <li><Link href="/build-your-box" className="hover:text-white transition-colors">Build Your Box</Link></li>
            </ul>
          </div>

          {/* Help */}
          <div>
            <h4 className="font-heading font-semibold mb-4">Help</h4>
            <ul className="space-y-2 text-sm text-white/70">
              <li><Link href="/faq" className="hover:text-white transition-colors">FAQ</Link></li>
              <li><Link href="/contact" className="hover:text-white transition-colors">Contact Us</Link></li>
              <li><Link href="/about" className="hover:text-white transition-colors">About Us</Link></li>
              <li><Link href="/account/orders" className="hover:text-white transition-colors">Track Order</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-heading font-semibold mb-4">Contact</h4>
            <ul className="space-y-2 text-sm text-white/70">
              <li>{siteConfig.contact.email}</li>
              <li>{siteConfig.contact.phone}</li>
              <li>{siteConfig.contact.address}</li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/10 mt-8 pt-8 text-center text-sm text-white/50">
          <p>&copy; {new Date().getFullYear()} {siteConfig.name}. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
