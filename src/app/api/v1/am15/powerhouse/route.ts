import { NextResponse } from "next/server";
import { config } from "@/db/dbconfig";
import sql from "mssql";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const pool = await sql.connect(config);
    const result = await pool.request().query("SELECT * FROM AM17_POWERHOUSE");
    return NextResponse.json({ data: result.recordset });
  } catch (error) {
    console.error("FULL SQL ERROR:", error);
    return NextResponse.json({ error: "Failed to load powerhouse data" }, { status: 500 });
  }
}
