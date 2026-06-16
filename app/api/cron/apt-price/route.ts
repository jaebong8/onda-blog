import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { SIDO_LAWD_CODES, fetchAptDeals, AptDeal } from "@/lib/apt-trade-api";

const SIDO_LIST = [
  "서울특별시",
  "부산광역시",
  "대구광역시",
  "인천광역시",
  "광주광역시",
  "대전광역시",
  "울산광역시",
  "세종특별자치시",
  "경기도",
  "강원특별자치도",
  "충청북도",
  "충청남도",
  "전북특별자치도",
  "전라남도",
  "경상북도",
  "경상남도",
  "제주특별자치도",
];

const SIDO_SLUG: Record<string, string> = {
  서울특별시: "seoul",
  부산광역시: "busan",
  대구광역시: "daegu",
  인천광역시: "incheon",
  광주광역시: "gwangju",
  대전광역시: "daejeon",
  울산광역시: "ulsan",
  세종특별자치시: "sejong",
  경기도: "gyeonggi",
  강원특별자치도: "gangwon",
  충청북도: "chungbuk",
  충청남도: "chungnam",
  전북특별자치도: "jeonbuk",
  전라남도: "jeonnam",
  경상북도: "gyeongbuk",
  경상남도: "gyeongnam",
  제주특별자치도: "jeju",
};

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const apiKey = process.env.APT_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "APT_API_KEY not set" }, { status: 500 });

  // 전월 YYYYMM
  const now = new Date();
  const prev = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const dealYmd = `${prev.getFullYear()}${String(prev.getMonth() + 1).padStart(2, "0")}`;

  const admin = await prisma.user.findFirst({ where: { role: "ADMIN" } });
  if (!admin) return NextResponse.json({ error: "No admin user" }, { status: 500 });

  const results: { sido: string; status: string; count?: number }[] = [];

  for (const sido of SIDO_LIST) {
    try {
      const lawdCds = SIDO_LAWD_CODES[sido] ?? [];
      if (lawdCds.length === 0) {
        results.push({ sido, status: "no_lawdcds" });
        continue;
      }

      // 시군구별 병렬 조회
      const dealArrays = await Promise.all(
        lawdCds.map((cd) => fetchAptDeals(cd, dealYmd, apiKey).catch(() => [] as AptDeal[]))
      );
      const allDeals = dealArrays.flat();

      const top10 = allDeals.sort((a, b) => b.dealAmount - a.dealAmount).slice(0, 10);

      if (top10.length === 0) {
        results.push({ sido, status: "no_deals" });
        continue;
      }

      const { title, excerpt, content } = buildPost(sido, dealYmd, top10);
      const slug = `apt-top10-${SIDO_SLUG[sido] ?? sido}-${dealYmd}`;

      await prisma.post.upsert({
        where: { slug },
        update: { title, excerpt, content, published: true, publishedAt: new Date() },
        create: {
          title,
          slug,
          excerpt,
          content,
          published: true,
          publishedAt: new Date(),
          authorId: admin.id,
        },
      });

      results.push({ sido, status: "ok", count: top10.length });
      console.log(`[cron/apt-price] ${sido} done (${top10.length}건)`);
    } catch (e) {
      console.error(`[cron/apt-price] ${sido}:`, e);
      results.push({ sido, status: `error: ${String(e)}` });
    }
  }

  return NextResponse.json({ ok: true, dealYmd, results });
}

function buildPost(sido: string, dealYmd: string, top10: AptDeal[]) {
  const year = dealYmd.slice(0, 4);
  const month = dealYmd.slice(4, 6);

  const title = `${year}년 ${month}월 ${sido} 아파트 실거래가 TOP 10`;
  const excerpt = `${year}년 ${month}월 ${sido} 아파트 매매 실거래 최고가 TOP 10입니다. 국토교통부 공공데이터 기준으로 집계했습니다.`;

  const rows = top10
    .map(
      (deal, i) =>
        `<tr><td>${i + 1}</td><td><strong>${deal.aptNm}</strong><br><small>${deal.umdNm}</small></td>` +
        `<td>${deal.dealAmount.toLocaleString()}만원</td><td>${deal.excluUseAr}㎡</td><td>${deal.floor}층</td></tr>`
    )
    .join("\n");

  const content = `<h2>${year}년 ${month}월 ${sido} 아파트 실거래가 TOP 10</h2>
<p>${year}년 ${month}월 국토교통부에 신고된 ${sido} 아파트 매매 실거래 중 거래금액이 가장 높은 TOP 10을 정리했습니다.</p>
<table>
<thead>
<tr><th>순위</th><th>아파트 (소재지)</th><th>거래금액</th><th>전용면적</th><th>층</th></tr>
</thead>
<tbody>
${rows}
</tbody>
</table>
<p><small>출처: 국토교통부 아파트매매 실거래 상세 자료 | ${year}년 ${month}월 신고 기준 단일 최고 거래가 순</small></p>`;

  return { title, excerpt, content };
}
