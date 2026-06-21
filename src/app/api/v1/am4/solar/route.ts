import { NextResponse } from "next/server";
import { config } from "@/db/dbconfig";
import sql from "mssql";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const pool = await sql.connect(config);
    const result = await pool
      .request()
      .query(
        "SELECT SOLAR_A_KW, SOLAR_A_ERROR, SOLAR_B_KW, SOLAR_B_ERROR, SOLAR_C_KW, SOLAR_C_ERROR FROM AM04Powerhouse"
      );
    return NextResponse.json({ data: result.recordset });
  } catch (error) {
    console.error("FULL SQL ERROR:", error);
    return NextResponse.json({ error: "Failed to load solar data" }, { status: 500 });
  }
}
