CREATE TABLE "product_nutrition" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_id" uuid NOT NULL,
	"serving_size" text,
	"servings_per_container" text,
	"calories" integer,
	"total_fat" numeric(8, 2),
	"saturated_fat" numeric(8, 2),
	"trans_fat" numeric(8, 2),
	"cholesterol" numeric(8, 2),
	"sodium" numeric(8, 2),
	"total_carbs" numeric(8, 2),
	"dietary_fiber" numeric(8, 2),
	"total_sugars" numeric(8, 2),
	"added_sugars" numeric(8, 2),
	"protein" numeric(8, 2),
	"ingredients" text NOT NULL,
	"major_allergens" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"cross_contact_note" text,
	"no_major_allergens_reviewed" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "product_nutrition_product_id_unique" UNIQUE("product_id")
);
--> statement-breakpoint
ALTER TABLE "product_nutrition" ADD CONSTRAINT "product_nutrition_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "product_nutrition_product_idx" ON "product_nutrition" USING btree ("product_id");