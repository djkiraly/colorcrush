"use client";

import { useEffect, useState } from "react";
import { StatsCard } from "@/components/admin/StatsCard";
import { OrderStatusBadge } from "@/components/admin/OrderStatusBadge";
import { DollarSign, ShoppingCart, Clock, AlertTriangle, Info, Bell } from "lucide-react";
import Link from "next/link";
import { GGSA_FLAVOR_LABELS, type GgsaFlavor } from "@/lib/validators/ggsa";

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    todayRevenue: 0,
    todayOrders: 0,
    pendingOrders: 0,
    lowStockItems: 0,
    activeAlerts: 0,
  });
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [lowStock, setLowStock] = useState<any[]>([]);

  useEffect(() => {
    async function fetchData() {
      try {
        const [ordersRes, ggsaRes, inventoryRes, alertsRes] = await Promise.all([
          fetch("/api/orders?limit=10"),
          fetch("/api/admin/ggsa-orders"),
          fetch("/api/inventory"),
          fetch("/api/alerts/active"),
        ]);
        const ordersData = await ordersRes.json();
        const ggsaData = await ggsaRes.json();
        const inventoryData = await inventoryRes.json();
        const alertsData = await alertsRes.json();

        const orders = ordersData.orders || [];
        const ggsaOrders = ggsaData.orders || [];

        // Normalize store + GGSA orders into one display shape so they can share
        // the Recent Orders list. GGSA orders live in their own table/route and
        // link to /admin/ggsa-orders rather than an individual order page.
        const normalizedStore = orders.map((o: any) => ({
          id: o.id,
          source: "store" as const,
          primary: o.orderNumber,
          secondary: o.userName,
          status: o.status,
          total: parseFloat(o.total || "0"),
          createdAt: o.createdAt,
          href: `/admin/orders/${o.id}`,
        }));
        const normalizedGgsa = ggsaOrders.map((o: any) => ({
          id: o.id,
          source: "ggsa" as const,
          primary: o.teamName || o.contactName,
          secondary: `${o.quantity} × ${GGSA_FLAVOR_LABELS[o.flavor as GgsaFlavor] ?? o.flavor}`,
          status: o.status,
          total: (o.totalCents || 0) / 100,
          createdAt: o.createdAt,
          href: "/admin/ggsa-orders",
        }));
        const merged = [...normalizedStore, ...normalizedGgsa].sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );

        const today = new Date().toDateString();
        const todayOrders = merged.filter(
          (o) => new Date(o.createdAt).toDateString() === today
        );

        const lowStockItems = (inventoryData.items || []).filter(
          (i: any) => i.quantity <= i.lowStockThreshold
        );

        setStats({
          todayRevenue: todayOrders.reduce((sum, o) => sum + o.total, 0),
          todayOrders: todayOrders.length,
          pendingOrders: merged.filter((o) => o.status === "pending").length,
          lowStockItems: lowStockItems.length,
          activeAlerts: alertsData.count ?? 0,
        });

        setRecentOrders(merged.slice(0, 10));
        setLowStock(lowStockItems.slice(0, 5));
      } catch {
        // handle
      }
    }
    fetchData();
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-heading font-bold text-brand-secondary mb-6">
        Dashboard
      </h1>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
        <StatsCard
          label="Today's Revenue"
          value={`$${stats.todayRevenue.toFixed(2)}`}
          icon={DollarSign}
          color="bg-brand-mint/20"
        />
        <StatsCard
          label="Orders Today"
          value={String(stats.todayOrders)}
          icon={ShoppingCart}
          color="bg-brand-pink/20"
        />
        <StatsCard
          label="Pending Orders"
          value={String(stats.pendingOrders)}
          icon={Clock}
          color="bg-brand-peach/20"
        />
        <StatsCard
          label="Low Stock Items"
          value={String(stats.lowStockItems)}
          icon={AlertTriangle}
          color="bg-brand-lavender/20"
        />
        <Link href="/admin/alerts" className="block">
          <StatsCard
            label="Active Alerts"
            value={String(stats.activeAlerts)}
            icon={Bell}
            color="bg-brand-sky/20"
          />
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-heading font-semibold">Recent Orders</h2>
            <Link
              href="/admin/orders"
              className="text-sm text-brand-primary hover:underline"
            >
              View All
            </Link>
          </div>
          <div className="space-y-3">
            {recentOrders.length === 0 ? (
              <p className="text-brand-text-muted text-sm py-4 text-center">
                No orders yet
              </p>
            ) : (
              recentOrders.map((order) => (
                <Link
                  key={`${order.source}-${order.id}`}
                  href={order.href}
                  className="flex items-center justify-between py-2 hover:bg-gray-50 rounded px-2 -mx-2"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium flex items-center gap-1.5">
                      {order.source === "ggsa" && (
                        <span className="inline-block rounded bg-[#7B2D8E]/10 text-[#7B2D8E] text-[10px] font-semibold px-1.5 py-0.5">
                          GGSA
                        </span>
                      )}
                      <span className="truncate">{order.primary}</span>
                    </p>
                    <p className="text-xs text-brand-text-muted truncate">{order.secondary}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <OrderStatusBadge status={order.status} />
                    <span className="text-sm font-semibold">${order.total.toFixed(2)}</span>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>

        {/* Low Stock Alerts */}
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-heading font-semibold">Low Stock Alerts</h2>
            <Link
              href="/admin/inventory"
              className="text-sm text-brand-primary hover:underline"
            >
              View All
            </Link>
          </div>
          <div className="space-y-3">
            {lowStock.length === 0 ? (
              <p className="text-brand-text-muted text-sm py-4 text-center">
                All stock levels healthy
              </p>
            ) : (
              lowStock.map((item: any) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between py-2"
                >
                  <div>
                    <p className="text-sm font-medium">{item.productName}</p>
                    <p className="text-xs text-brand-text-muted">
                      SKU: {item.sku}
                    </p>
                  </div>
                  <span
                    className={`text-sm font-bold ${
                      item.quantity === 0
                        ? "text-brand-error"
                        : "text-brand-warning"
                    }`}
                  >
                    {item.quantity} left
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* System Info */}
      <div className="mt-8 bg-white rounded-xl p-4 shadow-sm flex items-center gap-3 text-sm text-brand-text-muted">
        <Info className="h-4 w-4 flex-shrink-0" />
        <span>
          Version {process.env.NEXT_PUBLIC_APP_VERSION} ({process.env.NEXT_PUBLIC_BUILD_HASH}) &middot; Deployed {new Date(process.env.NEXT_PUBLIC_BUILD_DATE || "").toLocaleString()}
        </span>
      </div>
    </div>
  );
}
