import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { fetchAPTListings } from "@/lib/cheongyak-api";
import { fetchCmpetRates, fetchScores, CmpetRow, ScoreRow } from "@/lib/cheongyak-cmpet-api";
import { generateSlug } from "@/lib/utils/slug";
import { generateMarketSummary } from "@/lib/ai-summary";

export const maxDuration = 300;

function extractIds(pblancUrl: string): { houseManageNo: string; pblancNo: string } | null {
  const mh = pblancUrl.match(/[?&]houseManageNo=(\d+)/i);
  const mp = pblancUrl.match(/[?&]pblancNo=(\d+)/i);
  if (!mh || !mp) return null;
  return { houseManageNo: mh[1], pblancNo: mp[1] };
}

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

  // 지난 주 월~일 (KST 기준)
  const kstNow = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Seoul" }));
  const dow = kstNow.getDay();
  const thisMonday = new Date(kstNow);
  thisMonday.setDate(kstNow.getDate() - (dow === 0 ? 6 : dow - 1));
  thisMonday.setHours(0, 0, 0, 0);

  const lastMonday = new Date(thisMonday);
  lastMonday.setDate(thisMonday.getDate() - 7);
  const lastSunday = new Date(thisMonday);
  lastSunday.setDate(thisMonday.getDate() - 1);

  const lastWeekStart = lastMonday.toISOString().slice(0, 10);
  const lastWeekEnd = lastSunday.toISOString().slice(0, 10);

  const year = thisMonday.getFullYear();
  const month = String(thisMonday.getMonth() + 1).padStart(2, "0");
  const weekOfMonth = Math.ceil(thisMonday.getDate() / 7);
  const mondayStr = thisMonday.toISOString().slice(0, 10).replace(/-/g, "");

  // 지난주에 마감된 청약 목록
  const allListings = await fetchAPTListings(apiKey, lastWeekStart);
  const closedLastWeek = allListings.filter(
    (l) => l.rceptEndde >= lastWeekStart && l.rceptEndde <= lastWeekEnd
  );

  if (raw) {
    return NextResponse.json({
      ok: true, lastWeekStart, lastWeekEnd,
      closedLastWeek: closedLastWeek.length,
      sample: closedLastWeek.slice(0, 3),
    });
  }

  // 각 단지 경쟁률 + 가점 조회 (최대 10개)
  const targets = closedLastWeek.slice(0, 10);
  const results = await Promise.all(
    targets.map(async (l) => {
      if (!l.pblancUrl) return null;
      const ids = extractIds(l.pblancUrl);
      if (!ids) return null;
      try {
        const [cmpetRows, scoreRows] = await Promise.all([
          fetchCmpetRates(apiKey, ids.houseManageNo, ids.pblancNo),
          fetchScores(apiKey, ids.houseManageNo, ids.pblancNo),
        ]);
        if (cmpetRows.length === 0) return null;
        return { listing: l, cmpetRows, scoreRows };
      } catch {
        return null;
      }
    })
  );

  const valid = results.filter(Boolean) as {
    listing: typeof targets[0];
    cmpetRows: CmpetRow[];
    scoreRows: ScoreRow[];
  }[];

  if (dryRun) {
    return NextResponse.json({ ok: true, lastWeekStart, lastWeekEnd, closedLastWeek: closedLastWeek.length, withData: valid.length, sample: valid.slice(0, 1) });
  }

  const admin = await prisma.user.findFirst({ where: { role: "ADMIN" } });
  if (!admin) return NextResponse.json({ error: "No admin user" }, { status: 500 });

  const category = await prisma.category.upsert({
    where: { name: "청약" },
    create: { name: "청약", slug: "cheongyak" },
    update: {},
  });

  const title = `${year}년 ${month}월 ${weekOfMonth}주차 청약 경쟁률 · 당첨가점 결과`;
  const excerpt = valid.length > 0
    ? `지난주(${lastWeekStart} ~ ${lastWeekEnd}) 마감된 아파트 청약 경쟁률과 당첨가점을 정리했습니다. ${valid.length}개 단지 결과를 확인하세요.`
    : `지난주(${lastWeekStart} ~ ${lastWeekEnd}) 마감된 청약 경쟁률 집계 결과입니다.`;

  const aiPrompt = valid.length > 0 ? buildAiPrompt(valid, lastWeekStart, lastWeekEnd) : "";

  const aiSummary = aiPrompt ? await generateMarketSummary(aiPrompt) : "";
  const content = buildContent(year, month, weekOfMonth, lastWeekStart, lastWeekEnd, valid, aiSummary);
  const metaTitle = `${year}년 ${month}월 ${weekOfMonth}주차 아파트 청약 경쟁률 당첨가점`;
  const metaDescription = `${lastWeekStart} ~ ${lastWeekEnd} 마감 아파트 청약 ${valid.length}개 단지. 1순위 경쟁률과 당첨가점(최저·평균·최고)을 한눈에 정리했습니다.`;
  const tagNames = ["청약", "청약경쟁률", "당첨가점", `${year}년 ${month}월 청약`];
  const slug = `cheongyak-cmpet-${mondayStr}`;

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

  await prisma.post.upsert({
    where: { slug },
    update: { title, excerpt, content, published: true, publishedAt: new Date(), metaTitle, metaDescription, categoryId: category.id, tags: { deleteMany: {}, create: tags.map((t) => ({ tagId: t.id })) } },
    create: { title, slug, excerpt, content, published: true, publishedAt: new Date(), authorId: admin.id, metaTitle, metaDescription, categoryId: category.id, tags: { create: tags.map((t) => ({ tagId: t.id })) } },
  });

  revalidatePath("/");
  revalidatePath("/posts");
  revalidatePath(`/posts/${slug}`);
  revalidatePath(`/categories/${category.slug}`);
  for (const tag of tags) revalidatePath(`/tags/${tag.slug}`);
  revalidatePath("/sitemap.xml");

  return NextResponse.json({ ok: true, lastWeekStart, lastWeekEnd, closedLastWeek: closedLastWeek.length, withData: valid.length, slug });
}

type ValidEntry = {
  listing: { houseNm: string; subscrptAreaCodeNm: string; houseDtlSecdNm: string };
  cmpetRows: CmpetRow[];
  scoreRows: ScoreRow[];
};

function buildAiPrompt(valid: ValidEntry[], weekStart: string, weekEnd: string): string {
  // 전체 집계
  const totalUnits = valid.reduce((sum, { cmpetRows }) => {
    const types = [...new Set(cmpetRows.map((r) => r.houseTy))];
    return sum + types.reduce((s, ty) => {
      const r = cmpetRows.find((x) => x.houseTy === ty);
      return s + (r?.suplyHshldco ?? 0);
    }, 0);
  }, 0);

  const rank1LocalRows = valid.flatMap(({ cmpetRows }) =>
    cmpetRows.filter((r) => r.subscrptRankCode === 1 && r.resideSecd === "01")
  );
  const midalCount = rank1LocalRows.filter((r) =>
    r.cmpetRate.includes("△") || r.cmpetRate.startsWith("(") || parseFloat(r.cmpetRate) === 0
  ).length;
  const allRates = rank1LocalRows
    .map((r) => parseFloat(r.cmpetRate))
    .filter((n) => !isNaN(n) && n > 0);
  const avgRate = allRates.length ? allRates.reduce((a, b) => a + b, 0) / allRates.length : 0;
  const maxRate = allRates.length ? Math.max(...allRates) : 0;
  const over10 = allRates.filter((n) => n >= 10).length;

  const allScores = valid.flatMap(({ scoreRows }) =>
    scoreRows.map((r) => Number(r.avrgScore) || 0).filter((n) => n > 0)
  );
  const avgScore = allScores.length ? allScores.reduce((a, b) => a + b, 0) / allScores.length : 0;
  const maxScore = valid.flatMap(({ scoreRows }) => scoreRows.map((r) => Number(r.topScore) || 0));
  const highestScore = maxScore.length ? Math.max(...maxScore) : 0;

  // 지역별 분포
  const byRegion = new Map<string, number>();
  for (const { listing } of valid) {
    const r = listing.subscrptAreaCodeNm || "기타";
    byRegion.set(r, (byRegion.get(r) ?? 0) + 1);
  }
  const regionSummary = [...byRegion.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([r, n]) => `${r} ${n}건`)
    .join(", ");

  // 단지별 상세
  const details = valid.map(({ listing, cmpetRows, scoreRows }) => {
    const rank1Local = cmpetRows.filter((r) => r.subscrptRankCode === 1 && r.resideSecd === "01");
    const types = [...new Set(cmpetRows.map((r) => r.houseTy))];
    const typeDetails = types.map((ty) => {
      const cr = rank1Local.find((r) => r.houseTy === ty);
      const sr = scoreRows.find((r) => r.houseTy === ty);
      const parts = [`${ty}형`];
      if (cr) parts.push(`경쟁률 ${fmtRate(cr.cmpetRate)} (접수 ${cr.reqCnt.toLocaleString()}건)`);
      if (sr?.avrgScore) parts.push(`평균가점 ${sr.avrgScore}점`);
      if (sr?.topScore) parts.push(`최고가점 ${sr.topScore}점`);
      return parts.join(" / ");
    }).join(" | ");
    return `• ${listing.houseNm} [${listing.subscrptAreaCodeNm}·${listing.houseDtlSecdNm}]: ${typeDetails}`;
  }).join("\n");

  return `[${weekStart} ~ ${weekEnd}] 마감 청약 경쟁률·당첨가점 데이터

## 전체 시장 집계
- 마감 단지: ${valid.length}개 / 총 공급: ${totalUnits.toLocaleString()}세대
- 지역 분포: ${regionSummary}
- 1순위 해당지역 평균경쟁률: ${avgRate.toFixed(1)}:1 / 최고경쟁률: ${maxRate.toFixed(1)}:1
- 10:1 초과 단지: ${over10}개 / 미달 단지: ${midalCount}개
- 당첨가점 평균: ${avgScore.toFixed(1)}점 / 최고가점: ${highestScore}점

## 단지별 상세
${details}

위 데이터를 분석해 이번 주 청약 시장 동향을 써주세요.
- 어느 지역·단지에 수요가 집중됐는지
- 경쟁률 분포로 본 시장 분위기 (과열/침체/양극화 등)
- 가점제 당첨선이 높고 낮은 이유
- 실수요자·투자자가 이번 결과에서 읽어야 할 시사점`;
}

function toPyeong(houseTy: string): number {
  const sqm = parseFloat(houseTy);
  return isNaN(sqm) ? 0 : Math.round(sqm / 3.3058);
}

function fmtRate(rate: string): string {
  if (!rate) return "-";
  const delta = rate.match(/△(\d+)/);
  if (delta) return `잔여 (${delta[1]}세대)`;
  if (rate.includes("△") || rate.startsWith("(")) return "잔여";
  const n = parseFloat(rate);
  if (isNaN(n)) return "잔여";
  return n === 0 ? "잔여" : `${n.toFixed(1)}:1`;
}

function buildContent(
  year: number, month: string, weekOfMonth: number,
  weekStart: string, weekEnd: string,
  listings: { listing: { houseNm: string; subscrptAreaCodeNm: string; hssplyAdres: string; houseDtlSecdNm: string; pblancUrl: string }; cmpetRows: CmpetRow[]; scoreRows: ScoreRow[] }[],
  aiSummary: string
): string {
  const summarySection = aiSummary
    ? `<h3>이번 주 청약 시장 동향</h3>\n${aiSummary}`
    : "";

  if (listings.length === 0) {
    return `<h2>${year}년 ${month}월 ${weekOfMonth}주차 청약 경쟁률·당첨가점</h2>
<p>${weekStart} ~ ${weekEnd} 기간 마감된 청약 데이터가 아직 집계되지 않았습니다. 청약홈에서 직접 확인하세요.</p>
<p><small>출처: 한국부동산원 청약홈 분양정보 조회 서비스</small></p>`;
  }

  const tables = listings.map(({ listing, cmpetRows, scoreRows }) => {
    const types = [...new Set(cmpetRows.map((r) => r.houseTy))];
    const rank1Local = cmpetRows.filter((r) => r.subscrptRankCode === 1 && r.resideSecd === "01");

    const tableRows = types.map((ty) => {
      const cr = rank1Local.find((r) => r.houseTy === ty);
      const sr = scoreRows.find((r) => r.houseTy === ty);
      const suply = cmpetRows.find((r) => r.houseTy === ty)?.suplyHshldco ?? 0;

      const rateStr = cr ? fmtRate(cr.cmpetRate) : "-";
      const isMidal = rateStr.startsWith("잔여") || (cr && cr.reqCnt < suply);

      // 미달이면 가점 의미 없음, 경쟁률 있는데 가점 없으면 집계중
      const scoreDisplay = (label: string | undefined) => {
        if (isMidal) return '<span style="color:var(--muted-foreground);font-size:0.75em">잔여</span>';
        if (!label || label === "0") return '<span style="color:var(--muted-foreground);font-size:0.75em">집계중</span>';
        return label;
      };

      return (
        `<tr>` +
        `<td>${ty} <small style="color:var(--muted-foreground)">(${toPyeong(ty)}평)</small></td>` +
        `<td class="num">${suply.toLocaleString()}세대</td>` +
        `<td class="num">${cr ? cr.reqCnt.toLocaleString() : "-"}</td>` +
        `<td class="num">${isMidal ? `<span style="color:#ef4444;font-weight:600">${rateStr}</span>` : rateStr}</td>` +
        `<td class="num">${scoreDisplay(sr?.lwetScore)}</td>` +
        `<td class="num">${scoreDisplay(sr?.avrgScore)}</td>` +
        `<td class="num">${scoreDisplay(sr?.topScore)}</td>` +
        `</tr>`
      );
    }).join("\n");

    const link = listing.pblancUrl
      ? ` <a href="${listing.pblancUrl}" target="_blank" rel="noopener noreferrer">[청약홈]</a>`
      : "";

    return `<h3>${listing.houseNm}${link}</h3>
<p><small>${listing.subscrptAreaCodeNm} · ${listing.hssplyAdres.slice(0, 40)} · ${listing.houseDtlSecdNm}</small></p>
<table>
<thead>
<tr>
  <th>주택형</th>
  <th class="num">공급세대</th>
  <th class="num">접수건수</th>
  <th class="num">경쟁률<br><small>(1순위·해당지역)</small></th>
  <th class="num">최저가점</th>
  <th class="num">평균가점</th>
  <th class="num">최고가점</th>
</tr>
</thead>
<tbody>
${tableRows}
</tbody>
</table>`;
  }).join("\n\n");

  return `<h2>${year}년 ${month}월 ${weekOfMonth}주차 청약 경쟁률 · 당첨가점 결과</h2>
<p>${weekStart}부터 ${weekEnd}까지 일반공급이 마감된 아파트 <strong>${listings.length}개 단지</strong>의 경쟁률과 당첨가점을 정리했습니다. 1순위 해당지역 기준입니다.</p>
${summarySection ? summarySection + "\n" : ""}${tables}
<p><small>출처: 한국부동산원 청약홈 분양정보 조회 서비스 | 1순위 해당지역 기준 · 집계 시점에 따라 수치가 다를 수 있습니다.</small></p>
<p>정확한 결과는 <a href="https://www.applyhome.co.kr" target="_blank" rel="noopener noreferrer">청약홈(applyhome.co.kr)</a>에서 확인하세요.</p>`;
}
