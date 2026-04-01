import type { InferSelectModel, InferInsertModel } from "drizzle-orm";
import type {
  users,
  addresses,
  categories,
  products,
  productImages,
  inventory,
  inventoryLog,
  orders,
  orderItems,
  reviews,
  wishlists,
  coupons,
  customerInteractions,
  emailLog,
} from "@/lib/db/schema";

// ═══ SELECT TYPES ═══
export type User = InferSelectModel<typeof users>;
export type Address = InferSelectModel<typeof addresses>;
export type Category = InferSelectModel<typeof categories>;
export type Product = InferSelectModel<typeof products>;
export type ProductImage = InferSelectModel<typeof productImages>;
export type Inventory = InferSelectModel<typeof inventory>;
export type InventoryLog = InferSelectModel<typeof inventoryLog>;
export type Order = InferSelectModel<typeof orders>;
export type OrderItem = InferSelectModel<typeof orderItems>;
export type Review = InferSelectModel<typeof reviews>;
export type Wishlist = InferSelectModel<typeof wishlists>;
export type Coupon = InferSelectModel<typeof coupons>;
export type CustomerInteraction = InferSelectModel<typeof customerInteractions>;
export type EmailLog = InferSelectModel<typeof emailLog>;

// ═══ INSERT TYPES ═══
export type NewUser = InferInsertModel<typeof users>;
export type NewAddress = InferInsertModel<typeof addresses>;
export type NewCategory = InferInsertModel<typeof categories>;
export type NewProduct = InferInsertModel<typeof products>;
export type NewProductImage = InferInsertModel<typeof productImages>;
export type NewInventory = InferInsertModel<typeof inventory>;
export type NewOrder = InferInsertModel<typeof orders>;
export type NewOrderItem = InferInsertModel<typeof orderItems>;
export type NewReview = InferInsertModel<typeof reviews>;
export type NewCoupon = InferInsertModel<typeof coupons>;
export type NewCustomerInteraction = InferInsertModel<typeof customerInteractions>;

// ═══ EXTENDED TYPES ═══
export type ProductWithImages = Product & {
  images: ProductImage[];
  category: Category | null;
  inventory: Inventory | null;
};

export type ProductWithDetails = ProductWithImages & {
  reviews: Review[];
  averageRating: number;
  reviewCount: number;
};

export type OrderWithItems = Order & {
  items: (OrderItem & { product: Product | null })[];
  user: Pick<User, "id" | "name" | "email">;
  shippingAddress: Address | null;
};

export type CartItem = {
  productId: string;
  name: string;
  price: number;
  image: string;
  quantity: number;
  slug: string;
};

export type CartState = {
  items: CartItem[];
  couponCode: string | null;
  couponDiscount: number;
};
