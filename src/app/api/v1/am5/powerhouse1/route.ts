import { NextResponse } from "next/server";
import { configAM5 } from "@/db/dbconfig";
import { getPool } from "@/db/pools";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const pool = await getPool("am5", configAM5);
    const result = await pool.request().query("SELECT * FROM powerhouse1");
    return NextResponse.json({ data: result.recordset });
  } catch (error) {
    console.error("FULL SQL ERROR:", error);
    return NextResponse.json({ error: "Failed to load data" }, { status: 500 });
  }
}
