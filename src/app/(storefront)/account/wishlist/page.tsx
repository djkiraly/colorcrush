"use client";

import { Heart } from "lucide-react";

export default function WishlistPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-heading font-bold text-brand-secondary mb-8">
        My Wishlist
      </h1>

      <div className="text-center py-12">
        <Heart className="h-12 w-12 text-brand-text-muted mx-auto mb-4" />
        <p className="text-brand-text-muted">
          Your wishlist is empty. Start browsing to save your favorite treats!
        </p>
      </div>
    </div>
  );
}
