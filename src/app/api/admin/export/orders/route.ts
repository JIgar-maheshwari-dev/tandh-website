import { NextRequest, NextResponse } from "next/server";
import { getOrdersCsv } from "@/lib/csvExport";

/** See the sibling users export route for the full explanation. */
export async function GET(req: NextRequest) {
  const key = req.nextUrl.searchParams.get("key");
  const expected = process.env.ADMIN_EXPORT_KEY;

  if (!expected) {
    return NextResponse.json(
      { error: "Set ADMIN_EXPORT_KEY in .env.local to enable this export endpoint." },
      { status: 500 }
    );
  }
  if (key !== expected) {
    return NextResponse.json({ error: "Invalid or missing key." }, { status: 401 });
  }

  const csv = await getOrdersCsv();

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": "attachment; filename=orders.csv",
    },
  });
}
