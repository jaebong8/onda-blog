import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { fetchSiGunGuCodes, fetchAptRentDeals, AptRentDeal } from "@/lib/apt-trade-api";
import { generateSlug } from "@/lib/utils/slug";
import { SIDO_LIST, SIDO_SLUG } from "@/lib/apt-regions";
import { generateMarketSummary } from "@/lib/ai-summary";

export const maxDuration = 300;

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

  const category = await prisma.category.upsert({
    where: { name: "부동산" },
    create: { name: "부동산", slug: "real-estate" },
    update: {},
  });

  const targetList = sidoFilter ? SIDO_LIST.filter((s) => s === sidoFilter) : SIDO_LIST;
  const results: { sido: string; status: string; jeonseCount?: number; wolseCount?: number; lawdCds?: string[]; rawCount?: number }[] = [];

  for (const sido of targetList) {
    try {
      const lawdCds = await fetchSiGunGuCodes(sido, apiKey);
      if (lawdCds.length === 0) {
        results.push({ sido, status: "no_lawdcds" });
        continue;
      }

      // 시군구별 병렬 조회 (5개씩 배치 처리)
      const allDeals: AptRentDeal[] = [];
      for (let i = 0; i < lawdCds.length; i += 5) {
        const batch = lawdCds.slice(i, i + 5);
        const batchResults = await Promise.all(
          batch.map((cd) => fetchAptRentDeals(cd, dealYmd, apiKey).catch(() => [] as AptRentDeal[]))
        );
        allDeals.push(...batchResults.flat());
      }

      const jeonseDeals = allDeals.filter((d) => d.monthlyRent === 0);
      const wolseDeals = allDeals.filter((d) => d.monthlyRent > 0);

      // 같은 아파트는 최고가 1건만 유지
      const jeonseTop10 = dedupeTop(jeonseDeals, (d) => d.deposit);
      const wolseTop10 = dedupeTop(wolseDeals, (d) => d.monthlyRent);

      if (jeonseTop10.length === 0 && wolseTop10.length === 0) {
        results.push({ sido, status: "no_deals", ...(debug && { lawdCds, rawCount: allDeals.length }) });
        continue;
      }

      if (dryRun) {
        results.push({ sido, status: "dry_run", jeonseCount: jeonseTop10.length, wolseCount: wolseTop10.length });
        continue;
      }

      const year = dealYmd.slice(0, 4);
      const month = dealYmd.slice(4, 6);
      const jeonseRows = jeonseTop10.slice(0, 3)
        .map((d, i) => `전세 ${i + 1}위: ${d.aptNm} 보증금 ${d.deposit.toLocaleString()}만원 · ${d.excluUseAr}㎡`)
        .join("\n");
      const wolseRows = wolseTop10.slice(0, 3)
        .map((d, i) => `월세 ${i + 1}위: ${d.aptNm} 보증금 ${d.deposit.toLocaleString()}만원/월세 ${d.monthlyRent.toLocaleString()}만원 · ${d.excluUseAr}㎡`)
        .join("\n");
      const aiSummary = await generateMarketSummary(
        `${year}년 ${month}월 ${sido} 아파트 전월세 실거래 현황:\n${jeonseRows}\n${wolseRows}\n\n위 데이터를 바탕으로 이달 ${sido} 아파트 전월세 시장 흐름을 분석해주세요.`
      );

      const { title, excerpt, content, metaTitle, metaDescription, tagNames } = buildPost(sido, dealYmd, jeonseTop10, wolseTop10, aiSummary);
      const slug = `apt-rent-top10-${SIDO_SLUG[sido] ?? sido}-${dealYmd}`;

      const tags = await Promise.all(
        tagNames.map((name) =>
          prisma.tag.upsert({
            where: { name },
            create: { name, slug: generateSlug(name) },
            update: {},
            select: { id: true, slug: true },
          })
        )
      );
      const tagIds = tags.map((t) => ({ tagId: t.id }));

      await prisma.post.upsert({
        where: { slug },
        update: {
          title,
          excerpt,
          content,
          published: true,
          publishedAt: new Date(),
          metaTitle,
          metaDescription,
          categoryId: category.id,
          tags: { deleteMany: {}, create: tagIds },
        },
        create: {
          title,
          slug,
          excerpt,
          content,
          published: true,
          publishedAt: new Date(),
          authorId: admin.id,
          metaTitle,
          metaDescription,
          categoryId: category.id,
          tags: { create: tagIds },
        },
      });

      revalidatePath("/");
      revalidatePath("/posts");
      revalidatePath(`/posts/${slug}`);
      revalidatePath(`/categories/${category.slug}`);
      for (const tag of tags) revalidatePath(`/tags/${tag.slug}`);
      revalidatePath("/sitemap.xml");

      results.push({ sido, status: "ok", jeonseCount: jeonseTop10.length, wolseCount: wolseTop10.length });
      console.log(`[cron/apt-rent] ${sido} done (전세 ${jeonseTop10.length}건, 월세 ${wolseTop10.length}건)`);
    } catch (e) {
      console.error(`[cron/apt-rent] ${sido}:`, e);
      results.push({ sido, status: `error: ${String(e)}` });
    }
  }

  return NextResponse.json({ ok: true, dealYmd, dryRun, results });
}

function dedupeTop(deals: AptRentDeal[], rankBy: (d: AptRentDeal) => number): AptRentDeal[] {
  const map = new Map<string, AptRentDeal>();
  for (const deal of deals) {
    const existing = map.get(deal.aptNm);
    if (!existing || rankBy(deal) > rankBy(existing)) {
      map.set(deal.aptNm, deal);
    }
  }
  return Array.from(map.values())
    .sort((a, b) => rankBy(b) - rankBy(a))
    .slice(0, 10);
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

function formatPerPyeong(manwon: number, arStr: string): string {
  const ar = parseFloat(arStr);
  if (isNaN(ar) || ar === 0) return "-";
  const pyeong = ar / 3.3058;
  const perPyeong = Math.round(manwon / pyeong);
  return formatAmount(perPyeong);
}

function formatBuildYear(buildYear: string, dealYear: string): string {
  const by = parseInt(buildYear, 10);
  const dy = parseInt(dealYear, 10);
  if (isNaN(by) || isNaN(dy)) return `${buildYear}년`;
  const age = dy - by;
  return `${buildYear}년 (${age}년차)`;
}

function dealDate(deal: AptRentDeal): string {
  if (!deal.dealMonth || !deal.dealDay) return "-";
  return `${deal.dealMonth.padStart(2, "0")}/${deal.dealDay.padStart(2, "0")}`;
}

function contractLabel(deal: AptRentDeal): string {
  const type = deal.contractType || "-";
  return deal.useRRRight === "O" ? `${type} (갱신권 사용)` : type;
}

function buildJeonseRows(deals: AptRentDeal[], year: string): string {
  return deals
    .map((deal, i) => (
      `<tr><td class="rank">${i + 1}</td><td><strong>${deal.aptNm}</strong><br><small>${deal.umdNm} ${deal.jibun}</small></td>` +
      `<td class="num">${formatAmount(deal.deposit)}</td><td class="num">${formatArea(deal.excluUseAr)}</td>` +
      `<td class="num">${formatPerPyeong(deal.deposit, deal.excluUseAr)}</td><td>${deal.floor}층</td>` +
      `<td>${formatBuildYear(deal.buildYear, year)}</td><td>${dealDate(deal)}</td><td>${contractLabel(deal)}</td></tr>`
    ))
    .join("\n");
}

function buildWolseRows(deals: AptRentDeal[], year: string): string {
  return deals
    .map((deal, i) => (
      `<tr><td class="rank">${i + 1}</td><td><strong>${deal.aptNm}</strong><br><small>${deal.umdNm} ${deal.jibun}</small></td>` +
      `<td class="num">${formatAmount(deal.deposit)}</td><td class="num">${deal.monthlyRent.toLocaleString()}만원</td><td class="num">${formatArea(deal.excluUseAr)}</td>` +
      `<td>${deal.floor}층</td><td>${formatBuildYear(deal.buildYear, year)}</td><td>${dealDate(deal)}</td><td>${contractLabel(deal)}</td></tr>`
    ))
    .join("\n");
}

function buildPost(sido: string, dealYmd: string, jeonseTop10: AptRentDeal[], wolseTop10: AptRentDeal[], aiSummary = "") {
  const year = dealYmd.slice(0, 4);
  const month = dealYmd.slice(4, 6);

  const title = `${year}년 ${month}월 ${sido} 아파트 전월세 실거래가 TOP 10`;
  const excerpt = `${year}년 ${month}월 ${sido} 아파트 전세 보증금, 월세 실거래 TOP 10입니다. 국토교통부 공공데이터 기준으로 집계했습니다.`;
  const metaTitle = `${sido} 아파트 전월세 실거래가 TOP10 (${year}.${month}) | 전세·월세 순위`;
  const metaDescription = `${year}년 ${month}월 ${sido} 아파트 전월세 실거래가 순위 TOP10. 국토교통부 실거래가 공개시스템 데이터 기준 전세 보증금 최고가와 월세 최고가를 정리했습니다.`;
  const tagNames = [sido, "아파트 전월세", "전세", "월세", `${year}년 ${month}월 전월세`];

  const jeonseSection = jeonseTop10.length > 0
    ? `<h3>전세 보증금 TOP 10</h3>
<table>
<thead>
<tr><th class="rank">순위</th><th>아파트 (소재지)</th><th class="num">보증금</th><th class="num">전용면적</th><th class="num">평당보증금</th><th>층</th><th>건축년도</th><th>계약일</th><th>계약구분</th></tr>
</thead>
<tbody>
${buildJeonseRows(jeonseTop10, year)}
</tbody>
</table>`
    : `<h3>전세 보증금 TOP 10</h3><p>${year}년 ${month}월 신고된 전세 거래가 없습니다.</p>`;

  const wolseSection = wolseTop10.length > 0
    ? `<h3>월세 TOP 10</h3>
<table>
<thead>
<tr><th class="rank">순위</th><th>아파트 (소재지)</th><th class="num">보증금</th><th class="num">월세</th><th class="num">전용면적</th><th>층</th><th>건축년도</th><th>계약일</th><th>계약구분</th></tr>
</thead>
<tbody>
${buildWolseRows(wolseTop10, year)}
</tbody>
</table>`
    : `<h3>월세 TOP 10</h3><p>${year}년 ${month}월 신고된 월세 거래가 없습니다.</p>`;

  const summarySection = aiSummary ? `\n<h3>이달의 시장 분석</h3>\n${aiSummary}` : "";

  const content = `<h2>${year}년 ${month}월 ${sido} 아파트 전월세 실거래가 TOP 10</h2>
<p>${year}년 ${month}월 국토교통부에 신고된 ${sido} 아파트 전월세 실거래 중 전세 보증금 최고가와 월세 최고가를 각각 TOP 10으로 정리했습니다.</p>
${jeonseSection}
${wolseSection}
<p><small>출처: 국토교통부 아파트 전월세 실거래 상세 자료 | ${year}년 ${month}월 신고 기준</small></p>${summarySection}
<p>본 자료는 국토교통부 실거래가 공개시스템을 기반으로 매월 1일 자동 업데이트되는 정보입니다. 단순 순위 나열이므로 실제 매물 가격과 차이가 있을 수 있으니, 전월세 계약 전 반드시 해당 지역 특례대출 조건이나 전세보증보험 가입 여부를 먼저 확인하시기 바랍니다.</p>`;

  return { title, excerpt, content, metaTitle, metaDescription, tagNames };
}
