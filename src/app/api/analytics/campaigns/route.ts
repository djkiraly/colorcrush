import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { pageViews, orders } from "@/lib/db/schema";
import { and, desc, eq, gte, lte, sql, ne } from "drizzle-orm";

function periodStart(period: string): Date {
  switch (period) {
    case "7d":
      return new Date(Date.now() - 7 * 86_400_000);
    case "90d":
      return new Date(Date.now() - 90 * 86_400_000);
    case "12mo":
      return new Date(Date.now() - 365 * 86_400_000);
    case "30d":
    default:
      return new Date(Date.now() - 30 * 86_400_000);
  }
}

export async function GET(request: NextRequest) {
  const period = request.nextUrl.searchParams.get("period") || "30d";
  const startDate = periodStart(period);
  const endDate = new Date();

  const viewWindow = and(
    gte(pageViews.createdAt, startDate),
    lte(pageViews.createdAt, endDate)
  );
  // Only count orders that weren't cancelled — abandoned/cancelled checkouts
  // shouldn't be attributed to ad spend.
  const orderWindow = and(
    gte(orders.createdAt, startDate),
    lte(orders.createdAt, endDate),
    ne(orders.status, "cancelled")
  );

  const [
    sources,
    mediums,
    campaigns,
    gclidStats,
    fbclidStats,
    sourceOrders,
    campaignOrders,
    summary,
  ] = await Promise.all([
    // Pageviews by UTM source
    db
      .select({
        name: pageViews.utmSource,
        views: sql<number>`count(*)`,
        sessions: sql<number>`count(distinct ${pageViews.sessionId})`,
      })
      .from(pageViews)
      .where(and(viewWindow, sql`${pageViews.utmSource} IS NOT NULL AND ${pageViews.utmSource} <> ''`))
      .groupBy(pageViews.utmSource)
      .orderBy(desc(sql`count(*)`))
      .limit(20),

    // Pageviews by UTM medium
    db
      .select({
        name: pageViews.utmMedium,
        views: sql<number>`count(*)`,
        sessions: sql<number>`count(distinct ${pageViews.sessionId})`,
      })
      .from(pageViews)
      .where(and(viewWindow, sql`${pageViews.utmMedium} IS NOT NULL AND ${pageViews.utmMedium} <> ''`))
      .groupBy(pageViews.utmMedium)
      .orderBy(desc(sql`count(*)`))
      .limit(10),

    // Pageviews by UTM campaign
    db
      .select({
        name: pageViews.utmCampaign,
        source: pageViews.utmSource,
        medium: pageViews.utmMedium,
        views: sql<number>`count(*)`,
        sessions: sql<number>`count(distinct ${pageViews.sessionId})`,
      })
      .from(pageViews)
      .where(and(viewWindow, sql`${pageViews.utmCampaign} IS NOT NULL AND ${pageViews.utmCampaign} <> ''`))
      .groupBy(pageViews.utmCampaign, pageViews.utmSource, pageViews.utmMedium)
      .orderBy(desc(sql`count(*)`))
      .limit(20),

    // Google Ads click stream
    db
      .select({
        clicks: sql<number>`count(*)`,
        sessions: sql<number>`count(distinct ${pageViews.sessionId})`,
      })
      .from(pageViews)
      .where(and(viewWindow, sql`${pageViews.gclid} IS NOT NULL AND ${pageViews.gclid} <> ''`)),

    // Meta click stream
    db
      .select({
        clicks: sql<number>`count(*)`,
        sessions: sql<number>`count(distinct ${pageViews.sessionId})`,
      })
      .from(pageViews)
      .where(and(viewWindow, sql`${pageViews.fbclid} IS NOT NULL AND ${pageViews.fbclid} <> ''`)),

    // Orders + revenue by attributed UTM source
    db
      .select({
        name: orders.utmSource,
        orderCount: sql<number>`count(*)`,
        revenue: sql<string>`coalesce(sum(${orders.total}), 0)`,
      })
      .from(orders)
      .where(and(orderWindow, sql`${orders.utmSource} IS NOT NULL AND ${orders.utmSource} <> ''`))
      .groupBy(orders.utmSource)
      .orderBy(desc(sql`coalesce(sum(${orders.total}), 0)`))
      .limit(20),

    // Orders + revenue by campaign
    db
      .select({
        name: orders.utmCampaign,
        source: orders.utmSource,
        medium: orders.utmMedium,
        orderCount: sql<number>`count(*)`,
        revenue: sql<string>`coalesce(sum(${orders.total}), 0)`,
      })
      .from(orders)
      .where(and(orderWindow, sql`${orders.utmCampaign} IS NOT NULL AND ${orders.utmCampaign} <> ''`))
      .groupBy(orders.utmCampaign, orders.utmSource, orders.utmMedium)
      .orderBy(desc(sql`coalesce(sum(${orders.total}), 0)`))
      .limit(20),

    // High-level summary across all attributed orders
    db
      .select({
        attributedOrders: sql<number>`count(*) filter (where ${orders.utmSource} is not null and ${orders.utmSource} <> '')`,
        attributedRevenue: sql<string>`coalesce(sum(${orders.total}) filter (where ${orders.utmSource} is not null and ${orders.utmSource} <> ''), 0)`,
        gclidOrders: sql<number>`count(*) filter (where ${orders.gclid} is not null and ${orders.gclid} <> '')`,
        gclidRevenue: sql<string>`coalesce(sum(${orders.total}) filter (where ${orders.gclid} is not null and ${orders.gclid} <> ''), 0)`,
        fbclidOrders: sql<number>`count(*) filter (where ${orders.fbclid} is not null and ${orders.fbclid} <> '')`,
        fbclidRevenue: sql<string>`coalesce(sum(${orders.total}) filter (where ${orders.fbclid} is not null and ${orders.fbclid} <> ''), 0)`,
        totalOrders: sql<number>`count(*)`,
        totalRevenue: sql<string>`coalesce(sum(${orders.total}), 0)`,
      })
      .from(orders)
      .where(orderWindow),
  ]);

  // Merge order revenue into source rows for a single "Sources" table.
  const ordersBySource = new Map(
    sourceOrders.map((o) => [
      o.name || "",
      { orderCount: Number(o.orderCount), revenue: Number(o.revenue) },
    ])
  );
  const sourcesEnriched = sources.map((s) => {
    const matched = ordersBySource.get(s.name || "");
    return {
      name: s.name || "(unset)",
      views: Number(s.views),
      sessions: Number(s.sessions),
      orderCount: matched?.orderCount ?? 0,
      revenue: matched?.revenue ?? 0,
      conversionRate:
        Number(s.sessions) > 0 && (matched?.orderCount ?? 0) > 0
          ? (matched!.orderCount / Number(s.sessions)) * 100
          : 0,
    };
  });

  // Also include sources that have orders but no pageviews (very rare — happens
  // if pageviews fall outside the window but the order doesn't).
  for (const o of sourceOrders) {
    if (!sources.some((s) => (s.name || "") === (o.name || ""))) {
      sourcesEnriched.push({
        name: o.name || "(unset)",
        views: 0,
        sessions: 0,
        orderCount: Number(o.orderCount),
        revenue: Number(o.revenue),
        conversionRate: 0,
      });
    }
  }
  sourcesEnriched.sort((a, b) => b.revenue - a.revenue || b.views - a.views);

  const ordersByCampaign = new Map(
    campaignOrders.map((o) => [
      `${o.name || ""}::${o.source || ""}::${o.medium || ""}`,
      { orderCount: Number(o.orderCount), revenue: Number(o.revenue) },
    ])
  );
  const campaignsEnriched = campaigns.map((c) => {
    const key = `${c.name || ""}::${c.source || ""}::${c.medium || ""}`;
    const matched = ordersByCampaign.get(key);
    return {
      name: c.name || "(unset)",
      source: c.source || null,
      medium: c.medium || null,
      views: Number(c.views),
      sessions: Number(c.sessions),
      orderCount: matched?.orderCount ?? 0,
      revenue: matched?.revenue ?? 0,
    };
  });

  return NextResponse.json({
    period,
    summary: {
      totalOrders: Number(summary[0]?.totalOrders ?? 0),
      totalRevenue: Number(summary[0]?.totalRevenue ?? 0),
      attributedOrders: Number(summary[0]?.attributedOrders ?? 0),
      attributedRevenue: Number(summary[0]?.attributedRevenue ?? 0),
      googleAds: {
        clicks: Number(gclidStats[0]?.clicks ?? 0),
        sessions: Number(gclidStats[0]?.sessions ?? 0),
        orders: Number(summary[0]?.gclidOrders ?? 0),
        revenue: Number(summary[0]?.gclidRevenue ?? 0),
      },
      meta: {
        clicks: Number(fbclidStats[0]?.clicks ?? 0),
        sessions: Number(fbclidStats[0]?.sessions ?? 0),
        orders: Number(summary[0]?.fbclidOrders ?? 0),
        revenue: Number(summary[0]?.fbclidRevenue ?? 0),
      },
    },
    sources: sourcesEnriched,
    mediums: mediums.map((m) => ({
      name: m.name || "(unset)",
      views: Number(m.views),
      sessions: Number(m.sessions),
    })),
    campaigns: campaignsEnriched,
  });
}
