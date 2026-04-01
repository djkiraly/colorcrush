"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { MapPin, Plus } from "lucide-react";

export default function AddressesPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-heading font-bold text-brand-secondary">
          My Addresses
        </h1>
        <Button className="bg-brand-primary hover:bg-brand-primary-hover text-white">
          <Plus className="h-4 w-4 mr-2" /> Add Address
        </Button>
      </div>

      <div className="text-center py-12">
        <MapPin className="h-12 w-12 text-brand-text-muted mx-auto mb-4" />
        <p className="text-brand-text-muted">
          Sign in to manage your addresses
        </p>
      </div>
    </div>
  );
}
