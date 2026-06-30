ALTER TABLE "product_nutrition" ADD COLUMN "label_statement_of_identity" text;--> statement-breakpoint
ALTER TABLE "product_nutrition" ADD COLUMN "net_weight_oz" numeric(8, 2);--> statement-breakpoint
ALTER TABLE "product_nutrition" ADD COLUMN "distributed_by_override" text;--> statement-breakpoint
ALTER TABLE "product_nutrition" ADD COLUMN "show_nutrition_panel_on_label" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "product_nutrition" ADD COLUMN "show_qr_on_label" boolean DEFAULT true NOT NULL;