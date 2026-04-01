"use client";

import { useEffect, useState } from "react";
import { StatsCard } from "@/components/admin/StatsCard";
import { DollarSign, ShoppingCart, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  RevenueChart,
  OrdersChart,
  TopProductsChart,
  CategoryPieChart,
  InventoryChart,
  CustomerGrowthChart,
  SalesByDayChart,
  AOVChart,
} from "@/components/admin/charts";

const PERIODS = [
  { value: "7d", label: "7 Days" },
  { value: "30d", label: "30 Days" },
  { value: "90d", label: "90 Days" },
  { value: "12mo", label: "12 Months" },
];

export default function AdminAnalyticsPage() {
  const [data, setData] = useState<any>(null);
  const [period, setPeriod] = useState("30d");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAnalytics() {
      setLoading(true);
      const res = await fetch(`/api/analytics?period=${period}`);
      const json = await res.json();
      setData(json);
      setLoading(false);
    }
    fetchAnalytics();
  }, [period]);

  if (loading || !data) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-gray-200 rounded w-48 animate-pulse" />
        <div className="grid grid-cols-3 gap-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-32 bg-gray-200 rounded-xl animate-pulse" />
          ))}
        </div>
        <div className="h-80 bg-gray-200 rounded-xl animate-pulse" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-heading font-bold text-brand-secondary">
          Analytics
        </h1>
        <div className="flex gap-2">
          {PERIODS.map((p) => (
            <Button
              key={p.value}
              variant={period === p.value ? "default" : "outline"}
              size="sm"
              onClick={() => setPeriod(p.value)}
              className={period === p.value ? "bg-brand-primary text-white" : ""}
            >
              {p.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <StatsCard
          label="Total Revenue"
          value={`$${data.summary.totalRevenue.toFixed(2)}`}
          icon={DollarSign}
          color="bg-brand-mint/20"
        />
        <StatsCard
          label="Total Orders"
          value={String(data.summary.totalOrders)}
          icon={ShoppingCart}
          color="bg-brand-pink/20"
        />
        <StatsCard
          label="Avg Order Value"
          value={`$${data.summary.avgOrderValue.toFixed(2)}`}
          icon={TrendingUp}
          color="bg-brand-lavender/20"
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <h3 className="font-heading font-semibold mb-4">Revenue Over Time</h3>
          <RevenueChart data={data.revenueByDay} />
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm">
          <h3 className="font-heading font-semibold mb-4">Orders Over Time</h3>
          <OrdersChart data={data.revenueByDay} />
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm">
          <h3 className="font-heading font-semibold mb-4">Top Selling Products</h3>
          <TopProductsChart data={data.topProducts} />
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm">
          <h3 className="font-heading font-semibold mb-4">Revenue by Category</h3>
          <CategoryPieChart data={data.revenueByCategory} />
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm">
          <h3 className="font-heading font-semibold mb-4">Inventory Status</h3>
          <InventoryChart data={data.inventoryStatus} />
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm">
          <h3 className="font-heading font-semibold mb-4">Customer Growth</h3>
          <CustomerGrowthChart data={data.customerGrowth} />
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm">
          <h3 className="font-heading font-semibold mb-4">Average Order Value</h3>
          <AOVChart data={data.revenueByDay} />
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm">
          <h3 className="font-heading font-semibold mb-4">Sales by Day of Week</h3>
          <SalesByDayChart data={data.salesByDayOfWeek} />
        </div>
      </div>
    </div>
  );
}
