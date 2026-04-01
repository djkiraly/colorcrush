import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { orders, orderItems, products, categories, users, inventory } from "@/lib/db/schema";
import { eq, gte, lte, and, sql, desc, ne } from "drizzle-orm";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const period = searchParams.get("period") || "30d";

  let startDate: Date;
  const endDate = new Date();

  switch (period) {
    case "7d":
      startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      break;
    case "30d":
      startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      break;
    case "90d":
      startDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
      break;
    case "12mo":
      startDate = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);
      break;
    default:
      startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  }

  const dateFilter = and(
    gte(orders.createdAt, startDate),
    lte(orders.createdAt, endDate),
    ne(orders.status, "cancelled")
  );

  // Revenue over time (daily)
  const revenueByDay = await db
    .select({
      date: sql<string>`date_trunc('day', ${orders.createdAt})::date`,
      revenue: sql<number>`COALESCE(sum(${orders.total}::numeric), 0)`,
      orderCount: sql<number>`count(*)`,
    })
    .from(orders)
    .where(dateFilter)
    .groupBy(sql`date_trunc('day', ${orders.createdAt})::date`)
    .orderBy(sql`date_trunc('day', ${orders.createdAt})::date`);

  // Orders by status
  const ordersByStatus = await db
    .select({
      status: orders.status,
      count: sql<number>`count(*)`,
    })
    .from(orders)
    .where(and(gte(orders.createdAt, startDate), lte(orders.createdAt, endDate)))
    .groupBy(orders.status);

  // Top selling products
  const topProducts = await db
    .select({
      productName: orderItems.productName,
      totalUnits: sql<number>`sum(${orderItems.quantity})`,
      totalRevenue: sql<number>`sum(${orderItems.totalPrice}::numeric)`,
    })
    .from(orderItems)
    .innerJoin(orders, eq(orderItems.orderId, orders.id))
    .where(dateFilter)
    .groupBy(orderItems.productName)
    .orderBy(desc(sql`sum(${orderItems.totalPrice}::numeric)`))
    .limit(10);

  // Revenue by category
  const revenueByCategory = await db
    .select({
      categoryName: sql<string>`COALESCE(${categories.name}, 'Uncategorized')`,
      revenue: sql<number>`sum(${orderItems.totalPrice}::numeric)`,
    })
    .from(orderItems)
    .innerJoin(orders, eq(orderItems.orderId, orders.id))
    .innerJoin(products, eq(orderItems.productId, products.id))
    .leftJoin(categories, eq(products.categoryId, categories.id))
    .where(dateFilter)
    .groupBy(categories.name);

  // Inventory status
  const inventoryStatus = await db
    .select({
      productName: products.name,
      quantity: inventory.quantity,
      lowStockThreshold: inventory.lowStockThreshold,
    })
    .from(inventory)
    .innerJoin(products, eq(inventory.productId, products.id))
    .orderBy(inventory.quantity)
    .limit(20);

  // Customer growth
  const customerGrowth = await db
    .select({
      date: sql<string>`date_trunc('day', ${users.createdAt})::date`,
      newCustomers: sql<number>`count(*)`,
    })
    .from(users)
    .where(
      and(
        gte(users.createdAt, startDate),
        eq(users.role, "customer")
      )
    )
    .groupBy(sql`date_trunc('day', ${users.createdAt})::date`)
    .orderBy(sql`date_trunc('day', ${users.createdAt})::date`);

  // Summary stats
  const [summaryResult] = await db
    .select({
      totalRevenue: sql<number>`COALESCE(sum(${orders.total}::numeric), 0)`,
      totalOrders: sql<number>`count(*)`,
      avgOrderValue: sql<number>`COALESCE(avg(${orders.total}::numeric), 0)`,
    })
    .from(orders)
    .where(dateFilter);

  // Sales by day of week
  const salesByDayOfWeek = await db
    .select({
      dayOfWeek: sql<number>`extract(dow from ${orders.createdAt})`,
      avgRevenue: sql<number>`avg(${orders.total}::numeric)`,
      avgOrders: sql<number>`count(*)`,
    })
    .from(orders)
    .where(dateFilter)
    .groupBy(sql`extract(dow from ${orders.createdAt})`);

  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return NextResponse.json({
    revenueByDay: revenueByDay.map((r) => ({
      date: r.date,
      revenue: Number(r.revenue),
      orders: Number(r.orderCount),
    })),
    ordersByStatus: ordersByStatus.map((o) => ({
      status: o.status,
      count: Number(o.count),
    })),
    topProducts: topProducts.map((p) => ({
      name: p.productName,
      units: Number(p.totalUnits),
      revenue: Number(p.totalRevenue),
    })),
    revenueByCategory: revenueByCategory.map((c) => ({
      name: c.categoryName,
      revenue: Number(c.revenue),
    })),
    inventoryStatus: inventoryStatus.map((i) => ({
      name: i.productName,
      quantity: i.quantity,
      threshold: i.lowStockThreshold,
    })),
    customerGrowth: customerGrowth.map((c) => ({
      date: c.date,
      newCustomers: Number(c.newCustomers),
    })),
    salesByDayOfWeek: salesByDayOfWeek.map((s) => ({
      day: dayNames[Number(s.dayOfWeek)] || "?",
      avgRevenue: Number(s.avgRevenue),
      orders: Number(s.avgOrders),
    })),
    summary: {
      totalRevenue: Number(summaryResult.totalRevenue),
      totalOrders: Number(summaryResult.totalOrders),
      avgOrderValue: Number(summaryResult.avgOrderValue),
    },
    period,
  });
}
