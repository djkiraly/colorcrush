import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "../src/lib/db/schema";
import bcrypt from "bcryptjs";
import "dotenv/config";

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql, { schema });

async function seed() {
  console.log("🍬 Seeding database...");

  // ═══ USERS ═══
  const passwordHash = await bcrypt.hash("password123", 12);

  const [superAdmin] = await db
    .insert(schema.users)
    .values({
      email: "admin@sweethaven.com",
      name: "Super Admin",
      passwordHash,
      role: "super_admin",
      emailVerified: new Date(),
    })
    .returning();

  const [admin] = await db
    .insert(schema.users)
    .values({
      email: "manager@sweethaven.com",
      name: "Store Manager",
      passwordHash,
      role: "admin",
      emailVerified: new Date(),
    })
    .returning();

  const [customer] = await db
    .insert(schema.users)
    .values({
      email: "customer@example.com",
      name: "Jane Smith",
      passwordHash,
      role: "customer",
      phone: "(555) 987-6543",
      emailVerified: new Date(),
    })
    .returning();

  console.log("✅ Users created");

  // ═══ ADDRESSES ═══
  const [customerAddress] = await db
    .insert(schema.addresses)
    .values({
      userId: customer.id,
      label: "Home",
      line1: "456 Sugar Street",
      city: "Charleston",
      state: "SC",
      zip: "29401",
      isDefault: true,
    })
    .returning();

  await db.insert(schema.addresses).values({
    userId: customer.id,
    label: "Work",
    line1: "789 Business Ave",
    line2: "Suite 200",
    city: "Charleston",
    state: "SC",
    zip: "29403",
  });

  console.log("✅ Addresses created");

  // ═══ CATEGORIES ═══
  const categoryData = [
    { name: "Chocolates", slug: "chocolates", description: "Premium handcrafted chocolates in every variety.", sortOrder: 1 },
    { name: "Gummies & Jellies", slug: "gummies-jellies", description: "Soft, chewy, and bursting with flavor.", sortOrder: 2 },
    { name: "Hard Candy & Lollipops", slug: "hard-candy-lollipops", description: "Classic treats that last and last.", sortOrder: 3 },
    { name: "Gift Boxes", slug: "gift-boxes", description: "Beautifully curated gift sets for every occasion.", sortOrder: 4 },
    { name: "Seasonal Specials", slug: "seasonal-specials", description: "Limited edition treats for the season.", sortOrder: 5 },
    { name: "Sugar-Free", slug: "sugar-free", description: "All the sweetness, none of the sugar.", sortOrder: 6 },
  ];

  const categories = await db.insert(schema.categories).values(
    categoryData.map((c) => ({ ...c, imageUrl: `https://placehold.co/600x400/F9A8D4/581C87?text=${encodeURIComponent(c.name)}`, isActive: true }))
  ).returning();

  console.log("✅ Categories created");

  // ═══ PRODUCTS ═══
  const productData = [
    // Chocolates
    { name: "Dark Chocolate Truffles", slug: "dark-chocolate-truffles", shortDescription: "Rich, velvety dark chocolate truffles", description: "Handcrafted dark chocolate truffles made with 72% cacao and a smooth ganache center. Each truffle is dusted with premium cocoa powder.", price: "14.99", compareAtPrice: "18.99", costPrice: "5.50", sku: "CHOC-001", weight: "8", categoryIdx: 0, tags: ["bestseller"], allergens: ["milk", "soy"], ingredients: "Dark chocolate (72% cacao), heavy cream, butter, cocoa powder, vanilla extract", isFeatured: true },
    { name: "Milk Chocolate Sea Salt Caramels", slug: "milk-chocolate-sea-salt-caramels", shortDescription: "Buttery caramel in milk chocolate with sea salt", description: "Luxurious milk chocolate shells filled with buttery caramel and topped with Fleur de Sel. A perfect balance of sweet and salty.", price: "16.99", costPrice: "6.00", sku: "CHOC-002", weight: "10", categoryIdx: 0, tags: ["bestseller"], allergens: ["milk", "soy"], ingredients: "Milk chocolate, sugar, butter, cream, sea salt, vanilla", isFeatured: true },
    { name: "White Chocolate Raspberry Bark", slug: "white-chocolate-raspberry-bark", shortDescription: "Creamy white chocolate with freeze-dried raspberries", description: "Artisan white chocolate bark studded with tangy freeze-dried raspberries and a drizzle of dark chocolate.", price: "12.99", costPrice: "4.50", sku: "CHOC-003", weight: "6", categoryIdx: 0, tags: ["new"], allergens: ["milk", "soy"], ingredients: "White chocolate, freeze-dried raspberries, dark chocolate drizzle", isFeatured: false },
    { name: "Assorted Bonbons Collection", slug: "assorted-bonbons-collection", shortDescription: "12 handpainted artisan bonbons", description: "A stunning collection of 12 handpainted bonbons featuring flavors like passionfruit, espresso, lavender honey, and champagne.", price: "29.99", costPrice: "12.00", sku: "CHOC-004", weight: "12", categoryIdx: 0, tags: ["bestseller", "gift"], allergens: ["milk", "soy", "tree nuts"], ingredients: "Chocolate, cream, various natural flavors, cocoa butter", isFeatured: true },
    { name: "Hazelnut Praline Squares", slug: "hazelnut-praline-squares", shortDescription: "Crunchy hazelnut praline in dark chocolate", description: "Layers of crunchy hazelnut praline sandwiched between thin sheets of premium dark chocolate.", price: "18.99", costPrice: "7.00", sku: "CHOC-005", weight: "8", categoryIdx: 0, tags: [], allergens: ["milk", "soy", "tree nuts"], ingredients: "Dark chocolate, hazelnuts, sugar, cocoa butter", isFeatured: false },
    // Gummies & Jellies
    { name: "Rainbow Gummy Bears", slug: "rainbow-gummy-bears", shortDescription: "Classic gummy bears in 6 fruity flavors", description: "Soft and chewy gummy bears in strawberry, orange, lemon, lime, grape, and blue raspberry. Made with real fruit juice.", price: "7.99", costPrice: "2.50", sku: "GUM-001", weight: "12", categoryIdx: 1, tags: ["vegan", "bestseller"], allergens: [], ingredients: "Sugar, glucose syrup, fruit juice, pectin, citric acid, natural colors", isFeatured: true },
    { name: "Sour Watermelon Slices", slug: "sour-watermelon-slices", shortDescription: "Tangy sour watermelon-shaped gummies", description: "Mouth-puckering sour gummies shaped like watermelon slices. Coated in a sour sugar blend for an extra kick.", price: "6.99", costPrice: "2.00", sku: "GUM-002", weight: "10", categoryIdx: 1, tags: ["vegan"], allergens: [], ingredients: "Sugar, glucose syrup, citric acid, malic acid, natural watermelon flavor, natural colors", isFeatured: false },
    { name: "Champagne Gummy Bears", slug: "champagne-gummy-bears", shortDescription: "Sophisticated champagne-infused gummy bears", description: "Elegant gummy bears infused with real Dom Pérignon champagne. Perfect for celebrations and gifting.", price: "12.99", costPrice: "5.00", sku: "GUM-003", weight: "8", categoryIdx: 1, tags: ["bestseller", "gift"], allergens: [], ingredients: "Sugar, glucose syrup, champagne (5%), gelatin, citric acid, natural flavors", isFeatured: true },
    { name: "Tropical Fruit Jellies", slug: "tropical-fruit-jellies", shortDescription: "Exotic tropical fruit jelly candies", description: "Soft fruit jellies in mango, pineapple, passion fruit, coconut, and guava. Each piece is bursting with tropical flavor.", price: "8.99", costPrice: "3.00", sku: "GUM-004", weight: "10", categoryIdx: 1, tags: ["vegan", "gluten-free"], allergens: [], ingredients: "Sugar, fruit puree, pectin, citric acid, natural flavors and colors", isFeatured: false },
    { name: "Peach Ring Gummies", slug: "peach-ring-gummies", shortDescription: "Sweet and fuzzy peach ring candies", description: "Classic peach ring gummies with a sugary coating and soft, chewy center. A nostalgic treat for all ages.", price: "5.99", costPrice: "1.80", sku: "GUM-005", weight: "10", categoryIdx: 1, tags: [], allergens: [], ingredients: "Sugar, corn syrup, gelatin, citric acid, natural peach flavor", isFeatured: false },
    // Hard Candy & Lollipops
    { name: "Artisan Lollipop Bouquet", slug: "artisan-lollipop-bouquet", shortDescription: "6 handcrafted artisan lollipops", description: "A beautiful bouquet of 6 large handcrafted lollipops in flavors like rose, lavender, honey, vanilla, cinnamon, and blood orange.", price: "19.99", costPrice: "7.00", sku: "HARD-001", weight: "14", categoryIdx: 2, tags: ["gift"], allergens: [], ingredients: "Sugar, corn syrup, natural essential oils, natural colors", isFeatured: true },
    { name: "Honey Lemon Drops", slug: "honey-lemon-drops", shortDescription: "Soothing honey and lemon hard candies", description: "Smooth hard candies made with real honey and lemon juice. Perfect for soothing a sore throat or just enjoying a sweet treat.", price: "6.99", costPrice: "2.00", sku: "HARD-002", weight: "8", categoryIdx: 2, tags: ["gluten-free"], allergens: [], ingredients: "Sugar, honey, lemon juice, natural lemon oil", isFeatured: false },
    { name: "Rock Candy Sticks", slug: "rock-candy-sticks", shortDescription: "Sparkling rock candy on wooden sticks", description: "Beautiful crystallized rock candy sticks in assorted colors and flavors. Great for party favors and candy buffets.", price: "3.99", costPrice: "1.00", sku: "HARD-003", weight: "4", categoryIdx: 2, tags: [], allergens: [], ingredients: "Sugar, water, natural flavors, natural colors", isFeatured: false },
    { name: "Butterscotch Drops", slug: "butterscotch-drops", shortDescription: "Classic old-fashioned butterscotch", description: "Rich, buttery butterscotch drops made the old-fashioned way with real butter and brown sugar.", price: "7.99", costPrice: "2.50", sku: "HARD-004", weight: "10", categoryIdx: 2, tags: ["bestseller"], allergens: ["milk"], ingredients: "Brown sugar, butter, corn syrup, vanilla extract", isFeatured: false },
    { name: "Peppermint Twists", slug: "peppermint-twists", shortDescription: "Refreshing peppermint twist candies", description: "Classic red and white peppermint twist hard candies. Cool and refreshing with a perfect mint flavor.", price: "4.99", costPrice: "1.50", sku: "HARD-005", weight: "8", categoryIdx: 2, tags: ["gluten-free", "vegan"], allergens: [], ingredients: "Sugar, corn syrup, peppermint oil, natural colors", isFeatured: false },
    // Gift Boxes
    { name: "Luxury Chocolate Gift Box", slug: "luxury-chocolate-gift-box", shortDescription: "24-piece luxury chocolate assortment", description: "An exquisite gift box featuring 24 handcrafted chocolates in milk, dark, and white varieties. Wrapped in our signature pink ribbon.", price: "49.99", compareAtPrice: "59.99", costPrice: "20.00", sku: "GIFT-001", weight: "24", categoryIdx: 3, tags: ["bestseller", "gift"], allergens: ["milk", "soy", "tree nuts"], ingredients: "Premium chocolates, cream, butter, natural flavors", isFeatured: true },
    { name: "Sweet Sampler Box", slug: "sweet-sampler-box", shortDescription: "A curated mix of our favorite treats", description: "The perfect introduction to Sweet Haven! This sampler includes our best-selling chocolates, gummies, and hard candies.", price: "34.99", costPrice: "14.00", sku: "GIFT-002", weight: "20", categoryIdx: 3, tags: ["gift", "new"], allergens: ["milk", "soy"], ingredients: "Assorted chocolates, gummies, and hard candies", isFeatured: true },
    { name: "Thank You Gift Tower", slug: "thank-you-gift-tower", shortDescription: "3-tier stacked gift box tower", description: "Three beautifully stacked boxes filled with truffles, caramels, and cookies. Each tier is wrapped in pastel paper with a satin bow.", price: "42.99", costPrice: "16.00", sku: "GIFT-003", weight: "28", categoryIdx: 3, tags: ["gift"], allergens: ["milk", "soy", "wheat", "tree nuts"], ingredients: "Assorted chocolates, caramels, cookies", isFeatured: false },
    { name: "Corporate Gift Collection", slug: "corporate-gift-collection", shortDescription: "Elegant corporate gift set", description: "Impress clients and colleagues with this sophisticated collection of premium candies in a branded presentation box.", price: "39.99", costPrice: "15.00", sku: "GIFT-004", weight: "22", categoryIdx: 3, tags: ["gift"], allergens: ["milk", "soy", "tree nuts"], ingredients: "Premium assorted chocolates and confections", isFeatured: false },
    // Seasonal
    { name: "Spring Blossom Collection", slug: "spring-blossom-collection", shortDescription: "Floral-inspired seasonal sweets", description: "Celebrate spring with this collection of flower-shaped chocolates, rose-flavored Turkish delight, and lavender cream bonbons.", price: "24.99", costPrice: "10.00", sku: "SEAS-001", weight: "14", categoryIdx: 4, tags: ["new", "gift"], allergens: ["milk", "soy"], ingredients: "Chocolate, sugar, rose water, lavender extract, cream", isFeatured: true },
    { name: "Summer Berry Gummy Mix", slug: "summer-berry-gummy-mix", shortDescription: "Mixed berry gummies for summer", description: "A refreshing mix of strawberry, blueberry, blackberry, and raspberry gummy candies perfect for warm weather snacking.", price: "9.99", costPrice: "3.50", sku: "SEAS-002", weight: "12", categoryIdx: 4, tags: ["vegan"], allergens: [], ingredients: "Sugar, glucose syrup, pectin, berry juice, citric acid, natural colors", isFeatured: false },
    { name: "Holiday Peppermint Collection", slug: "holiday-peppermint-collection", shortDescription: "Festive peppermint treats", description: "A festive assortment of peppermint bark, candy canes, peppermint truffles, and peppermint patties in a holiday gift tin.", price: "22.99", costPrice: "9.00", sku: "SEAS-003", weight: "16", categoryIdx: 4, tags: ["gift"], allergens: ["milk", "soy"], ingredients: "Chocolate, sugar, peppermint oil, cream", isFeatured: false },
    // Sugar-Free
    { name: "Sugar-Free Dark Chocolate Bars", slug: "sugar-free-dark-chocolate-bars", shortDescription: "Premium sugar-free dark chocolate", description: "Indulgent dark chocolate bars sweetened with stevia. All the richness of premium chocolate without the sugar.", price: "11.99", costPrice: "5.00", sku: "SF-001", weight: "6", categoryIdx: 5, tags: ["sugar-free", "vegan"], allergens: ["soy"], ingredients: "Cacao mass, cocoa butter, stevia, vanilla", isFeatured: false },
    { name: "Sugar-Free Gummy Worms", slug: "sugar-free-gummy-worms", shortDescription: "Guilt-free chewy gummy worms", description: "Colorful gummy worms made without sugar. Sweetened naturally and available in 5 fruity flavors.", price: "8.99", costPrice: "3.50", sku: "SF-002", weight: "8", categoryIdx: 5, tags: ["sugar-free", "gluten-free"], allergens: [], ingredients: "Isomalt, gelatin, citric acid, natural flavors, natural colors", isFeatured: false },
    { name: "Sugar-Free Hard Candy Mix", slug: "sugar-free-hard-candy-mix", shortDescription: "Assorted sugar-free hard candies", description: "A mix of sugar-free hard candies in butterscotch, strawberry, lemon, and mint flavors.", price: "6.99", costPrice: "2.50", sku: "SF-003", weight: "8", categoryIdx: 5, tags: ["sugar-free", "gluten-free"], allergens: [], ingredients: "Isomalt, citric acid, natural flavors, natural colors", isFeatured: false },
    { name: "Sugar-Free Caramel Chews", slug: "sugar-free-caramel-chews", shortDescription: "Soft caramel chews without the sugar", description: "Soft and chewy caramel candies made without sugar. Individually wrapped for convenient snacking.", price: "7.99", costPrice: "3.00", sku: "SF-004", weight: "8", categoryIdx: 5, tags: ["sugar-free"], allergens: ["milk"], ingredients: "Isomalt, butter, cream, vanilla, salt", isFeatured: false },
    // Additional products
    { name: "Cotton Candy Clouds", slug: "cotton-candy-clouds", shortDescription: "Fluffy cotton candy in a jar", description: "Handspun cotton candy in a sealed jar to preserve freshness. Available in vanilla, strawberry, and blue raspberry.", price: "9.99", costPrice: "3.00", sku: "MISC-001", weight: "4", categoryIdx: 1, tags: ["new", "gluten-free"], allergens: [], ingredients: "Sugar, natural flavors, natural colors", isFeatured: false },
    { name: "Chocolate Covered Pretzel Rods", slug: "chocolate-covered-pretzel-rods", shortDescription: "Salty pretzels dipped in chocolate", description: "Crunchy pretzel rods dipped in milk chocolate and decorated with sprinkles, nuts, or drizzled white chocolate.", price: "13.99", costPrice: "5.00", sku: "MISC-002", weight: "10", categoryIdx: 0, tags: ["bestseller"], allergens: ["milk", "soy", "wheat", "tree nuts"], ingredients: "Pretzels, milk chocolate, white chocolate, sprinkles, almonds", isFeatured: true },
    { name: "Maple Walnut Fudge", slug: "maple-walnut-fudge", shortDescription: "Creamy maple fudge with walnuts", description: "Rich, creamy fudge made with real maple syrup and studded with toasted walnut pieces. A true New England classic.", price: "15.99", costPrice: "6.00", sku: "MISC-003", weight: "12", categoryIdx: 0, tags: ["gluten-free"], allergens: ["milk", "tree nuts"], ingredients: "Sugar, butter, cream, maple syrup, walnuts, vanilla", isFeatured: false },
    { name: "Japanese Matcha Kit Kats", slug: "japanese-matcha-kit-kats", shortDescription: "Imported matcha-flavored Kit Kats", description: "Authentic Japanese matcha green tea Kit Kats imported directly from Japan. A unique and delicious treat.", price: "8.99", costPrice: "4.00", sku: "MISC-004", weight: "5", categoryIdx: 0, tags: ["new"], allergens: ["milk", "soy", "wheat"], ingredients: "Sugar, wheat flour, cocoa butter, matcha powder, milk powder", isFeatured: false },
    { name: "Giant Rainbow Swirl Lollipop", slug: "giant-rainbow-swirl-lollipop", shortDescription: "Colorful oversized swirl lollipop", description: "A massive 10-inch rainbow swirl lollipop that's as beautiful as it is delicious. Perfect for photo ops and party decorations.", price: "11.99", costPrice: "4.00", sku: "HARD-006", weight: "14", categoryIdx: 2, tags: ["gift", "new"], allergens: [], ingredients: "Sugar, corn syrup, citric acid, natural flavors, natural colors", isFeatured: true },
  ];

  const insertedProducts = [];
  for (const p of productData) {
    const category = categories[p.categoryIdx];
    const { categoryIdx, ...productValues } = p;
    const [product] = await db
      .insert(schema.products)
      .values({
        ...productValues,
        categoryId: category.id,
        isActive: true,
        isGiftEligible: true,
      })
      .returning();
    insertedProducts.push(product);
  }

  console.log(`✅ ${insertedProducts.length} products created`);

  // ═══ PRODUCT IMAGES ═══
  for (const product of insertedProducts) {
    const imageNum = Math.floor(Math.random() * 200) + 1;
    await db.insert(schema.productImages).values({
      productId: product.id,
      url: `https://picsum.photos/seed/${product.slug}/600/600`,
      altText: product.name,
      sortOrder: 0,
      isPrimary: true,
    });
  }

  console.log("✅ Product images created");

  // ═══ INVENTORY ═══
  for (const product of insertedProducts) {
    const qty = Math.floor(Math.random() * 200);
    await db.insert(schema.inventory).values({
      productId: product.id,
      quantity: qty,
      lowStockThreshold: 10,
      reorderPoint: 20,
      reorderQuantity: 100,
      lastRestockedAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
    });
  }

  console.log("✅ Inventory created");

  // ═══ ORDERS ═══
  const statuses: ("pending" | "confirmed" | "processing" | "shipped" | "delivered" | "cancelled")[] = [
    "pending", "confirmed", "processing", "shipped", "shipped",
    "delivered", "delivered", "delivered", "cancelled", "delivered",
  ];

  for (let i = 0; i < 10; i++) {
    const status = statuses[i];
    const date = new Date(Date.now() - (10 - i) * 24 * 60 * 60 * 1000);
    const orderItems = [];
    const numItems = Math.floor(Math.random() * 3) + 1;

    for (let j = 0; j < numItems; j++) {
      const product = insertedProducts[Math.floor(Math.random() * insertedProducts.length)];
      const qty = Math.floor(Math.random() * 3) + 1;
      orderItems.push({
        productId: product.id,
        productName: product.name,
        productImage: `https://picsum.photos/seed/${product.slug}/600/600`,
        quantity: qty,
        unitPrice: product.price,
        totalPrice: (parseFloat(product.price) * qty).toFixed(2),
      });
    }

    const subtotal = orderItems.reduce((sum, item) => sum + parseFloat(item.totalPrice), 0);
    const shippingCost = subtotal >= 50 ? 0 : 5.99;
    const taxAmount = subtotal * 0.08;
    const total = subtotal + shippingCost + taxAmount;

    const orderNumber = `SH-${date.toISOString().slice(0, 10).replace(/-/g, "")}-${String(i + 1).padStart(4, "0")}`;

    const [order] = await db
      .insert(schema.orders)
      .values({
        orderNumber,
        userId: customer.id,
        status,
        subtotal: subtotal.toFixed(2),
        shippingCost: shippingCost.toFixed(2),
        taxAmount: taxAmount.toFixed(2),
        total: total.toFixed(2),
        shippingMethod: "standard",
        shippingAddressId: customerAddress.id,
        billingAddressId: customerAddress.id,
        createdAt: date,
        updatedAt: date,
        shippedAt: ["shipped", "delivered"].includes(status) ? new Date(date.getTime() + 86400000) : null,
        deliveredAt: status === "delivered" ? new Date(date.getTime() + 3 * 86400000) : null,
        cancelledAt: status === "cancelled" ? date : null,
        cancelReason: status === "cancelled" ? "Customer requested cancellation" : null,
      })
      .returning();

    for (const item of orderItems) {
      await db.insert(schema.orderItems).values({
        orderId: order.id,
        ...item,
      });
    }
  }

  console.log("✅ 10 orders created");

  // ═══ REVIEWS ═══
  const reviewData = [
    { productIdx: 0, rating: 5, title: "Absolutely divine!", body: "These truffles are incredible. Rich, smooth, and perfectly balanced. Will definitely order again!", isApproved: true, isVerifiedPurchase: true },
    { productIdx: 1, rating: 4, title: "Great caramels", body: "The sea salt really makes these special. Packaging was beautiful too.", isApproved: true, isVerifiedPurchase: true },
    { productIdx: 5, rating: 5, title: "Best gummy bears ever", body: "So much better than store-bought. The flavors are natural and delicious.", isApproved: true, isVerifiedPurchase: true },
    { productIdx: 15, rating: 5, title: "Perfect gift", body: "Ordered this for my mom's birthday and she loved it! Beautiful presentation.", isApproved: false, isVerifiedPurchase: true },
    { productIdx: 7, rating: 3, title: "Good but pricey", body: "The champagne flavor is subtle but nice. A bit expensive for the portion size though.", isApproved: false, isVerifiedPurchase: false },
  ];

  for (const r of reviewData) {
    await db.insert(schema.reviews).values({
      productId: insertedProducts[r.productIdx].id,
      userId: customer.id,
      rating: r.rating,
      title: r.title,
      body: r.body,
      isApproved: r.isApproved,
      isVerifiedPurchase: r.isVerifiedPurchase,
    });
  }

  console.log("✅ 5 reviews created");

  // ═══ COUPONS ═══
  await db.insert(schema.coupons).values([
    {
      code: "SWEET10",
      type: "percentage",
      value: "10",
      minOrderAmount: "25",
      maxUses: 1000,
      isActive: true,
      expiresAt: new Date("2026-12-31"),
    },
    {
      code: "FREESHIP",
      type: "free_shipping",
      value: "0",
      isActive: true,
      expiresAt: new Date("2026-12-31"),
    },
    {
      code: "WELCOME5",
      type: "fixed",
      value: "5",
      minOrderAmount: "20",
      maxUses: 5000,
      isActive: true,
      expiresAt: new Date("2026-12-31"),
    },
  ]);

  console.log("✅ 3 coupons created");

  // ═══ CUSTOMER INTERACTIONS ═══
  const interactionData = [
    { type: "feedback" as const, subject: "Love your chocolates!", body: "Just wanted to say how much I love your dark chocolate truffles. Best I've ever had!", status: "closed" as const, priority: "low" as const },
    { type: "complaint" as const, subject: "Late delivery", body: "My order was supposed to arrive last Tuesday but it still hasn't come.", status: "in_progress" as const, priority: "high" as const },
    { type: "return_request" as const, subject: "Wrong item received", body: "I ordered the milk chocolate caramels but received dark chocolate truffles instead.", status: "open" as const, priority: "high" as const },
    { type: "note" as const, subject: "VIP customer", body: "Customer has placed 5+ orders in the past month. Consider loyalty program enrollment.", status: "resolved" as const, priority: "medium" as const },
    { type: "phone_call" as const, subject: "Corporate order inquiry", body: "Customer called about placing a large corporate order for 200+ gift boxes for holiday gifts.", status: "open" as const, priority: "urgent" as const },
  ];

  for (const interaction of interactionData) {
    await db.insert(schema.customerInteractions).values({
      userId: customer.id,
      adminId: admin.id,
      ...interaction,
    });
  }

  console.log("✅ 5 customer interactions created");
  console.log("\n🎉 Seed completed successfully!");
  console.log("\nTest accounts:");
  console.log("  Super Admin: admin@sweethaven.com / password123");
  console.log("  Admin:       manager@sweethaven.com / password123");
  console.log("  Customer:    customer@example.com / password123");
}

seed().catch(console.error);
