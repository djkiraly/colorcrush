import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { pageViews, products } from "@/lib/db/schema";
import { and, gte, lte, sql, desc, eq, countDistinct } from "drizzle-orm";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const period = searchParams.get("period") || "30d";

  let startDate: Date;
  const endDate = new Date();

  switch (period) {
    case "7d":
      startDate = new Date(Date.now() - 7 * 86_400_000);
      break;
    case "30d":
      startDate = new Date(Date.now() - 30 * 86_400_000);
      break;
    case "90d":
      startDate = new Date(Date.now() - 90 * 86_400_000);
      break;
    case "12mo":
      startDate = new Date(Date.now() - 365 * 86_400_000);
      break;
    default:
      startDate = new Date(Date.now() - 30 * 86_400_000);
  }

  const dateFilter = and(
    gte(pageViews.createdAt, startDate),
    lte(pageViews.createdAt, endDate)
  );

  // Run all queries in parallel
  const [
    viewsByDay,
    topPages,
    topProducts,
    browsers,
    operatingSystems,
    deviceTypes,
    referrers,
    countries,
    cities,
    summary,
  ] = await Promise.all([
    // Views over time
    db
      .select({
        date: sql<string>`date_trunc('day', ${pageViews.createdAt})::date`,
        views: sql<number>`count(*)`,
        uniqueVisitors: countDistinct(pageViews.sessionId),
      })
      .from(pageViews)
      .where(dateFilter)
      .groupBy(sql`date_trunc('day', ${pageViews.createdAt})::date`)
      .orderBy(sql`date_trunc('day', ${pageViews.createdAt})::date`),

    // Top pages
    db
      .select({
        path: pageViews.path,
        views: sql<number>`count(*)`,
        uniqueVisitors: countDistinct(pageViews.sessionId),
      })
      .from(pageViews)
      .where(dateFilter)
      .groupBy(pageViews.path)
      .orderBy(desc(sql`count(*)`))
      .limit(15),

    // Top product views
    db
      .select({
        productName: products.name,
        productId: pageViews.productId,
        views: sql<number>`count(*)`,
      })
      .from(pageViews)
      .innerJoin(products, eq(pageViews.productId, products.id))
      .where(dateFilter)
      .groupBy(products.name, pageViews.productId)
      .orderBy(desc(sql`count(*)`))
      .limit(10),

    // Browsers
    db
      .select({
        name: pageViews.browser,
        count: sql<number>`count(*)`,
      })
      .from(pageViews)
      .where(and(dateFilter, sql`${pageViews.browser} IS NOT NULL`))
      .groupBy(pageViews.browser)
      .orderBy(desc(sql`count(*)`))
      .limit(10),

    // Operating Systems
    db
      .select({
        name: pageViews.os,
        count: sql<number>`count(*)`,
      })
      .from(pageViews)
      .where(and(dateFilter, sql`${pageViews.os} IS NOT NULL`))
      .groupBy(pageViews.os)
      .orderBy(desc(sql`count(*)`))
      .limit(10),

    // Device types
    db
      .select({
        name: pageViews.deviceType,
        count: sql<number>`count(*)`,
      })
      .from(pageViews)
      .where(and(dateFilter, sql`${pageViews.deviceType} IS NOT NULL`))
      .groupBy(pageViews.deviceType)
      .orderBy(desc(sql`count(*)`)),

    // Referrers
    db
      .select({
        referrer: pageViews.referrer,
        count: sql<number>`count(*)`,
      })
      .from(pageViews)
      .where(and(dateFilter, sql`${pageViews.referrer} IS NOT NULL AND ${pageViews.referrer} != ''`))
      .groupBy(pageViews.referrer)
      .orderBy(desc(sql`count(*)`))
      .limit(15),

    // Countries
    db
      .select({
        name: pageViews.country,
        count: sql<number>`count(*)`,
        uniqueVisitors: countDistinct(pageViews.sessionId),
      })
      .from(pageViews)
      .where(and(dateFilter, sql`${pageViews.country} IS NOT NULL`))
      .groupBy(pageViews.country)
      .orderBy(desc(sql`count(*)`))
      .limit(20),

    // Cities
    db
      .select({
        city: pageViews.city,
        country: pageViews.country,
        count: sql<number>`count(*)`,
      })
      .from(pageViews)
      .where(and(dateFilter, sql`${pageViews.city} IS NOT NULL`))
      .groupBy(pageViews.city, pageViews.country)
      .orderBy(desc(sql`count(*)`))
      .limit(15),

    // Summary totals
    db
      .select({
        totalViews: sql<number>`count(*)`,
        uniqueVisitors: countDistinct(pageViews.sessionId),
        uniquePages: countDistinct(pageViews.path),
      })
      .from(pageViews)
      .where(dateFilter),
  ]);

  // Normalize referrers to domains
  const referrerDomains = new Map<string, number>();
  for (const r of referrers) {
    if (!r.referrer) continue;
    try {
      const domain = new URL(r.referrer).hostname.replace(/^www\./, "");
      referrerDomains.set(domain, (referrerDomains.get(domain) || 0) + Number(r.count));
    } catch {
      referrerDomains.set(r.referrer, (referrerDomains.get(r.referrer) || 0) + Number(r.count));
    }
  }
  const topReferrers = Array.from(referrerDomains.entries())
    .map(([domain, count]) => ({ name: domain, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  return NextResponse.json({
    viewsByDay: viewsByDay.map((r) => ({
      date: r.date,
      views: Number(r.views),
      uniqueVisitors: Number(r.uniqueVisitors),
    })),
    topPages: topPages.map((p) => ({
      path: p.path,
      views: Number(p.views),
      uniqueVisitors: Number(p.uniqueVisitors),
    })),
    topProducts: topProducts.map((p) => ({
      name: p.productName,
      views: Number(p.views),
    })),
    browsers: browsers.map((b) => ({ name: b.name || "Unknown", count: Number(b.count) })),
    operatingSystems: operatingSystems.map((o) => ({ name: o.name || "Unknown", count: Number(o.count) })),
    deviceTypes: deviceTypes.map((d) => ({ name: d.name || "Unknown", count: Number(d.count) })),
    referrers: topReferrers,
    countries: countries.map((c) => ({
      name: c.name || "Unknown",
      count: Number(c.count),
      uniqueVisitors: Number(c.uniqueVisitors),
    })),
    cities: cities.map((c) => ({
      name: c.city ? `${c.city}${c.country ? `, ${c.country}` : ""}` : "Unknown",
      count: Number(c.count),
    })),
    summary: {
      totalViews: Number(summary[0]?.totalViews ?? 0),
      uniqueVisitors: Number(summary[0]?.uniqueVisitors ?? 0),
      uniquePages: Number(summary[0]?.uniquePages ?? 0),
      avgViewsPerVisitor:
        Number(summary[0]?.uniqueVisitors ?? 0) > 0
          ? Number(summary[0]?.totalViews ?? 0) / Number(summary[0]?.uniqueVisitors ?? 1)
          : 0,
    },
    period,
  });
}
