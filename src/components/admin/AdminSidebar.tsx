"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  FolderTree,
  ShoppingCart,
  Warehouse,
  Users,
  Shield,
  MessageSquare,
  Tag,
  Star,
  BarChart3,
  Mail,
  Settings,
  BookOpen,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useState } from "react";
import { useSession } from "next-auth/react";
import { cn } from "@/lib/utils";
import { useSiteSettings } from "@/components/providers/SiteSettingsProvider";

const navItems = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/products", label: "Products", icon: Package },
  { href: "/admin/categories", label: "Categories", icon: FolderTree },
  { href: "/admin/orders", label: "Orders", icon: ShoppingCart },
  { href: "/admin/inventory", label: "Inventory", icon: Warehouse },
  { href: "/admin/customers", label: "Customers", icon: Users },
  { href: "/admin/staff", label: "Staff", icon: Shield, superAdminOnly: true as const },
  { href: "/admin/interactions", label: "Interactions", icon: MessageSquare },
  { href: "/admin/coupons", label: "Coupons", icon: Tag },
  { href: "/admin/reviews", label: "Reviews", icon: Star },
  { href: "/admin/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/admin/emails", label: "Email Log", icon: Mail },
  { href: "/admin/settings", label: "Settings", icon: Settings },
  { href: "/admin/guide", label: "Guide", icon: BookOpen },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const siteConfig = useSiteSettings();
  const userRole = (session?.user as { role?: string })?.role;
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={cn(
        "sticky top-0 h-screen bg-white border-r border-gray-200 flex flex-col transition-all duration-300",
        collapsed ? "w-16" : "w-64"
      )}
    >
      {/* Logo */}
      <div className="h-16 flex items-center justify-between px-4 border-b">
        {!collapsed && (
          <Link href="/admin" className="font-heading font-bold text-brand-secondary text-lg">
            {siteConfig.name}
          </Link>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1 rounded hover:bg-gray-100"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? (
            <ChevronRight className="h-5 w-5" />
          ) : (
            <ChevronLeft className="h-5 w-5" />
          )}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-1">
        {navItems.map((item) => {
          if ("superAdminOnly" in item && item.superAdminOnly && userRole !== "super_admin") return null;
          const isActive =
            item.href === "/admin"
              ? pathname === "/admin"
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                isActive
                  ? "bg-brand-primary/10 text-brand-primary"
                  : "text-brand-text-secondary hover:bg-gray-50 hover:text-brand-text"
              )}
              title={collapsed ? item.label : undefined}
            >
              <item.icon className="h-5 w-5 flex-shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Back to storefront */}
      <div className="p-4 border-t">
        <Link
          href="/"
          className={cn(
            "flex items-center gap-2 text-sm text-brand-text-muted hover:text-brand-text transition-colors",
            collapsed && "justify-center"
          )}
        >
          {collapsed ? "←" : "← Back to Store"}
        </Link>
      </div>
    </aside>
  );
}
