import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { fetchSiGunGuCodes, fetchAptDeals, AptDeal } from "@/lib/apt-trade-api";
import { generateSlug } from "@/lib/utils/slug";
import { SIDO_LIST, SIDO_SLUG } from "@/lib/apt-regions";

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

      const { title, excerpt, content, metaTitle, metaDescription, tagNames } = buildPost(sido, dealYmd, top10);
      const slug = `apt-top10-${SIDO_SLUG[sido] ?? sido}-${dealYmd}`;

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

function formatPricePerPyeong(manwon: number, arStr: string): string {
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

function buildPost(sido: string, dealYmd: string, top10: AptDeal[]) {
  const year = dealYmd.slice(0, 4);
  const month = dealYmd.slice(4, 6);

  const title = `${year}년 ${month}월 ${sido} 아파트 실거래가 TOP 10`;
  const excerpt = `${year}년 ${month}월 ${sido} 아파트 매매 실거래 최고가 TOP 10입니다. 국토교통부 공공데이터 기준으로 집계했습니다.`;
  const metaTitle = `${sido} 아파트 실거래가 TOP10 (${year}.${month}) | 매매 최고가 순위`;
  const metaDescription = `${year}년 ${month}월 ${sido} 아파트 매매 실거래가 순위 TOP10. 국토교통부 실거래가 공개시스템 데이터 기준 최고가 아파트와 평당가, 건축년도를 정리했습니다.`;
  const tagNames = [sido, "아파트 실거래가", "부동산", `${year}년 ${month}월 아파트값`];

  const rows = top10
    .map((deal, i) => {
      const dealDate = deal.dealDay ? `${month}/${deal.dealDay.padStart(2, "0")}` : "-";
      const dong = deal.aptDong ? `${deal.aptDong}동 ` : "";
      return (
        `<tr><td class="rank">${i + 1}</td><td><strong>${deal.aptNm}</strong><br><small>${deal.sigunguNm} ${deal.umdNm}</small></td>` +
        `<td class="num">${formatAmount(deal.dealAmount)}</td><td class="num">${formatArea(deal.excluUseAr)}</td>` +
        `<td class="num">${formatPricePerPyeong(deal.dealAmount, deal.excluUseAr)}</td><td>${dong}${deal.floor}층</td>` +
        `<td>${formatBuildYear(deal.buildYear, year)}</td><td>${dealDate}</td><td>${deal.dealingGbn || "-"}</td></tr>`
      );
    })
    .join("\n");

  const content = `<h2>${year}년 ${month}월 ${sido} 아파트 실거래가 TOP 10</h2>
<p>${year}년 ${month}월 국토교통부에 신고된 ${sido} 아파트 매매 실거래 중 거래금액이 가장 높은 TOP 10을 정리했습니다. (해제된 거래는 제외)</p>
<table>
<thead>
<tr><th class="rank">순위</th><th>아파트 (소재지)</th><th class="num">거래금액</th><th class="num">전용면적</th><th class="num">평당가</th><th>동/층</th><th>건축년도</th><th>계약일</th><th>거래유형</th></tr>
</thead>
<tbody>
${rows}
</tbody>
</table>
<p><small>출처: 국토교통부 아파트매매 실거래 상세 자료 | ${year}년 ${month}월 신고 기준 단일 최고 거래가 순</small></p>
<p>본 자료는 국토교통부 실거래가 공개시스템을 기반으로 매월 1일 자동 업데이트되는 정보입니다. 단순 순위 나열이므로 실제 매물 가격과 차이가 있을 수 있으니, 전월세 계약 전 반드시 해당 지역 특례대출 조건이나 전세보증보험 가입 여부를 먼저 확인하시기 바랍니다.</p>`;

  return { title, excerpt, content, metaTitle, metaDescription, tagNames };
}
