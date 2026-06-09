CREATE TYPE "public"."ggsa_flavor" AS ENUM('sour', 'sweet', 'mixed');--> statement-breakpoint
CREATE TYPE "public"."ggsa_order_status" AS ENUM('pending', 'paid', 'fulfilled');--> statement-breakpoint
CREATE TABLE "ggsa_orders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"source" varchar(50) DEFAULT 'ggsa' NOT NULL,
	"flavor" "ggsa_flavor" NOT NULL,
	"quantity" integer NOT NULL,
	"unit_price_cents" integer DEFAULT 300 NOT NULL,
	"total_cents" integer NOT NULL,
	"contact_name" varchar(255) NOT NULL,
	"email" varchar(255) NOT NULL,
	"phone" varchar(50) NOT NULL,
	"status" "ggsa_order_status" DEFAULT 'pending' NOT NULL,
	"stripe_session_id" varchar(255),
	"stripe_payment_intent_id" varchar(255),
	"pickup_date" timestamp,
	"paid_at" timestamp,
	"fulfilled_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "ggsa_orders_stripe_session_idx" ON "ggsa_orders" USING btree ("stripe_session_id");--> statement-breakpoint
CREATE INDEX "ggsa_orders_status_idx" ON "ggsa_orders" USING btree ("status");--> statement-breakpoint
CREATE INDEX "ggsa_orders_created_idx" ON "ggsa_orders" USING btree ("created_at");