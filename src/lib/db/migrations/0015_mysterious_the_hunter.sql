ALTER TABLE "orders" ADD COLUMN "utm_source" varchar(255);--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "utm_medium" varchar(255);--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "utm_campaign" varchar(255);--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "utm_content" varchar(255);--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "utm_term" varchar(255);--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "gclid" varchar(255);--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "fbclid" varchar(255);--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "landing_referrer" varchar(1000);--> statement-breakpoint
ALTER TABLE "page_views" ADD COLUMN "utm_source" varchar(255);--> statement-breakpoint
ALTER TABLE "page_views" ADD COLUMN "utm_medium" varchar(255);--> statement-breakpoint
ALTER TABLE "page_views" ADD COLUMN "utm_campaign" varchar(255);--> statement-breakpoint
ALTER TABLE "page_views" ADD COLUMN "utm_content" varchar(255);--> statement-breakpoint
ALTER TABLE "page_views" ADD COLUMN "utm_term" varchar(255);--> statement-breakpoint
ALTER TABLE "page_views" ADD COLUMN "gclid" varchar(255);--> statement-breakpoint
ALTER TABLE "page_views" ADD COLUMN "fbclid" varchar(255);--> statement-breakpoint
CREATE INDEX "page_views_utm_source_idx" ON "page_views" USING btree ("utm_source");--> statement-breakpoint
CREATE INDEX "page_views_utm_campaign_idx" ON "page_views" USING btree ("utm_campaign");