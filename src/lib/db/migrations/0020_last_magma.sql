ALTER TABLE "products" ADD COLUMN "byob_eligible" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "byob_taste" varchar(50);--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "byob_color" varchar(50);--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "byob_flavor" varchar(50);--> statement-breakpoint
CREATE INDEX "products_byob_idx" ON "products" USING btree ("byob_eligible");