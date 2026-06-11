import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { fetchHygienePage, rowToRecord, PAGE_SIZE } from "@/lib/hygiene-api";

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const apiKey = process.env.FOOD_SAFETY_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "FOOD_SAFETY_API_KEY not set" }, { status: 500 });
  }

  // 지난 7일간 변경된 데이터만 가져옴
  const since = new Date();
  since.setDate(since.getDate() - 7);
  const changedAfter = since.toISOString().slice(0, 10).replace(/-/g, "");

  try {
    let upserted = 0;
    let page = 0;
    let total = Infinity;

    while (page * PAGE_SIZE < total) {
      const start = page * PAGE_SIZE + 1;
      const end = start + PAGE_SIZE - 1;
      const { total: t, rows } = await fetchHygienePage(apiKey, start, end, changedAfter);

      if (page === 0) total = t;
      if (rows.length === 0) break;

      await Promise.all(
        rows.map((row) => {
          const record = rowToRecord(row);
          return prisma.hygieneGrade.upsert({
            where: { lcnsNo: record.lcnsNo },
            update: record,
            create: record,
          });
        })
      );

      upserted += rows.length;
      page++;
    }

    console.log(`[cron/hygiene] synced ${upserted}/${total} records`);
    return NextResponse.json({ ok: true, total, upserted });
  } catch (e) {
    console.error("[cron/hygiene]", e);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
