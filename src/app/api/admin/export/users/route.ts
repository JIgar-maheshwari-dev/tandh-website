import { NextRequest, NextResponse } from "next/server";
import { getUsersCsv } from "@/lib/csvExport";

/**
 * Generates the CSV directly from the database on every request —
 * doesn't depend on data/users.csv existing on disk, so this works the
 * same whether the local filesystem is persistent or not.
 *
 * Protected by ADMIN_EXPORT_KEY since this file contains customer PII
 * (names and email addresses). Set ADMIN_EXPORT_KEY in .env.local, then
 * request this URL with ?key=<that value>.
 */
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

  const csv = await getUsersCsv();

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": "attachment; filename=users.csv",
    },
  });
}
