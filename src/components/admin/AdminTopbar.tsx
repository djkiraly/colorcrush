"use client";

import { Search, LogOut } from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { AdminNotifications } from "@/components/admin/AdminNotifications";

export function AdminTopbar() {
  const { data: session } = useSession();
  const user = session?.user as { name?: string; role?: string } | undefined;
  const displayName = user?.name || "Admin";
  const role = user?.role === "super_admin" ? "Super Admin" : "Admin";

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 sticky top-0 z-40">
      {/* Search */}
      <div className="flex-1 max-w-md">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-brand-text-muted" />
          <Input
            placeholder="Search orders, products, customers..."
            className="pl-10 bg-gray-50 border-gray-200"
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3">
        <AdminNotifications />

        <div className="flex items-center gap-2 pl-3 border-l">
          <div className="text-right">
            <p className="text-sm font-medium">{displayName}</p>
            <Badge variant="secondary" className="text-xs">{role}</Badge>
          </div>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Sign out"
            onClick={() => signOut({ callbackUrl: "/" })}
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </header>
  );
}
