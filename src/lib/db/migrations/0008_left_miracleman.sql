CREATE TABLE "shipping_boxes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"length_in" numeric(5, 2) NOT NULL,
	"width_in" numeric(5, 2) NOT NULL,
	"height_in" numeric(5, 2) NOT NULL,
	"max_weight_oz" integer NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "shipping_carrier" text;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "shipping_service" text;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "shipping_rate_cents" integer;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "shipping_estimated_days" integer;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "shippo_rate_id" text;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "shippo_transaction_id" text;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "shippo_label_url" text;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "shippo_tracking_number" text;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "shippo_tracking_url" text;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "weight_oz" integer DEFAULT 4 NOT NULL;