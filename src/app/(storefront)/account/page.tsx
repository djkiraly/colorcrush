"use client";

import Link from "next/link";
import { Package, MapPin, Heart, Settings, LogOut } from "lucide-react";

const accountLinks = [
  { href: "/account/orders", label: "Order History", icon: Package, description: "View and track your orders" },
  { href: "/account/addresses", label: "Addresses", icon: MapPin, description: "Manage delivery addresses" },
  { href: "/account/wishlist", label: "Wishlist", icon: Heart, description: "Your saved items" },
  { href: "/account/settings", label: "Account Settings", icon: Settings, description: "Update your profile" },
];

export default function AccountPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-heading font-bold text-brand-secondary mb-8">
        My Account
      </h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {accountLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow flex items-start gap-4"
          >
            <div className="p-3 rounded-lg bg-brand-primary/10">
              <link.icon className="h-6 w-6 text-brand-primary" />
            </div>
            <div>
              <h3 className="font-medium text-brand-text">{link.label}</h3>
              <p className="text-sm text-brand-text-muted mt-1">{link.description}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
