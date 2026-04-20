import {
  pgTable,
  uuid,
  text,
  varchar,
  timestamp,
  boolean,
  integer,
  decimal,
  jsonb,
  pgEnum,
  uniqueIndex,
  index,
  primaryKey,
  type AnyPgColumn,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// ═══ ENUMS ═══
export const userRoleEnum = pgEnum("user_role", [
  "customer",
  "admin",
  "super_admin",
]);
export const orderStatusEnum = pgEnum("order_status", [
  "pending",
  "confirmed",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
  "refunded",
]);
export const shippingMethodEnum = pgEnum("shipping_method", [
  "standard",
  "express",
  "overnight",
]);
export const couponTypeEnum = pgEnum("coupon_type", [
  "percentage",
  "fixed",
  "free_shipping",
]);
export const inventoryChangeReasonEnum = pgEnum("inventory_change_reason", [
  "sale",
  "restock",
  "adjustment",
  "return",
  "damage",
]);
export const interactionTypeEnum = pgEnum("interaction_type", [
  "note",
  "email_sent",
  "phone_call",
  "complaint",
  "return_request",
  "feedback",
]);
export const interactionStatusEnum = pgEnum("interaction_status", [
  "open",
  "in_progress",
  "resolved",
  "closed",
]);
export const priorityEnum = pgEnum("priority", [
  "low",
  "medium",
  "high",
  "urgent",
]);
export const emailStatusEnum = pgEnum("email_status", [
  "sent",
  "failed",
  "bounced",
]);

// ═══ TABLES ═══

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  passwordHash: text("password_hash"),
  name: varchar("name", { length: 255 }).notNull(),
  role: userRoleEnum("role").default("customer").notNull(),
  phone: varchar("phone", { length: 20 }),
  avatarUrl: text("avatar_url"),
  emailVerified: timestamp("email_verified"),
  lastLoginAt: timestamp("last_login_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const addresses = pgTable("addresses", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  label: varchar("label", { length: 50 }),
  line1: varchar("line1", { length: 255 }).notNull(),
  line2: varchar("line2", { length: 255 }),
  city: varchar("city", { length: 100 }).notNull(),
  state: varchar("state", { length: 100 }).notNull(),
  zip: varchar("zip", { length: 20 }).notNull(),
  country: varchar("country", { length: 2 }).default("US").notNull(),
  isDefault: boolean("is_default").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const categories = pgTable(
  "categories",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: varchar("name", { length: 255 }).notNull().unique(),
    slug: varchar("slug", { length: 255 }).notNull().unique(),
    description: text("description"),
    imageUrl: text("image_url"),
    parentId: uuid("parent_id").references((): AnyPgColumn => categories.id, {
      onDelete: "set null",
    }),
    sortOrder: integer("sort_order").default(0).notNull(),
    isActive: boolean("is_active").default(true).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [uniqueIndex("categories_slug_idx").on(table.slug)]
);

export const products = pgTable(
  "products",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: varchar("name", { length: 255 }).notNull(),
    slug: varchar("slug", { length: 255 }).notNull().unique(),
    description: text("description"),
    shortDescription: text("short_description"),
    price: decimal("price", { precision: 10, scale: 2 }).notNull(),
    compareAtPrice: decimal("compare_at_price", { precision: 10, scale: 2 }),
    costPrice: decimal("cost_price", { precision: 10, scale: 2 }),
    sku: varchar("sku", { length: 100 }).notNull().unique(),
    barcode: varchar("barcode", { length: 100 }),
    manufacturer: varchar("manufacturer", { length: 255 }),
    weight: decimal("weight", { precision: 8, scale: 2 }),
    categoryId: uuid("category_id").references(() => categories.id, {
      onDelete: "set null",
    }),
    tags: text("tags").array(),
    isActive: boolean("is_active").default(true).notNull(),
    isFeatured: boolean("is_featured").default(false).notNull(),
    isGiftEligible: boolean("is_gift_eligible").default(true).notNull(),
    allergens: text("allergens").array(),
    ingredients: text("ingredients"),
    nutritionInfo: jsonb("nutrition_info"),
    metaTitle: varchar("meta_title", { length: 255 }),
    metaDescription: text("meta_description"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("products_slug_idx").on(table.slug),
    index("products_category_idx").on(table.categoryId),
    index("products_active_idx").on(table.isActive),
  ]
);

export const productCategories = pgTable(
  "product_categories",
  {
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    categoryId: uuid("category_id")
      .notNull()
      .references(() => categories.id, { onDelete: "cascade" }),
  },
  (table) => [
    primaryKey({ columns: [table.productId, table.categoryId] }),
    index("product_categories_product_idx").on(table.productId),
    index("product_categories_category_idx").on(table.categoryId),
  ]
);

export const productImages = pgTable("product_images", {
  id: uuid("id").defaultRandom().primaryKey(),
  productId: uuid("product_id")
    .notNull()
    .references(() => products.id, { onDelete: "cascade" }),
  url: text("url").notNull(),
  gcsPath: text("gcs_path"),
  altText: varchar("alt_text", { length: 255 }),
  sortOrder: integer("sort_order").default(0).notNull(),
  isPrimary: boolean("is_primary").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const inventory = pgTable(
  "inventory",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    productId: uuid("product_id")
      .notNull()
      .unique()
      .references(() => products.id, { onDelete: "cascade" }),
    quantity: integer("quantity").default(0).notNull(),
    lowStockThreshold: integer("low_stock_threshold").default(10).notNull(),
    reorderPoint: integer("reorder_point").default(20).notNull(),
    reorderQuantity: integer("reorder_quantity").default(100).notNull(),
    lastRestockedAt: timestamp("last_restocked_at"),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [index("inventory_product_idx").on(table.productId)]
);

export const inventoryLog = pgTable("inventory_log", {
  id: uuid("id").defaultRandom().primaryKey(),
  productId: uuid("product_id")
    .notNull()
    .references(() => products.id, { onDelete: "cascade" }),
  previousQty: integer("previous_qty").notNull(),
  newQty: integer("new_qty").notNull(),
  changeReason: inventoryChangeReasonEnum("change_reason").notNull(),
  notes: text("notes"),
  adminId: uuid("admin_id").references(() => users.id, {
    onDelete: "set null",
  }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const orders = pgTable(
  "orders",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    orderNumber: varchar("order_number", { length: 50 }).notNull().unique(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id),
    status: orderStatusEnum("status").default("pending").notNull(),
    subtotal: decimal("subtotal", { precision: 10, scale: 2 }).notNull(),
    shippingCost: decimal("shipping_cost", { precision: 10, scale: 2 })
      .default("0")
      .notNull(),
    taxAmount: decimal("tax_amount", { precision: 10, scale: 2 })
      .default("0")
      .notNull(),
    discountAmount: decimal("discount_amount", { precision: 10, scale: 2 })
      .default("0")
      .notNull(),
    total: decimal("total", { precision: 10, scale: 2 }).notNull(),
    shippingMethod: shippingMethodEnum("shipping_method"),
    shippingAddressId: uuid("shipping_address_id").references(
      () => addresses.id
    ),
    billingAddressId: uuid("billing_address_id").references(() => addresses.id),
    stripePaymentIntentId: varchar("stripe_payment_intent_id", {
      length: 255,
    }),
    stripeSessionId: varchar("stripe_session_id", { length: 255 }),
    giftMessage: text("gift_message"),
    isGift: boolean("is_gift").default(false).notNull(),
    notes: text("notes"),
    trackingNumber: varchar("tracking_number", { length: 255 }),
    trackingCarrier: varchar("tracking_carrier", { length: 100 }),
    shippedAt: timestamp("shipped_at"),
    deliveredAt: timestamp("delivered_at"),
    cancelledAt: timestamp("cancelled_at"),
    cancelReason: text("cancel_reason"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("orders_user_idx").on(table.userId),
    index("orders_status_idx").on(table.status),
    index("orders_created_idx").on(table.createdAt),
  ]
);

export const orderItems = pgTable(
  "order_items",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    orderId: uuid("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id),
    productName: varchar("product_name", { length: 255 }).notNull(),
    productImage: text("product_image"),
    quantity: integer("quantity").notNull(),
    unitPrice: decimal("unit_price", { precision: 10, scale: 2 }).notNull(),
    totalPrice: decimal("total_price", { precision: 10, scale: 2 }).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [index("order_items_order_idx").on(table.orderId)]
);

export const reviews = pgTable(
  "reviews",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id),
    rating: integer("rating").notNull(),
    title: varchar("title", { length: 255 }),
    body: text("body"),
    isVerifiedPurchase: boolean("is_verified_purchase").default(false).notNull(),
    isApproved: boolean("is_approved").default(false).notNull(),
    adminResponse: text("admin_response"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [index("reviews_product_idx").on(table.productId)]
);

export const wishlists = pgTable("wishlists", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  productId: uuid("product_id")
    .notNull()
    .references(() => products.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const coupons = pgTable("coupons", {
  id: uuid("id").defaultRandom().primaryKey(),
  code: varchar("code", { length: 50 }).notNull().unique(),
  type: couponTypeEnum("type").notNull(),
  value: decimal("value", { precision: 10, scale: 2 }).notNull(),
  minOrderAmount: decimal("min_order_amount", { precision: 10, scale: 2 }),
  maxUses: integer("max_uses"),
  usedCount: integer("used_count").default(0).notNull(),
  startsAt: timestamp("starts_at"),
  expiresAt: timestamp("expires_at"),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const customerInteractions = pgTable(
  "customer_interactions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id),
    adminId: uuid("admin_id").references(() => users.id),
    type: interactionTypeEnum("type").notNull(),
    subject: varchar("subject", { length: 255 }).notNull(),
    body: text("body"),
    relatedOrderId: uuid("related_order_id").references(() => orders.id),
    status: interactionStatusEnum("status").default("open").notNull(),
    priority: priorityEnum("priority").default("medium").notNull(),
    resolvedAt: timestamp("resolved_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("interactions_user_idx").on(table.userId),
    index("interactions_status_idx").on(table.status),
  ]
);

export const emailLog = pgTable("email_log", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").references(() => users.id),
  orderId: uuid("order_id").references(() => orders.id),
  templateName: varchar("template_name", { length: 100 }),
  to: varchar("to", { length: 255 }).notNull(),
  subject: varchar("subject", { length: 500 }).notNull(),
  status: emailStatusEnum("status").notNull(),
  errorMessage: text("error_message"),
  sentAt: timestamp("sent_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const orderAuditLog = pgTable(
  "order_audit_log",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    orderId: uuid("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    adminId: uuid("admin_id").references(() => users.id),
    action: varchar("action", { length: 100 }).notNull(),
    details: text("details"),
    previousValue: text("previous_value"),
    newValue: text("new_value"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [index("order_audit_log_order_idx").on(table.orderId)]
);

export const siteSettings = pgTable("site_settings", {
  id: uuid("id").defaultRandom().primaryKey(),
  key: varchar("key", { length: 100 }).notNull().unique(),
  value: jsonb("value").notNull(),
  updatedBy: uuid("updated_by").references(() => users.id),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ═══ PAGE VIEWS / ANALYTICS ═══

export const pageViews = pgTable(
  "page_views",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    path: varchar("path", { length: 500 }).notNull(),
    referrer: varchar("referrer", { length: 1000 }),
    browser: varchar("browser", { length: 100 }),
    os: varchar("os", { length: 100 }),
    deviceType: varchar("device_type", { length: 20 }), // desktop, mobile, tablet
    country: varchar("country", { length: 100 }),
    city: varchar("city", { length: 200 }),
    productId: uuid("product_id").references(() => products.id, { onDelete: "set null" }),
    userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
    sessionId: varchar("session_id", { length: 100 }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("page_views_path_idx").on(table.path),
    index("page_views_created_idx").on(table.createdAt),
    index("page_views_product_idx").on(table.productId),
    index("page_views_session_idx").on(table.sessionId),
  ]
);

// ═══ RELATIONS ═══

export const usersRelations = relations(users, ({ many }) => ({
  addresses: many(addresses),
  orders: many(orders),
  reviews: many(reviews),
  wishlists: many(wishlists),
  interactions: many(customerInteractions, { relationName: "customerInteractions" }),
}));

export const addressesRelations = relations(addresses, ({ one }) => ({
  user: one(users, { fields: [addresses.userId], references: [users.id] }),
}));

export const categoriesRelations = relations(categories, ({ many, one }) => ({
  products: many(products),
  parent: one(categories, {
    fields: [categories.parentId],
    references: [categories.id],
    relationName: "subcategories",
  }),
  children: many(categories, { relationName: "subcategories" }),
}));

export const productsRelations = relations(products, ({ one, many }) => ({
  category: one(categories, {
    fields: [products.categoryId],
    references: [categories.id],
  }),
  images: many(productImages),
  inventory: one(inventory, {
    fields: [products.id],
    references: [inventory.productId],
  }),
  reviews: many(reviews),
  orderItems: many(orderItems),
}));

export const productImagesRelations = relations(productImages, ({ one }) => ({
  product: one(products, {
    fields: [productImages.productId],
    references: [products.id],
  }),
}));

export const inventoryRelations = relations(inventory, ({ one }) => ({
  product: one(products, {
    fields: [inventory.productId],
    references: [products.id],
  }),
}));

export const orderAuditLogRelations = relations(orderAuditLog, ({ one }) => ({
  order: one(orders, { fields: [orderAuditLog.orderId], references: [orders.id] }),
  admin: one(users, { fields: [orderAuditLog.adminId], references: [users.id] }),
}));

export const ordersRelations = relations(orders, ({ one, many }) => ({
  user: one(users, { fields: [orders.userId], references: [users.id] }),
  items: many(orderItems),
  auditLog: many(orderAuditLog),
  shippingAddress: one(addresses, {
    fields: [orders.shippingAddressId],
    references: [addresses.id],
    relationName: "shippingAddress",
  }),
  billingAddress: one(addresses, {
    fields: [orders.billingAddressId],
    references: [addresses.id],
    relationName: "billingAddress",
  }),
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, {
    fields: [orderItems.orderId],
    references: [orders.id],
  }),
  product: one(products, {
    fields: [orderItems.productId],
    references: [products.id],
  }),
}));

export const reviewsRelations = relations(reviews, ({ one }) => ({
  product: one(products, {
    fields: [reviews.productId],
    references: [products.id],
  }),
  user: one(users, { fields: [reviews.userId], references: [users.id] }),
}));

export const wishlistsRelations = relations(wishlists, ({ one }) => ({
  user: one(users, { fields: [wishlists.userId], references: [users.id] }),
  product: one(products, {
    fields: [wishlists.productId],
    references: [products.id],
  }),
}));

export const customerInteractionsRelations = relations(
  customerInteractions,
  ({ one }) => ({
    user: one(users, {
      fields: [customerInteractions.userId],
      references: [users.id],
      relationName: "customerInteractions",
    }),
    admin: one(users, {
      fields: [customerInteractions.adminId],
      references: [users.id],
    }),
    relatedOrder: one(orders, {
      fields: [customerInteractions.relatedOrderId],
      references: [orders.id],
    }),
  })
);
