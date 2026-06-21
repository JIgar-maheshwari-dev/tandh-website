import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { exportUsersToCsv } from "@/lib/csvExport";

/**
 * data/users.csv is already kept up to date automatically on every
 * signup (see csvExport.ts) — you can just open that file directly in
 * Excel/Sheets without touching this route at all. This endpoint exists
 * for convenience if you'd rather download it over the network (e.g.
 * from your phone while the dev server runs on your laptop) instead of
 * opening the file on disk.
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

  exportUsersToCsv();
  const filePath = path.join(process.cwd(), "data", "users.csv");
  const csv = fs.readFileSync(filePath, "utf-8");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": "attachment; filename=users.csv",
    },
  });
}
