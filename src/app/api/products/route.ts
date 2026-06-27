import { NextResponse } from "next/server";
import { getAllProducts } from "@/lib/productLoader";

export const dynamic = "force-dynamic";

export async function GET() {
  const products = await getAllProducts();
  return NextResponse.json({ products });
}
