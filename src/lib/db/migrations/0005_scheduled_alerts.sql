CREATE TYPE "public"."alert_severity" AS ENUM('info', 'warning', 'critical');--> statement-breakpoint
CREATE TYPE "public"."alert_type" AS ENUM('date', 'inventory');--> statement-breakpoint
CREATE TABLE "scheduled_alerts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"type" "alert_type" NOT NULL,
	"severity" "alert_severity" DEFAULT 'info' NOT NULL,
	"title" varchar(255) NOT NULL,
	"message" text,
	"trigger_at" timestamp,
	"product_id" uuid,
	"threshold_quantity" integer,
	"is_acknowledged" boolean DEFAULT false NOT NULL,
	"acknowledged_at" timestamp,
	"acknowledged_by" uuid,
	"created_by" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "scheduled_alerts" ADD CONSTRAINT "scheduled_alerts_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scheduled_alerts" ADD CONSTRAINT "scheduled_alerts_acknowledged_by_users_id_fk" FOREIGN KEY ("acknowledged_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scheduled_alerts" ADD CONSTRAINT "scheduled_alerts_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "scheduled_alerts_trigger_idx" ON "scheduled_alerts" USING btree ("trigger_at");--> statement-breakpoint
CREATE INDEX "scheduled_alerts_product_idx" ON "scheduled_alerts" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "scheduled_alerts_ack_idx" ON "scheduled_alerts" USING btree ("is_acknowledged");