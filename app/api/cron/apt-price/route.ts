import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { fetchSiGunGuCodes, fetchAptDeals, AptDeal } from "@/lib/apt-trade-api";

export const maxDuration = 300;

const SIDO_LIST = [
  // 특별시 / 광역시
  "서울특별시", "부산광역시", "대구광역시", "인천광역시",
  "광주광역시", "대전광역시", "울산광역시", "세종특별자치시",
  // 경기 주요 시
  "수원시", "고양시", "용인시", "성남시", "화성시",
  "부천시", "남양주시", "안산시", "안양시", "평택시", "김포시", "의정부시", "시흥시",
  // 경남 주요 시
  "창원시", "김해시", "양산시", "진주시",
  // 충남 / 충북
  "천안시", "아산시", "청주시",
  // 전북
  "전주시",
  // 경북
  "포항시", "구미시",
  // 강원
  "원주시", "춘천시",
  // 제주
  "제주시",
];

const SIDO_SLUG: Record<string, string> = {
  서울특별시: "seoul", 부산광역시: "busan", 대구광역시: "daegu", 인천광역시: "incheon",
  광주광역시: "gwangju", 대전광역시: "daejeon", 울산광역시: "ulsan", 세종특별자치시: "sejong",
  수원시: "suwon", 고양시: "goyang", 용인시: "yongin", 성남시: "seongnam",
  화성시: "hwaseong", 부천시: "bucheon", 남양주시: "namyangju", 안산시: "ansan",
  안양시: "anyang", 평택시: "pyeongtaek", 김포시: "gimpo", 의정부시: "uijeongbu", 시흥시: "siheung",
  창원시: "changwon", 김해시: "gimhae", 양산시: "yangsan", 진주시: "jinju",
  천안시: "cheonan", 아산시: "asan", 청주시: "cheongju",
  전주시: "jeonju",
  포항시: "pohang", 구미시: "gumi",
  원주시: "wonju", 춘천시: "chuncheon",
  제주시: "jeju",
};

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const apiKey = process.env.APT_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "APT_API_KEY not set" }, { status: 500 });

  const { searchParams } = new URL(request.url);
  const dryRun = searchParams.get("dry") === "true";
  const sidoFilter = searchParams.get("sido");
  const debug = searchParams.get("debug") === "true";

  // 전월 YYYYMM
  const now = new Date();
  const prev = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const dealYmd = `${prev.getFullYear()}${String(prev.getMonth() + 1).padStart(2, "0")}`;

  const admin = await prisma.user.findFirst({ where: { role: "ADMIN" } });
  if (!admin) return NextResponse.json({ error: "No admin user" }, { status: 500 });

  const targetList = sidoFilter ? SIDO_LIST.filter((s) => s === sidoFilter) : SIDO_LIST;
  const results: { sido: string; status: string; count?: number; top10?: AptDeal[]; lawdCds?: string[]; rawCount?: number }[] = [];

  for (const sido of targetList) {
    try {
      const lawdCds = await fetchSiGunGuCodes(sido, apiKey);
      if (lawdCds.length === 0) {
        results.push({ sido, status: "no_lawdcds" });
        continue;
      }

      // 시군구별 병렬 조회 (5개씩 배치 처리)
      const allDeals: AptDeal[] = [];
      for (let i = 0; i < lawdCds.length; i += 5) {
        const batch = lawdCds.slice(i, i + 5);
        const batchResults = await Promise.all(
          batch.map((cd) => fetchAptDeals(cd, dealYmd, apiKey).catch(() => [] as AptDeal[]))
        );
        allDeals.push(...batchResults.flat());
      }

      // 같은 아파트는 최고가 1건만 유지
      const aptMap = new Map<string, AptDeal>();
      for (const deal of allDeals) {
        const existing = aptMap.get(deal.aptNm);
        if (!existing || deal.dealAmount > existing.dealAmount) {
          aptMap.set(deal.aptNm, deal);
        }
      }
      const top10 = Array.from(aptMap.values())
        .sort((a, b) => b.dealAmount - a.dealAmount)
        .slice(0, 10);

      if (top10.length === 0) {
        results.push({ sido, status: "no_deals", ...(debug && { lawdCds, rawCount: allDeals.length }) });
        continue;
      }

      if (dryRun) {
        results.push({ sido, status: "dry_run", count: top10.length, top10 });
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

  return NextResponse.json({ ok: true, dealYmd, dryRun, results });
}

function formatAmount(manwon: number): string {
  const eok = Math.floor(manwon / 10000);
  const rem = manwon % 10000;
  let label: string;
  if (eok > 0 && rem > 0) label = `${eok}억 ${rem.toLocaleString()}만원`;
  else if (eok > 0) label = `${eok}억원`;
  else label = `${manwon.toLocaleString()}만원`;
  return `${manwon.toLocaleString()}만원 (${label})`;
}

function formatArea(arStr: string): string {
  const ar = parseFloat(arStr);
  if (isNaN(ar)) return `${arStr}㎡`;
  const pyeong = (ar / 3.3058).toFixed(1);
  return `${ar}㎡ (${pyeong}평)`;
}

function buildPost(sido: string, dealYmd: string, top10: AptDeal[]) {
  const year = dealYmd.slice(0, 4);
  const month = dealYmd.slice(4, 6);

  const title = `${year}년 ${month}월 ${sido} 아파트 실거래가 TOP 10`;
  const excerpt = `${year}년 ${month}월 ${sido} 아파트 매매 실거래 최고가 TOP 10입니다. 국토교통부 공공데이터 기준으로 집계했습니다.`;

  const rows = top10
    .map(
      (deal, i) =>
        `<tr><td>${i + 1}</td><td><strong>${deal.aptNm}</strong><br><small>${deal.sigunguNm} ${deal.umdNm}</small></td>` +
        `<td>${formatAmount(deal.dealAmount)}</td><td>${formatArea(deal.excluUseAr)}</td><td>${deal.floor}층</td></tr>`
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
