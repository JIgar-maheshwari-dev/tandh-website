// Server-only. Never trust price or MOQ values coming from the client —
// recompute everything from the actual metadata.json (plus live stock)
// on disk/database before an order is ever created. This is the one
// place that protects against a tampered cart (e.g. someone editing
// localStorage / the request body to lower a price, duck under MOQ, or
// order more than is actually in stock).
import { getProductById } from "./productLoader";
import type { CartItem } from "@/types";

export interface ValidatedLine {
  item: CartItem;
  lineTotal: number;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  lines: ValidatedLine[];
  amount: number;
}

export async function validateCartItems(items: CartItem[]): Promise<ValidationResult> {
  const errors: string[] = [];
  const lines: ValidatedLine[] = [];

  if (!items || items.length === 0) {
    return { valid: false, errors: ["Cart is empty."], lines: [], amount: 0 };
  }

  for (const item of items) {
    const product = await getProductById(item.category, item.productId);
    if (!product) {
      errors.push(`Product "${item.title}" no longer exists.`);
      continue;
    }

    if (item.quantity < product.moq) {
      errors.push(
        `"${product.title}" requires a minimum order of ${product.moq} ${product.moqUnit ?? "units"}.`
      );
      continue;
    }

    const step = product.moqStep || 1;
    const stepsFromFloor = (item.quantity - product.moq) / step;
    if (Math.abs(stepsFromFloor - Math.round(stepsFromFloor)) > 1e-6) {
      errors.push(
        `"${product.title}" quantity must increase in steps of ${step} ${product.moqUnit ?? "units"} from its minimum.`
      );
      continue;
    }

    if (typeof product.stock === "number" && item.quantity > product.stock) {
      errors.push(
        product.stock > 0
          ? `"${product.title}" only has ${product.stock} left in stock.`
          : `"${product.title}" is currently out of stock.`
      );
      continue;
    }

    // Authoritative values — always from the real product record, never
    // trusted from the client. Only quantity and size are genuine
    // customer choices; everything else describing what was bought
    // (title, image, unit labels) should reflect the real product, not
    // whatever a tampered or simply stale client payload claims.
    const lineTotal = Math.round(product.price * item.quantity * 100) / 100;
    lines.push({
      item: {
        ...item,
        title: product.title,
        image: product.imagePaths[0] ?? item.image,
        price: product.price,
        currency: product.currency,
        moq: product.moq,
        moqStep: product.moqStep,
        moqUnit: product.moqUnit,
      },
      lineTotal,
    });
  }

  const amount = Math.round(lines.reduce((sum, l) => sum + l.lineTotal, 0) * 100) / 100;

  return { valid: errors.length === 0 && lines.length > 0, errors, lines, amount };
}
