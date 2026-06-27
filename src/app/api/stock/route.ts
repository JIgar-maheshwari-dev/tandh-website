import { NextRequest, NextResponse } from "next/server";
import { getLiveStockMap } from "@/lib/stockStore";

export const dynamic = "force-dynamic";

/**
 * GET /api/stock?items=category:productId,category:productId,...
 *
 * Returns live stock for a list of products in one round trip — used
 * by the cart drawer to enforce a real stock ceiling (not just MOQ) on
 * quantities already sitting in someone's bag, since stock can change
 * while an item sits there. No auth needed — this is the same stock
 * count already shown publicly on each product's own page.
 */
export async function GET(req: NextRequest) {
  const itemsParam = req.nextUrl.searchParams.get("items");
  if (!itemsParam) {
    return NextResponse.json({ error: "Missing items parameter." }, { status: 400 });
  }

  const items = itemsParam
    .split(",")
    .map((pair) => pair.trim())
    .filter(Boolean)
    .map((pair) => {
      const [category, productId] = pair.split(":");
      return { category, productId };
    })
    .filter((i) => i.category && i.productId);

  if (items.length === 0) {
    return NextResponse.json({ error: "No valid items provided." }, { status: 400 });
  }

  const stockMap = await getLiveStockMap(items);
  const result: Record<string, number> = {};
  stockMap.forEach((value, key) => {
    result[key] = value;
  });

  return NextResponse.json({ stock: result });
}
