// Shape of each product's metadata.json file.
// This is the ONLY file you edit to add/change a product's data.
// Deliberately NO "stock" field here — stock is never static catalog
// content, it's live state that only the database is allowed to own.
// See src/lib/stockStore.ts.
export interface ProductMetadata {
  id: string;
  title: string;
  subtitle?: string;
  price: number;
  priceUnit?: string;
  currency: string;
  category: string;
  description: string;
  craftStory?: string;
  weaveType?: string;
  dyeProcess?: string;
  careInstructions?: string;
  details?: string[];
  tags?: string[];
  moq: number;
  moqUnit?: string;
  moqStep: number;
  images: string[];
  featured?: boolean;
  newArrival?: boolean;
  sizes?: string[];
  badges?: string[]; // e.g. "100% Organic", "Rain-fed Crop", "Artisan Made", "Zero Chemical Dyes"
}

// Product as loaded from disk, with resolved public image paths AND
// live stock overlaid from the database. `stock` is always a definite
// number here — never undefined, never read from metadata.json. A
// product the database has never seen before defaults to 0 (out of
// stock) rather than silently being treated as unlimited.
export interface Product extends ProductMetadata {
  imagePaths: string[];
  stock: number;
}

export interface CartItem {
  productId: string;
  category: string;
  title: string;
  image: string;
  price: number;
  priceUnit?: string;
  currency: string;
  quantity: number;
  moq: number;
  moqStep: number;
  moqUnit?: string;
  size?: string;
}

export type PaymentMethod = "upi" | "razorpay";

export interface CustomerDetails {
  name: string;
  email: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  pincode: string;
}

export type OrderStatus =
  | "pending_payment"
  | "pending_verification" // UPI-only flow: customer says paid, awaiting manual UTR check
  | "paid"
  | "failed";

export interface OrderRecord {
  orderId: string;
  userId: string;
  userEmail: string;
  createdAt: string;
  items: CartItem[];
  customer: CustomerDetails;
  paymentMethod: PaymentMethod;
  amount: number;
  currency: string;
  status: OrderStatus;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  upiUtr?: string; // customer-entered UPI transaction reference, for manual verification
}
