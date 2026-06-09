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
  CreditCard,
  Wallet,
  Tag,
  Tags,
  Layers,
  Star,
  BarChart3,
  Mail,
  Settings,
  Scale,
  BookOpen,
  Bell,
  Candy,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { cn } from "@/lib/utils";
import { useSiteSettings } from "@/components/providers/SiteSettingsProvider";

const navItems = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/products", label: "Products", icon: Package },
  { href: "/admin/categories", label: "Categories", icon: FolderTree },
  { href: "/admin/taxonomies", label: "Taxonomies", icon: Tags },
  { href: "/admin/settings/product-options", label: "Product Options", icon: Layers },
  { href: "/admin/orders", label: "Orders", icon: ShoppingCart, badge: "orders" as const },
  { href: "/admin/ggsa-orders", label: "GGSA Orders", icon: Candy, badge: "ggsa" as const },
  { href: "/admin/inventory", label: "Inventory", icon: Warehouse },
  { href: "/admin/customers", label: "Customers", icon: Users },
  { href: "/admin/staff", label: "Staff", icon: Shield, superAdminOnly: true as const },
  { href: "/admin/interactions", label: "Interactions", icon: MessageSquare },
  { href: "/admin/payments", label: "Payments", icon: CreditCard },
  { href: "/admin/stripe", label: "Stripe", icon: Wallet, superAdminOnly: true as const },
  { href: "/admin/coupons", label: "Coupons", icon: Tag },
  { href: "/admin/reviews", label: "Reviews", icon: Star },
  { href: "/admin/alerts", label: "Alerts", icon: Bell, badge: "alerts" as const },
  { href: "/admin/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/admin/emails", label: "Email Log", icon: Mail },
  { href: "/admin/emails/newsletter", label: "Newsletter", icon: Mail },
  { href: "/admin/legal", label: "Legal Pages", icon: Scale },
  { href: "/admin/settings", label: "Settings", icon: Settings },
  { href: "/admin/guide", label: "Guide", icon: BookOpen },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const siteConfig = useSiteSettings();
  const userRole = (session?.user as { role?: string })?.role;
  const [collapsed, setCollapsed] = useState(false);
  const [alertCount, setAlertCount] = useState(0);
  const [orderCount, setOrderCount] = useState(0);
  const [ggsaCount, setGgsaCount] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const load = () => {
      fetch("/api/alerts/active")
        .then((r) => r.json())
        .then((d) => {
          if (!cancelled) setAlertCount(d.count ?? 0);
        })
        .catch(() => {});
      fetch("/api/admin/order-counts")
        .then((r) => r.json())
        .then((d) => {
          if (cancelled) return;
          setOrderCount(d.orders ?? 0);
          setGgsaCount(d.ggsa ?? 0);
        })
        .catch(() => {});
    };
    load();
    const interval = setInterval(load, 60_000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

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
          const badge = "badge" in item ? item.badge : undefined;
          const badgeCount =
            badge === "alerts"
              ? alertCount
              : badge === "orders"
                ? orderCount
                : badge === "ggsa"
                  ? ggsaCount
                  : 0;
          // Order/GGSA fulfillment badges are red; alerts keep the brand color.
          const badgeClass =
            badge === "orders" || badge === "ggsa"
              ? "bg-red-600 text-white"
              : "bg-brand-primary text-white";
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
              <span className="relative flex-shrink-0">
                <item.icon className="h-5 w-5" />
                {/* When collapsed there's no label/row space, so float the
                    count over the icon as a small corner badge. */}
                {collapsed && badgeCount > 0 && (
                  <span
                    className={`absolute -top-2 -right-2 ${badgeClass} text-[10px] font-bold rounded-full px-1.5 py-0.5 min-w-[1.1rem] text-center leading-none`}
                  >
                    {badgeCount}
                  </span>
                )}
              </span>
              {!collapsed && <span className="flex-1">{item.label}</span>}
              {!collapsed && badgeCount > 0 && (
                <span
                  className={`ml-auto ${badgeClass} text-xs font-bold rounded-full px-2 py-0.5 min-w-[1.25rem] text-center`}
                >
                  {badgeCount}
                </span>
              )}
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
