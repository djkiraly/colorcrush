ALTER TYPE "public"."order_status" ADD VALUE 'draft' BEFORE 'pending';--> statement-breakpoint
ALTER TYPE "public"."order_status" ADD VALUE 'pending_payment' BEFORE 'pending';--> statement-breakpoint
ALTER TYPE "public"."order_status" ADD VALUE 'paid_offline' BEFORE 'processing';--> statement-breakpoint
ALTER TABLE "order_items" ALTER COLUMN "product_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "addresses" ADD COLUMN "is_guest" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "order_items" ADD COLUMN "is_custom" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "order_items" ADD COLUMN "custom_description" text;--> statement-breakpoint
ALTER TABLE "order_items" ADD COLUMN "price_override" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "created_by_admin_id" uuid;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "payment_method" varchar(30);--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "offline_payment_notes" text;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "paid_at" timestamp;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "manual_discount_amount" numeric(10, 2) DEFAULT '0' NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "manual_discount_reason" text;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "payment_link_token" varchar(64);--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "payment_link_expires_at" timestamp;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "payment_link_sent_at" timestamp;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "tax_override" numeric(10, 2);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "stripe_customer_id" varchar(255);--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_created_by_admin_id_users_id_fk" FOREIGN KEY ("created_by_admin_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "orders_payment_link_token_idx" ON "orders" USING btree ("payment_link_token");