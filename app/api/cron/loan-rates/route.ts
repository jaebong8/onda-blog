import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { fetchMortgageRateTop10, fetchRentLoanRateTop10, LoanProduct } from "@/lib/finlife-api";
import { generateSlug } from "@/lib/utils/slug";
import { generateMarketSummary } from "@/lib/ai-summary";

export const maxDuration = 300;

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const apiKey = process.env.FINLIFE_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "FINLIFE_API_KEY not set" }, { status: 500 });

  const { searchParams } = new URL(request.url);
  const dryRun = searchParams.get("dry") === "true";
  const raw = searchParams.get("raw") === "true";

  const now = new Date();
  const dealYmd = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}`;

  const [mortgageTop10, rentTop10] = await Promise.all([
    fetchMortgageRateTop10(apiKey),
    fetchRentLoanRateTop10(apiKey),
  ]);

  if (raw) {
    return NextResponse.json({ ok: true, mortgageTop10: mortgageTop10.slice(0, 3), rentTop10: rentTop10.slice(0, 3) });
  }

  if (dryRun) {
    return NextResponse.json({ ok: true, dealYmd, mortgageCount: mortgageTop10.length, rentCount: rentTop10.length, mortgageTop10, rentTop10 });
  }

  const admin = await prisma.user.findFirst({ where: { role: "ADMIN" } });
  if (!admin) return NextResponse.json({ error: "No admin user" }, { status: 500 });

  const category = await prisma.category.upsert({
    where: { name: "금융" },
    create: { name: "금융", slug: "finance" },
    update: {},
  });

  const results = [];

  if (mortgageTop10.length > 0) {
    const mortgagePromptRows = mortgageTop10.slice(0, 5)
      .map((p, i) => `${i + 1}위: ${p.korCoNm} (${p.finPrdtNm}) 최저금리 ${p.lendRateMin.toFixed(2)}% · 최고금리 ${p.lendRateMax.toFixed(2)}%`)
      .join("\n");
    const mortgageSummary = await generateMarketSummary(
      `${dealYmd.slice(0, 4)}년 ${dealYmd.slice(4, 6)}월 은행별 주택담보대출 최저금리 상위 5개:\n${mortgagePromptRows}\n\n위 데이터를 바탕으로 이달 주담대 금리 시장 흐름과 대출자 입장에서 주의할 점을 분석해주세요.`
    );
    results.push(await upsertPost({
      dealYmd, admin, category,
      ...buildMortgagePost(dealYmd, mortgageTop10, mortgageSummary),
      slug: `mortgage-rate-top10-${dealYmd}`,
    }));
  }

  if (rentTop10.length > 0) {
    const rentPromptRows = rentTop10.slice(0, 5)
      .map((p, i) => `${i + 1}위: ${p.korCoNm} (${p.finPrdtNm}) 최저금리 ${p.lendRateMin.toFixed(2)}% · 최고금리 ${p.lendRateMax.toFixed(2)}%`)
      .join("\n");
    const rentSummary = await generateMarketSummary(
      `${dealYmd.slice(0, 4)}년 ${dealYmd.slice(4, 6)}월 은행별 전세자금대출 최저금리 상위 5개:\n${rentPromptRows}\n\n위 데이터를 바탕으로 이달 전세대출 금리 흐름과 전세 임차인 입장에서 주의할 점을 분석해주세요.`
    );
    results.push(await upsertPost({
      dealYmd, admin, category,
      ...buildRentPost(dealYmd, rentTop10, rentSummary),
      slug: `rent-loan-rate-top10-${dealYmd}`,
    }));
  }

  return NextResponse.json({ ok: true, dealYmd, results });
}

async function upsertPost({
  slug, title, excerpt, content, metaTitle, metaDescription, tagNames, category, admin,
}: {
  slug: string; title: string; excerpt: string; content: string;
  metaTitle: string; metaDescription: string; tagNames: string[];
  category: { id: string; slug: string };
  admin: { id: string };
  dealYmd: string;
}) {
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
    update: { title, excerpt, content, published: true, publishedAt: new Date(), metaTitle, metaDescription, categoryId: category.id, tags: { deleteMany: {}, create: tagIds } },
    create: { title, slug, excerpt, content, published: true, publishedAt: new Date(), authorId: admin.id, metaTitle, metaDescription, categoryId: category.id, tags: { create: tagIds } },
  });

  revalidatePath("/");
  revalidatePath("/posts");
  revalidatePath(`/posts/${slug}`);
  revalidatePath(`/categories/${category.slug}`);
  for (const tag of tags) revalidatePath(`/tags/${tag.slug}`);
  revalidatePath("/sitemap.xml");

  return { slug, status: "ok" };
}

function formatRate(rate: number): string {
  return `${rate.toFixed(2)}%`;
}

function buildRows(products: LoanProduct[]): string {
  return products
    .map((p, i) =>
      `<tr><td class="rank">${i + 1}</td><td><strong>${p.korCoNm}</strong><br><small>${p.finPrdtNm}</small></td>` +
      `<td class="num">${formatRate(p.lendRateMin)}</td><td class="num">${formatRate(p.lendRateMax)}</td>` +
      `<td>${p.lendRateTypeNm}</td><td>${p.rpayTypeNm}</td></tr>`
    )
    .join("\n");
}

function buildMortgagePost(dealYmd: string, products: LoanProduct[], aiSummary = "") {
  const year = dealYmd.slice(0, 4);
  const month = dealYmd.slice(4, 6);
  const dclsMonth = products[0]?.dclsMonth ?? dealYmd;
  const lowestRate = products[0]?.lendRateMin;

  const title = `${year}년 ${month}월 주택담보대출 금리 비교 - 최저금리 은행 TOP ${products.length}`;
  const excerpt = `${year}년 ${month}월 기준 은행별 주택담보대출 최저금리를 비교했습니다. 최저 ${lowestRate?.toFixed(2)}%부터 시작합니다. 금융감독원 금융상품한눈에 공시 데이터 기준입니다.`;
  const metaTitle = `주택담보대출 금리 비교 ${year}.${month} | 최저금리 은행 순위`;
  const metaDescription = `${year}년 ${month}월 은행별 주택담보대출 최저·최고·평균 금리 비교. 금융감독원 금융상품통합비교공시 기준으로 최저금리 은행부터 순위별로 정리했습니다.`;
  const tagNames = ["주택담보대출", "금리비교", "대출금리", `${year}년 ${month}월 대출금리`];

  const summarySection = aiSummary ? `\n<h3>이달의 금리 분석</h3>\n${aiSummary}` : "";

  const content = `<h2>${year}년 ${month}월 주택담보대출 금리 비교</h2>
<p>금융감독원 금융상품통합비교공시(${dclsMonth.slice(0, 4)}년 ${dclsMonth.slice(4, 6)}월 공시) 기준 은행권 주택담보대출 상품 중 은행별 최저금리 상품을 추려 비교했습니다.</p>
<table>
<thead>
<tr><th class="rank">순위</th><th>은행 (상품명)</th><th class="num">최저금리</th><th class="num">최고금리</th><th>금리유형</th><th>상환방식</th></tr>
</thead>
<tbody>
${buildRows(products)}
</tbody>
</table>
<p><small>출처: 금융감독원 금융상품통합비교공시 | ${dclsMonth.slice(0, 4)}년 ${dclsMonth.slice(4, 6)}월 공시 기준 · 은행별 최저금리 상품 1개 기준</small></p>${summarySection}
<p>위 금리는 공시 기준이며 실제 적용 금리는 개인 신용도, 담보 가치, 우대 조건에 따라 달라질 수 있습니다. 정확한 한도와 금리는 각 은행에서 직접 확인하시기 바랍니다.</p>`;

  return { title, excerpt, content, metaTitle, metaDescription, tagNames };
}

function buildRentPost(dealYmd: string, products: LoanProduct[], aiSummary = "") {
  const year = dealYmd.slice(0, 4);
  const month = dealYmd.slice(4, 6);
  const dclsMonth = products[0]?.dclsMonth ?? dealYmd;
  const lowestRate = products[0]?.lendRateMin;

  const title = `${year}년 ${month}월 전세자금대출 금리 비교 - 최저금리 은행 TOP ${products.length}`;
  const excerpt = `${year}년 ${month}월 기준 은행별 전세자금대출 최저금리를 비교했습니다. 최저 ${lowestRate?.toFixed(2)}%부터 시작합니다. 금융감독원 금융상품한눈에 공시 데이터 기준입니다.`;
  const metaTitle = `전세자금대출 금리 비교 ${year}.${month} | 최저금리 은행 순위`;
  const metaDescription = `${year}년 ${month}월 은행별 전세자금대출 최저·최고·평균 금리 비교. 금융감독원 금융상품통합비교공시 기준으로 최저금리 은행부터 순위별로 정리했습니다.`;
  const tagNames = ["전세자금대출", "금리비교", "전세대출금리", `${year}년 ${month}월 대출금리`];

  const summarySection = aiSummary ? `\n<h3>이달의 금리 분석</h3>\n${aiSummary}` : "";

  const content = `<h2>${year}년 ${month}월 전세자금대출 금리 비교</h2>
<p>금융감독원 금융상품통합비교공시(${dclsMonth.slice(0, 4)}년 ${dclsMonth.slice(4, 6)}월 공시) 기준 은행권 전세자금대출 상품 중 은행별 최저금리 상품을 추려 비교했습니다.</p>
<table>
<thead>
<tr><th class="rank">순위</th><th>은행 (상품명)</th><th class="num">최저금리</th><th class="num">최고금리</th><th>금리유형</th><th>상환방식</th></tr>
</thead>
<tbody>
${buildRows(products)}
</tbody>
</table>
<p><small>출처: 금융감독원 금융상품통합비교공시 | ${dclsMonth.slice(0, 4)}년 ${dclsMonth.slice(4, 6)}월 공시 기준 · 은행별 최저금리 상품 1개 기준</small></p>${summarySection}
<p>위 금리는 공시 기준이며 실제 적용 금리는 개인 신용도, 보증 조건, 우대 혜택에 따라 달라질 수 있습니다. 정확한 한도와 금리는 각 은행에서 직접 확인하시기 바랍니다.</p>`;

  return { title, excerpt, content, metaTitle, metaDescription, tagNames };
}
