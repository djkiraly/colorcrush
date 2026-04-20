ALTER TABLE "categories" ADD CONSTRAINT "categories_parent_id_categories_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."categories"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint

-- ═══════════════════════════════════════════════════════════════════════
-- Color Crush taxonomy data migration
-- Idempotent: safe to re-run. Existing rows are remapped, not destroyed.
-- ═══════════════════════════════════════════════════════════════════════

-- 1. Insert the 4 root categories
INSERT INTO "categories" ("name", "slug", "parent_id", "sort_order", "is_active")
VALUES
  ('Shop by Type',  'shop-by-type',  NULL, 1, true),
  ('Shop by Color', 'shop-by-color', NULL, 2, true),
  ('Shop by Event', 'shop-by-event', NULL, 3, true)
ON CONFLICT ("slug") DO NOTHING;--> statement-breakpoint

-- Ensure existing "gift-boxes" row is a root
UPDATE "categories"
SET "name" = 'Gift Boxes', "parent_id" = NULL, "sort_order" = 4, "is_active" = true
WHERE "slug" = 'gift-boxes';--> statement-breakpoint

-- 2. Remap existing 5 rows into the new hierarchy (preserves UUIDs so
--    existing product_categories links survive)
UPDATE "categories" SET
  "name" = 'Chocolate Bars',
  "slug" = 'chocolate-bars',
  "parent_id" = (SELECT "id" FROM "categories" WHERE "slug" = 'shop-by-type')
WHERE "slug" = 'chocolates';--> statement-breakpoint

UPDATE "categories" SET
  "name" = 'Gummies & Chewy Candies',
  "slug" = 'gummies-chewy',
  "parent_id" = (SELECT "id" FROM "categories" WHERE "slug" = 'shop-by-type')
WHERE "slug" = 'gummies-jellies';--> statement-breakpoint

UPDATE "categories" SET
  "name" = 'Hard Candies',
  "slug" = 'hard-candies',
  "parent_id" = (SELECT "id" FROM "categories" WHERE "slug" = 'shop-by-type')
WHERE "slug" = 'hard-candy-lollipops';--> statement-breakpoint

UPDATE "categories" SET
  "name" = 'Seasonal',
  "slug" = 'seasonal',
  "parent_id" = (SELECT "id" FROM "categories" WHERE "slug" = 'shop-by-event')
WHERE "slug" = 'seasonal-specials';--> statement-breakpoint

UPDATE "categories" SET
  "parent_id" = (SELECT "id" FROM "categories" WHERE "slug" = 'shop-by-type')
WHERE "slug" = 'sugar-free';--> statement-breakpoint

-- 3. Insert remaining Candy Type children
INSERT INTO "categories" ("name", "slug", "parent_id", "sort_order", "is_active")
SELECT v.name, v.slug, (SELECT "id" FROM "categories" WHERE "slug" = 'shop-by-type'), v.sort_order, true
FROM (VALUES
  ('Chocolate-Covered Sweets', 'chocolate-covered',  10),
  ('Chocolate Boxes',          'chocolate-boxes',    11),
  ('Fudge',                    'fudge',              12),
  ('Licorice',                 'licorice',           13),
  ('Lollipops & Suckers',      'lollipops-suckers',  14),
  ('Marshmallows',             'marshmallows',       15),
  ('Caramels & Toffees',       'caramels-toffees',   16),
  ('Taffy',                    'taffy',              17),
  ('Mints',                    'mints',              18),
  ('Novelty Candy',            'novelty',            19),
  ('Freeze-Dried Candy',       'freeze-dried',       20),
  ('Nostalgic Candy',          'nostalgic',          21)
) AS v(name, slug, sort_order)
ON CONFLICT ("slug") DO NOTHING;--> statement-breakpoint

-- 4. Insert Color children
INSERT INTO "categories" ("name", "slug", "parent_id", "sort_order", "is_active")
SELECT v.name, v.slug, (SELECT "id" FROM "categories" WHERE "slug" = 'shop-by-color'), v.sort_order, true
FROM (VALUES
  ('Red Candy',       'red-candy',       1),
  ('Pink Candy',      'pink-candy',      2),
  ('Orange Candy',    'orange-candy',    3),
  ('Yellow Candy',    'yellow-candy',    4),
  ('Green Candy',     'green-candy',     5),
  ('Blue Candy',      'blue-candy',      6),
  ('Purple Candy',    'purple-candy',    7),
  ('White Candy',     'white-candy',     8),
  ('Black Candy',     'black-candy',     9),
  ('Pastel Candy',    'pastel-candy',    10),
  ('Rainbow Candy',   'rainbow-candy',   11),
  ('Metallic Candy',  'metallic-candy',  12),
  ('Two-Tone Candy',  'two-tone-candy',  13),
  ('Mixed-Color Candy','mixed-color-candy', 14)
) AS v(name, slug, sort_order)
ON CONFLICT ("slug") DO NOTHING;--> statement-breakpoint

-- 5. Insert Event children
INSERT INTO "categories" ("name", "slug", "parent_id", "sort_order", "is_active")
SELECT v.name, v.slug, (SELECT "id" FROM "categories" WHERE "slug" = 'shop-by-event'), v.sort_order, true
FROM (VALUES
  ('Wedding',          'wedding',         1),
  ('Bridal Shower',    'bridal-shower',   2),
  ('Baby Shower',      'baby-shower',     3),
  ('Graduation',       'graduation',      4),
  ('Birthday',         'birthday',        5),
  ('Team / Sports',    'team-sports',     6),
  ('School Event',     'school',          7),
  ('Corporate Event',  'corporate',       8),
  ('Fundraiser',       'fundraiser',      9),
  ('Party Favors',     'party-favors',    10),
  ('Candy Buffet',     'candy-buffet',    11),
  ('Valentine''s Day', 'valentines',      20),
  ('Easter',           'easter',          21),
  ('Halloween',        'halloween',       22),
  ('Christmas',        'christmas',       23),
  ('Back to School',   'back-to-school',  24),
  ('Game Day',         'game-day',        25),
  ('Prom',             'prom',            26)
) AS v(name, slug, sort_order)
ON CONFLICT ("slug") DO NOTHING;--> statement-breakpoint

-- 6. Insert Gift Boxes children
INSERT INTO "categories" ("name", "slug", "parent_id", "sort_order", "is_active")
SELECT v.name, v.slug, (SELECT "id" FROM "categories" WHERE "slug" = 'gift-boxes'), v.sort_order, true
FROM (VALUES
  ('Sampler Boxes',         'sampler',            1),
  ('Variety Packs',         'variety-packs',      2),
  ('Build-Your-Own Box',    'build-your-own',     3),
  ('Curated Candy Crates',  'curated-crates',     4),
  ('Party Favor Boxes',     'party-favor-boxes',  5),
  ('Thank-You Boxes',       'thank-you',          6),
  ('Teacher Gift Boxes',    'teacher-gift',       7),
  ('Hostess Gifts',         'hostess',            8),
  ('Corporate Gifts',       'corporate-gifts',    9),
  ('Favor Bags',            'favor-bags',         10),
  ('Mini Gift Tins',        'mini-tins',          11),
  ('Custom Label Boxes',    'custom-label',       12),
  ('Color-Themed Gift Sets','color-themed',       13),
  ('Event Centerpiece Boxes','event-centerpiece', 14)
) AS v(name, slug, sort_order)
ON CONFLICT ("slug") DO NOTHING;
