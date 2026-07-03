import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { fetchAPTListings, overlapsWeek, CheongyakListing } from "@/lib/cheongyak-api";
import { generateSlug } from "@/lib/utils/slug";
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
  const raw = searchParams.get("raw") === "true";

  // 이번 주 월요일~일요일 (KST 기준)
  const kstNow = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Seoul" }));
  const dow = kstNow.getDay();
  const monday = new Date(kstNow);
  monday.setDate(kstNow.getDate() - (dow === 0 ? 6 : dow - 1));
  monday.setHours(0, 0, 0, 0);

  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);

  const weekStart = monday.toISOString().slice(0, 10);
  const weekEnd = sunday.toISOString().slice(0, 10);

  // slug 용 날짜 + 주차 라벨
  const mondayStr = weekStart.replace(/-/g, "");
  const weekOfMonth = Math.ceil(monday.getDate() / 7);
  const year = monday.getFullYear();
  const month = String(monday.getMonth() + 1).padStart(2, "0");

  const allListings = await fetchAPTListings(apiKey, weekStart);

  if (raw) {
    return NextResponse.json({ ok: true, weekStart, weekEnd, total: allListings.length, listings: allListings.slice(0, 5) });
  }

  const thisWeek = allListings.filter((l) => overlapsWeek(l, monday, sunday));
  // 일반공급 시작일 빠른 순 정렬
  thisWeek.sort((a, b) => (a.rceptBgnde || a.spsplyRceptBgnde).localeCompare(b.rceptBgnde || b.spsplyRceptBgnde));

  if (dryRun) {
    return NextResponse.json({ ok: true, weekStart, weekEnd, fetched: allListings.length, thisWeek: thisWeek.length, listings: thisWeek });
  }

  const admin = await prisma.user.findFirst({ where: { role: "ADMIN" } });
  if (!admin) return NextResponse.json({ error: "No admin user" }, { status: 500 });

  const category = await prisma.category.upsert({
    where: { name: "청약" },
    create: { name: "청약", slug: "cheongyak" },
    update: {},
  });

  const title = `${year}년 ${month}월 ${weekOfMonth}주차 이번 주 청약 아파트 총정리`;
  const excerpt = thisWeek.length > 0
    ? `${year}년 ${month}월 ${weekOfMonth}주차(${weekStart} ~ ${weekEnd}) 청약 접수 중이거나 이번 주 시작하는 아파트 ${thisWeek.length}건을 정리했습니다.`
    : `${year}년 ${month}월 ${weekOfMonth}주차에는 청약 일정이 없습니다.`;

  const aiPrompt = thisWeek.length > 0
    ? `${year}년 ${month}월 ${weekOfMonth}주차 청약 아파트 목록:\n` +
      thisWeek.slice(0, 5).map((l) =>
        `- ${l.houseNm} (${l.subscrptAreaCodeNm}) ${l.houseDtlSecdNm} · 일반공급 ${l.rceptBgnde}~${l.rceptEndde} · 총 ${l.totSuplyHshldco}세대`
      ).join("\n") +
      `\n\n위 데이터를 바탕으로 이번 주 청약 시장 특징과 실수요자가 주목해야 할 단지를 분석해주세요.`
    : "";

  const aiSummary = aiPrompt ? await generateMarketSummary(aiPrompt) : "";

  const content = buildContent(year, month, weekOfMonth, weekStart, weekEnd, thisWeek, aiSummary);
  const metaTitle = `${year}년 ${month}월 ${weekOfMonth}주차 청약 일정 | 이번 주 아파트 청약 총정리`;
  const metaDescription = `${year}년 ${month}월 ${weekOfMonth}주차 청약 접수 아파트 ${thisWeek.length}건. 특별공급·일반공급 일정, 총 세대수, 당첨자 발표일을 한눈에 정리했습니다.`;
  const tagNames = ["청약", "아파트분양", "청약일정", `${year}년 ${month}월 청약`];
  const slug = `cheongyak-weekly-${mondayStr}`;

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

  return NextResponse.json({ ok: true, weekStart, weekEnd, fetched: allListings.length, thisWeek: thisWeek.length, slug });
}

function fmtDate(s: string): string {
  if (!s) return "-";
  const d = new Date(s);
  if (isNaN(d.getTime())) return s;
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

function fmtMoveIn(ym: string): string {
  if (!ym || ym.length < 6) return ym || "-";
  return `${ym.slice(0, 4)}년 ${ym.slice(4, 6)}월`;
}

function buildRows(listings: CheongyakListing[]): string {
  return listings
    .map((l) => {
      const spsply = l.spsplyRceptBgnde
        ? `${fmtDate(l.spsplyRceptBgnde)}~${fmtDate(l.spsplyRceptEndde)}`
        : "-";
      const gnrl = l.rceptBgnde
        ? `${fmtDate(l.rceptBgnde)}~${fmtDate(l.rceptEndde)}`
        : "-";
      const badge = l.publicHouseEarthAt === "Y" ? " <small>[공공]</small>" : "";
      const link = l.pblancUrl
        ? ` <a href="${l.pblancUrl}" target="_blank" rel="noopener noreferrer">[청약홈]</a>`
        : "";
      return (
        `<tr>` +
        `<td><strong>${l.houseNm}</strong>${badge}${link}<br><small>${l.subscrptAreaCodeNm} · ${l.hssplyAdres.slice(0, 30)}</small></td>` +
        `<td>${l.houseDtlSecdNm}</td>` +
        `<td>${spsply}</td>` +
        `<td>${gnrl}</td>` +
        `<td class="num">${l.totSuplyHshldco.toLocaleString()}세대</td>` +
        `<td>${fmtDate(l.przwnerPresnatnDe)}</td>` +
        `<td>${fmtMoveIn(l.mvnPrearngeYm)}</td>` +
        `</tr>`
      );
    })
    .join("\n");
}

function buildContent(
  year: number, month: string, weekOfMonth: number,
  weekStart: string, weekEnd: string,
  listings: CheongyakListing[], aiSummary: string
): string {
  const summarySection = aiSummary ? `\n<h3>이번 주 청약 시장 분석</h3>\n${aiSummary}` : "";

  if (listings.length === 0) {
    return `<h2>${year}년 ${month}월 ${weekOfMonth}주차 청약 일정</h2>
<p>${weekStart} ~ ${weekEnd} 기간 동안 청약 접수 중인 아파트가 없습니다. 다음 주 일정을 확인하세요.</p>
<p><small>출처: 한국부동산원 청약홈 분양정보 조회 서비스</small></p>`;
  }

  return `<h2>${year}년 ${month}월 ${weekOfMonth}주차 이번 주 청약 아파트 총정리</h2>
<p>${weekStart}부터 ${weekEnd}까지 청약 접수 중이거나 이번 주 시작하는 아파트 <strong>${listings.length}건</strong>을 정리했습니다. 특별공급 일정을 반드시 먼저 확인하세요.</p>
<table>
<thead>
<tr><th>단지명 (지역)</th><th>구분</th><th>특별공급</th><th>일반공급</th><th class="num">총세대</th><th>당첨발표</th><th>입주예정</th></tr>
</thead>
<tbody>
${buildRows(listings)}
</tbody>
</table>
<p><small>출처: 한국부동산원 청약홈 분양정보 조회 서비스 | ${weekStart} 기준 · 일반공급 접수 시작일 순 정렬</small></p>${summarySection}
<p>청약 자격 및 상세 일정은 <a href="https://www.applyhome.co.kr" target="_blank" rel="noopener noreferrer">청약홈(applyhome.co.kr)</a>에서 반드시 원문을 확인하시기 바랍니다. 당첨 후 계약 포기 시 불이익이 발생할 수 있습니다.</p>`;
}
