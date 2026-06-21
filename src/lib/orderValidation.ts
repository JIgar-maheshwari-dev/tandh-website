// Server-only. Never trust price or MOQ values coming from the client —
// recompute everything from the actual metadata.json on disk before an
// order is ever created. This is the one place that protects against a
// tampered cart (e.g. someone editing localStorage / the request body to
// lower a price or duck under MOQ).
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

export function validateCartItems(items: CartItem[]): ValidationResult {
  const errors: string[] = [];
  const lines: ValidatedLine[] = [];

  if (!items || items.length === 0) {
    return { valid: false, errors: ["Cart is empty."], lines: [], amount: 0 };
  }

  for (const item of items) {
    const product = getProductById(item.category, item.productId);
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
      errors.push(`"${product.title}" only has ${product.stock} in stock.`);
      continue;
    }

    // Authoritative price — always from disk, never from the client.
    const lineTotal = Math.round(product.price * item.quantity * 100) / 100;
    lines.push({
      item: { ...item, price: product.price, currency: product.currency },
      lineTotal,
    });
  }

  const amount = Math.round(lines.reduce((sum, l) => sum + l.lineTotal, 0) * 100) / 100;

  return { valid: errors.length === 0 && lines.length > 0, errors, lines, amount };
}
