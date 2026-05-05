"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { LogOut, Package, Settings as SettingsIcon, User } from "lucide-react";

interface Props {
  name: string;
  email: string;
}

export function AccountMenu({ name, email }: Props) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={containerRef} className="relative">
      <Button
        variant="ghost"
        size="icon"
        aria-label="Account menu"
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => setOpen((v) => !v)}
      >
        <User className="h-5 w-5" />
      </Button>
      {open && (
        <div
          role="menu"
          className="absolute right-0 mt-2 w-56 rounded-md border bg-white shadow-lg z-50 py-1"
        >
          <div className="px-3 py-2 border-b">
            <p className="text-sm font-medium truncate">{name || "Account"}</p>
            <p className="text-xs text-brand-text-muted truncate">{email}</p>
          </div>
          <Link
            href="/account"
            onClick={() => setOpen(false)}
            role="menuitem"
            className="flex items-center px-3 py-2 text-sm hover:bg-gray-50"
          >
            <User className="h-4 w-4 mr-2" />
            My Account
          </Link>
          <Link
            href="/account/orders"
            onClick={() => setOpen(false)}
            role="menuitem"
            className="flex items-center px-3 py-2 text-sm hover:bg-gray-50"
          >
            <Package className="h-4 w-4 mr-2" />
            Orders
          </Link>
          <Link
            href="/account/settings"
            onClick={() => setOpen(false)}
            role="menuitem"
            className="flex items-center px-3 py-2 text-sm hover:bg-gray-50"
          >
            <SettingsIcon className="h-4 w-4 mr-2" />
            Settings
          </Link>
          <div className="border-t my-1" />
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setOpen(false);
              signOut({ callbackUrl: "/" });
            }}
            className="w-full text-left flex items-center px-3 py-2 text-sm text-red-700 hover:bg-red-50"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}
