import { NextResponse } from "next/server";
import { configAM5 } from "@/db/dbconfig";
import { getPool } from "@/db/pools";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const pool = await getPool("am5", configAM5);

    const [overview, dashboard, powerhouse1, powerhouse2, powerhouse3] = await Promise.all([
      pool.request().query("SELECT * FROM overview"),
      pool.request().query("SELECT * FROM dashboard"),
      pool.request().query("SELECT engine6kw, engine7kw FROM powerhouse1"),
      pool.request().query("SELECT turbinekw FROM powerhouse2"),
      pool.request().query("SELECT MAN_KW, MAK1_KW, MAK2_KW FROM powerhouse3"),
    ]);

    return NextResponse.json({
      data: {
        overview: overview.recordset,
        dashboard: dashboard.recordset,
        powerhouse1: powerhouse1.recordset,
        powerhouse2: powerhouse2.recordset,
        powerhouse3: powerhouse3.recordset,
      },
    });
  } catch (error) {
    console.error("FULL SQL ERROR:", error);
    return NextResponse.json({ error: "Failed to load overview data" }, { status: 500 });
  }
}
