import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { fetchSubsidyNotices, parseYmd, SubsidyNotice } from "@/lib/gov-subsidy-api";
import { generateSlug } from "@/lib/utils/slug";

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

  const now = new Date();
  const bsnsyear = String(now.getFullYear());
  const dealYmd = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}`;

  const notices = await fetchSubsidyNotices(bsnsyear, apiKey);

  if (raw) {
    return NextResponse.json({ ok: true, fetched: notices.length, notices: notices.slice(0, 5) });
  }

  const openNow = notices.filter((n) => {
    // 접수기간 우선, 없으면 공고기간으로 fallback
    const beginStr = n.rceptBeginDe || n.pblancBeginDe;
    const endStr = n.rceptEndDe || n.pblancEndDe;
    const begin = parseYmd(beginStr);
    const end = parseYmd(endStr);
    return begin && end && begin <= now && end >= now;
  });

  // 같은 공고명+세부사업명은 1건만 유지, 마감일 빠른 순으로 정렬
  const dedupMap = new Map<string, SubsidyNotice>();
  for (const n of openNow) {
    dedupMap.set(`${n.pblancNm || n.dtlbzNm}|${n.dtlbzNm}`, n);
  }
  const sorted = Array.from(dedupMap.values()).sort((a, b) => {
    const aEnd = parseYmd(a.rceptEndDe || a.pblancEndDe)!.getTime();
    const bEnd = parseYmd(b.rceptEndDe || b.pblancEndDe)!.getTime();
    return aEnd - bEnd;
  });
  const top30 = sorted.slice(0, 30);

  if (top30.length === 0) {
    return NextResponse.json({ ok: true, dealYmd, dryRun, fetched: notices.length, openNow: 0, status: "no_open_notices" });
  }

  if (dryRun) {
    return NextResponse.json({ ok: true, dealYmd, dryRun, fetched: notices.length, openNow: sorted.length, top30 });
  }

  const admin = await prisma.user.findFirst({ where: { role: "ADMIN" } });
  if (!admin) return NextResponse.json({ error: "No admin user" }, { status: 500 });

  const category = await prisma.category.upsert({
    where: { name: "정부지원금" },
    create: { name: "정부지원금", slug: "gov-subsidy" },
    update: {},
  });

  const { title, excerpt, content, metaTitle, metaDescription, tagNames } = buildPost(dealYmd, top30, now);
  const slug = `gov-subsidy-open-${dealYmd}`;

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

  return NextResponse.json({ ok: true, dealYmd, fetched: notices.length, openNow: sorted.length, posted: top30.length });
}

function formatDday(endDate: Date, today: Date): string {
  const diffDays = Math.ceil((endDate.getTime() - today.getTime()) / 86400000);
  if (diffDays < 0) return "마감";
  if (diffDays === 0) return "오늘마감";
  return `D-${diffDays}`;
}

function formatAmount(raw: string): string {
  const digits = raw.replace(/[^0-9]/g, "");
  if (!digits) return raw || "-";
  return `${Number(digits).toLocaleString()}원`;
}

function truncate(text: string, max: number): string {
  if (!text) return "-";
  return text.length > max ? `${text.slice(0, max)}…` : text;
}

function formatPeriod(beginDe: string, endDe: string): string {
  const fmt = (s: string) => {
    const d = parseYmd(s);
    if (!d) return s || "-";
    return `${d.getMonth() + 1}/${d.getDate()}`;
  };
  return `${fmt(beginDe)} ~ ${fmt(endDe)}`;
}

function buildRows(notices: SubsidyNotice[], today: Date): string {
  return notices
    .map((n) => {
      const end = parseYmd(n.rceptEndDe || n.pblancEndDe);
      const region = [n.ctprvnNm, n.signguNm].filter(Boolean).join(" ") || "전국";
      return `<tr><td><strong>${n.pblancNm || n.dtlbzNm}</strong><br><small>${n.jrsdNm || "-"} · ${region}</small></td>` +
        `<td>${truncate(n.sportTrgetCn, 60)}</td>` +
        `<td class="num">${formatAmount(n.sportBgamt)}</td>` +
        `<td>${formatPeriod(n.rceptBeginDe || n.pblancBeginDe, n.rceptEndDe || n.pblancEndDe)}</td>` +
        `<td>${end ? formatDday(end, today) : "-"}</td></tr>`;
    })
    .join("\n");
}

function buildPost(dealYmd: string, notices: SubsidyNotice[], today: Date) {
  const year = dealYmd.slice(0, 4);
  const month = dealYmd.slice(4, 6);

  const title = `${year}년 ${month}월 지금 신청 가능한 국고보조금 공모사업 모음`;
  const excerpt = `${year}년 ${month}월 기준 접수 진행 중인 국고보조금 공모사업 ${notices.length}건을 마감일이 빠른 순으로 정리했습니다. 기획재정부 공공데이터 기준입니다.`;
  const metaTitle = `국고보조금 공모사업 신청 가능 목록 (${year}.${month}) | 지원금 마감일순`;
  const metaDescription = `${year}년 ${month}월 현재 접수 중인 국고보조금 공모사업을 마감일이 빠른 순으로 정리했습니다. 지원대상, 지원금액, 접수기간을 기획재정부 공공데이터 기준으로 확인하세요.`;
  const tagNames = ["국고보조금", "정부지원금", "공모사업", `${year}년 ${month}월 지원금`];

  const content = `<h2>${year}년 ${month}월 지금 신청 가능한 국고보조금 공모사업</h2>
<p>${year}년 ${month}월 기준으로 접수가 진행 중인 국고보조금 공모사업 ${notices.length}건을 마감일이 빠른 순으로 정리했습니다. 신청 전 반드시 원문 공고를 통해 정확한 자격 요건과 제출 서류를 확인하세요.</p>
<table>
<thead>
<tr><th>사업명 (주관기관)</th><th>지원대상</th><th class="num">지원금액</th><th>접수기간</th><th>마감</th></tr>
</thead>
<tbody>
${buildRows(notices, today)}
</tbody>
</table>
<p><small>출처: 기획재정부 국고보조사업 공모 정보 (공공데이터포털) | ${year}년 ${month}월 기준 접수 중인 사업</small></p>`;

  return { title, excerpt, content, metaTitle, metaDescription, tagNames };
}
