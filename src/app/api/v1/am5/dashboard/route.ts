import { NextResponse } from "next/server";
import { configAM5 } from "@/db/dbconfig";
import { getPool } from "@/db/pools";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const pool = await getPool("am5", configAM5);

    const [result1, result3, result4, result5, result6] = await Promise.all([
      pool.request().query("SELECT * FROM dashboard"),
      pool.request().query("SELECT takeoff1kw, takeoff2kw, takeoff3kw FROM powerhouse1"),
      pool
        .request()
        .query(
          "SELECT Takeoff4kw, Takeoff5kw, Takeoff6kw, Takeoff7kw, Takeoff8kw, AUX_LV_Takeoff FROM powerhouse2"
        ),
      pool.request().query("SELECT Takeoff1kw, Takeoff2kw, Takeoff3kw, Takeoff4kw FROM powerhouse3"),
      pool.request().query("SELECT AUXILIARY_kw, TOWARDS_PH1_kw, AM17_B_kw FROM AM17_PH2"),
    ]);

    const combinedResults = {
      dashboard: result1.recordset,
      ph1_takeoffs: result3.recordset,
      ph2_takeoffs: result4.recordset,
      ph3_takeoffs: result5.recordset,
      am17_takeoffs: result6.recordset,
    };

    return NextResponse.json({ data: combinedResults });
  } catch (error) {
    console.error("FULL SQL ERROR:", error);
    return NextResponse.json({ error: "Failed to load dashboard data" }, { status: 500 });
  }
}
