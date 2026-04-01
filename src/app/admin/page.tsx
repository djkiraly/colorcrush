"use client";

import { useEffect, useState } from "react";
import { StatsCard } from "@/components/admin/StatsCard";
import { OrderStatusBadge } from "@/components/admin/OrderStatusBadge";
import { DollarSign, ShoppingCart, Clock, AlertTriangle } from "lucide-react";
import Link from "next/link";

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    todayRevenue: 0,
    todayOrders: 0,
    pendingOrders: 0,
    lowStockItems: 0,
  });
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [lowStock, setLowStock] = useState<any[]>([]);

  useEffect(() => {
    async function fetchData() {
      try {
        const [ordersRes, inventoryRes] = await Promise.all([
          fetch("/api/orders?limit=10"),
          fetch("/api/inventory"),
        ]);
        const ordersData = await ordersRes.json();
        const inventoryData = await inventoryRes.json();

        const orders = ordersData.orders || [];
        const today = new Date().toDateString();
        const todayOrders = orders.filter(
          (o: any) => new Date(o.createdAt).toDateString() === today
        );

        const lowStockItems = (inventoryData.items || []).filter(
          (i: any) => i.quantity <= i.lowStockThreshold
        );

        setStats({
          todayRevenue: todayOrders.reduce(
            (sum: number, o: any) => sum + parseFloat(o.total || "0"),
            0
          ),
          todayOrders: todayOrders.length,
          pendingOrders: orders.filter((o: any) => o.status === "pending").length,
          lowStockItems: lowStockItems.length,
        });

        setRecentOrders(orders.slice(0, 10));
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
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
                  key={order.id}
                  href={`/admin/orders/${order.id}`}
                  className="flex items-center justify-between py-2 hover:bg-gray-50 rounded px-2 -mx-2"
                >
                  <div>
                    <p className="text-sm font-medium">{order.orderNumber}</p>
                    <p className="text-xs text-brand-text-muted">{order.userName}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <OrderStatusBadge status={order.status} />
                    <span className="text-sm font-semibold">${order.total}</span>
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
    </div>
  );
}
