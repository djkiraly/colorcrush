"use client";

import { useEffect, useState, useCallback } from "react";
import { StatsCard } from "@/components/admin/StatsCard";
import {
  DollarSign,
  ShoppingCart,
  TrendingUp,
  Eye,
  Users,
  Globe,
  Monitor,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
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
import {
  PageViewsChart,
  TopPagesChart,
  ProductViewsChart,
  DonutChart,
  ReferrersChart,
  CountriesChart,
} from "@/components/admin/charts/traffic";

const PERIODS = [
  { value: "7d", label: "7 Days" },
  { value: "30d", label: "30 Days" },
  { value: "90d", label: "90 Days" },
  { value: "12mo", label: "12 Months" },
];

// ---------------------------------------------------------------------------
// Chart card wrapper
// ---------------------------------------------------------------------------

function ChartCard({
  title,
  children,
  className,
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "bg-card rounded-xl p-6 shadow-sm border border-border/50 dark:border-border/30",
        className
      )}
    >
      <h3 className="font-heading font-semibold text-xs text-muted-foreground uppercase tracking-widest mb-4">
        {title}
      </h3>
      {children}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Data table for top pages / referrers / cities
// ---------------------------------------------------------------------------

function RankTable({
  data,
  columns,
}: {
  data: Record<string, any>[];
  columns: { key: string; label: string; align?: "left" | "right" }[];
}) {
  return (
    <div className="overflow-x-auto -mx-1">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border">
            <th className="text-left py-2.5 pr-3 pl-1 text-xs font-medium text-muted-foreground w-8 select-none">
              #
            </th>
            {columns.map((col) => (
              <th
                key={col.key}
                className={cn(
                  "py-2.5 px-2 text-xs font-medium text-muted-foreground",
                  col.align === "right" ? "text-right" : "text-left"
                )}
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border/50">
          {data.map((row, i) => (
            <tr
              key={i}
              className="transition-colors duration-100 hover:bg-muted/40"
            >
              <td className="py-2.5 pr-3 pl-1 text-xs tabular-nums text-muted-foreground">
                {i + 1}
              </td>
              {columns.map((col) => (
                <td
                  key={col.key}
                  className={cn(
                    "py-2.5 px-2 text-sm",
                    col.align === "right"
                      ? "text-right font-medium tabular-nums text-foreground"
                      : "text-left text-foreground/80"
                  )}
                >
                  {col.key === "path" ? (
                    <span className="font-mono text-xs text-muted-foreground tracking-tight">
                      {row[col.key]}
                    </span>
                  ) : typeof row[col.key] === "number" ? (
                    row[col.key].toLocaleString()
                  ) : (
                    row[col.key]
                  )}
                </td>
              ))}
            </tr>
          ))}
          {data.length === 0 && (
            <tr>
              <td
                colSpan={columns.length + 1}
                className="text-center py-10 text-sm text-muted-foreground"
              >
                No data yet
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------------

function AnalyticsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="h-8 w-40 rounded-lg bg-muted animate-pulse" />
        <div className="flex gap-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-8 w-20 rounded-md bg-muted animate-pulse" />
          ))}
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-28 rounded-xl bg-muted animate-pulse" />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-80 rounded-xl bg-muted animate-pulse" />
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function AdminAnalyticsPage() {
  const [salesData, setSalesData] = useState<any>(null);
  const [trafficData, setTrafficData] = useState<any>(null);
  const [period, setPeriod] = useState("30d");
  const [activeTab, setActiveTab] = useState("overview");
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [salesRes, trafficRes] = await Promise.all([
        fetch(`/api/analytics?period=${period}`),
        fetch(`/api/analytics/traffic?period=${period}`),
      ]);
      const [sales, traffic] = await Promise.all([
        salesRes.json(),
        trafficRes.json(),
      ]);
      setSalesData(sales);
      setTrafficData(traffic);
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading || !salesData || !trafficData) {
    return <AnalyticsSkeleton />;
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-heading font-bold text-brand-secondary">
          Analytics
        </h1>

        {/* Period filter */}
        <div
          className="flex gap-1 p-1 rounded-lg bg-muted"
          role="group"
          aria-label="Select time period"
        >
          {PERIODS.map((p) => (
            <Button
              key={p.value}
              variant="ghost"
              size="sm"
              onClick={() => setPeriod(p.value)}
              aria-pressed={period === p.value}
              className={cn(
                "rounded-md text-sm font-medium transition-colors duration-150",
                "focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
                period === p.value
                  ? "bg-card text-brand-secondary shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-card/60"
              )}
            >
              {p.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as string)}>
        <TabsList variant="line" className="w-full justify-start">
          <TabsTrigger value="overview" className="px-4">
            Overview
          </TabsTrigger>
          <TabsTrigger value="traffic" className="px-4">
            Traffic
          </TabsTrigger>
          <TabsTrigger value="demographics" className="px-4">
            Demographics
          </TabsTrigger>
        </TabsList>

        {/* ============================================================= */}
        {/* OVERVIEW TAB — all existing charts preserved                   */}
        {/* ============================================================= */}
        <TabsContent value="overview">
          <div className="space-y-8 pt-6">
            {/* Summary Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <StatsCard
                label="Total Revenue"
                value={`$${salesData.summary.totalRevenue.toFixed(2)}`}
                icon={DollarSign}
                color="bg-brand-mint/20"
              />
              <StatsCard
                label="Total Orders"
                value={String(salesData.summary.totalOrders)}
                icon={ShoppingCart}
                color="bg-brand-pink/20"
              />
              <StatsCard
                label="Avg Order Value"
                value={`$${salesData.summary.avgOrderValue.toFixed(2)}`}
                icon={TrendingUp}
                color="bg-brand-lavender/20"
              />
            </div>

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <ChartCard title="Revenue Over Time">
                <RevenueChart data={salesData.revenueByDay} />
              </ChartCard>

              <ChartCard title="Orders Over Time">
                <OrdersChart data={salesData.revenueByDay} />
              </ChartCard>

              <ChartCard title="Top Selling Products">
                <TopProductsChart data={salesData.topProducts} />
              </ChartCard>

              <ChartCard title="Revenue by Category">
                <CategoryPieChart data={salesData.revenueByCategory} />
              </ChartCard>

              <ChartCard title="Customer Growth">
                <CustomerGrowthChart data={salesData.customerGrowth} />
              </ChartCard>

              <ChartCard title="Average Order Value">
                <AOVChart data={salesData.revenueByDay} />
              </ChartCard>

              <ChartCard title="Sales by Day of Week">
                <SalesByDayChart data={salesData.salesByDayOfWeek} />
              </ChartCard>

              <ChartCard title="Inventory Status" className="lg:col-span-2">
                <InventoryChart data={salesData.inventoryStatus} />
              </ChartCard>
            </div>
          </div>
        </TabsContent>

        {/* ============================================================= */}
        {/* TRAFFIC TAB                                                    */}
        {/* ============================================================= */}
        <TabsContent value="traffic">
          <div className="space-y-8 pt-6">
            {/* Traffic Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-6">
              <StatsCard
                label="Total Page Views"
                value={trafficData.summary.totalViews.toLocaleString()}
                icon={Eye}
                color="bg-brand-pink/20"
              />
              <StatsCard
                label="Unique Visitors"
                value={trafficData.summary.uniqueVisitors.toLocaleString()}
                icon={Users}
                color="bg-brand-mint/20"
              />
              <StatsCard
                label="Pages Tracked"
                value={String(trafficData.summary.uniquePages)}
                icon={Monitor}
                color="bg-brand-lavender/20"
              />
              <StatsCard
                label="Views / Visitor"
                value={trafficData.summary.avgViewsPerVisitor.toFixed(1)}
                icon={TrendingUp}
                color="bg-brand-sky/20"
              />
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <ChartCard title="Page Views Over Time" className="lg:col-span-2">
                <PageViewsChart data={trafficData.viewsByDay} />
              </ChartCard>

              <ChartCard title="Top Pages">
                <RankTable
                  data={trafficData.topPages}
                  columns={[
                    { key: "path", label: "Page" },
                    { key: "views", label: "Views", align: "right" },
                    { key: "uniqueVisitors", label: "Visitors", align: "right" },
                  ]}
                />
              </ChartCard>

              <ChartCard title="Most Viewed Products">
                {trafficData.topProducts.length > 0 ? (
                  <ProductViewsChart data={trafficData.topProducts} />
                ) : (
                  <p className="text-sm text-brand-text-muted py-8 text-center">
                    No product views tracked yet
                  </p>
                )}
              </ChartCard>

              <ChartCard title="Top Referrers" className="lg:col-span-2">
                {trafficData.referrers.length > 0 ? (
                  <ReferrersChart data={trafficData.referrers} />
                ) : (
                  <p className="text-sm text-brand-text-muted py-8 text-center">
                    No referrer data yet. Visits from external sites will appear here.
                  </p>
                )}
              </ChartCard>
            </div>
          </div>
        </TabsContent>

        {/* ============================================================= */}
        {/* DEMOGRAPHICS TAB                                               */}
        {/* ============================================================= */}
        <TabsContent value="demographics">
          <div className="space-y-8 pt-6">
            {/* Top-level geo stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <StatsCard
                label="Countries"
                value={String(trafficData.countries.length)}
                icon={Globe}
                color="bg-brand-mint/20"
              />
              <StatsCard
                label="Unique Visitors"
                value={trafficData.summary.uniqueVisitors.toLocaleString()}
                icon={Users}
                color="bg-brand-pink/20"
              />
              <StatsCard
                label="Total Views"
                value={trafficData.summary.totalViews.toLocaleString()}
                icon={Eye}
                color="bg-brand-lavender/20"
              />
            </div>

            {/* Donut charts row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <ChartCard title="Browsers">
                {trafficData.browsers.length > 0 ? (
                  <DonutChart data={trafficData.browsers} />
                ) : (
                  <p className="text-sm text-brand-text-muted py-8 text-center">No data yet</p>
                )}
              </ChartCard>

              <ChartCard title="Operating Systems">
                {trafficData.operatingSystems.length > 0 ? (
                  <DonutChart data={trafficData.operatingSystems} />
                ) : (
                  <p className="text-sm text-brand-text-muted py-8 text-center">No data yet</p>
                )}
              </ChartCard>

              <ChartCard title="Device Types">
                {trafficData.deviceTypes.length > 0 ? (
                  <DonutChart data={trafficData.deviceTypes} />
                ) : (
                  <p className="text-sm text-brand-text-muted py-8 text-center">No data yet</p>
                )}
              </ChartCard>
            </div>

            {/* Location details */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <ChartCard title="Visitors by Country">
                {trafficData.countries.length > 0 ? (
                  <CountriesChart data={trafficData.countries} />
                ) : (
                  <p className="text-sm text-brand-text-muted py-8 text-center">
                    Location data requires geo headers (Vercel, Cloudflare)
                  </p>
                )}
              </ChartCard>

              <ChartCard title="Top Cities">
                <RankTable
                  data={trafficData.cities}
                  columns={[
                    { key: "name", label: "City" },
                    { key: "count", label: "Views", align: "right" },
                  ]}
                />
              </ChartCard>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
