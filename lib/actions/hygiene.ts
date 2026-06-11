"use server";

import { prisma } from "@/lib/prisma";
import { fetchHygienePage, rowToRecord, PAGE_SIZE } from "@/lib/hygiene-api";
import Anthropic from "@anthropic-ai/sdk";
import { requireAuth } from "./post";

// 관리자가 수동으로 특정 기간 데이터 동기화
export async function syncHygieneData(daysBack = 30) {
  await requireAuth();  // ADMIN 체크

  const apiKey = process.env.FOOD_SAFETY_API_KEY;
  if (!apiKey) return { error: "FOOD_SAFETY_API_KEY not set" };

  const since = new Date();
  since.setDate(since.getDate() - daysBack);
  const changedAfter = since.toISOString().slice(0, 10).replace(/-/g, "");

  try {
    let upserted = 0;
    let total = Infinity;
    let page = 0;

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

      // Vercel 함수 타임아웃 대비: 3페이지(1500건) 이상이면 일단 중단
      if (page >= 3) break;
    }

    return { ok: true, total, upserted };
  } catch (e) {
    console.error("[syncHygieneData]", e);
    return { error: String(e) };
  }
}

// 선택한 지역/조건 기반으로 AI 블로그 글 초안 생성
export async function generateHygienePost(siDo: string, siGunGu?: string) {
  const authorId = await requireAuth();

  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  if (!anthropicKey) return { error: "ANTHROPIC_API_KEY not set" };

  const where = {
    siDo,
    ...(siGunGu ? { siGunGu } : {}),
    bizStatus: { not: "폐업" },
  };

  const [gradeStats, topBizzes] = await Promise.all([
    prisma.hygieneGrade.groupBy({
      by: ["grade"],
      where,
      _count: { grade: true },
      orderBy: { _count: { grade: "desc" } },
    }),
    prisma.hygieneGrade.findMany({
      where: { ...where, grade: "매우우수" },
      orderBy: { assignedAt: "desc" },
      take: 20,
      select: { bizName: true, industryName: true, address: true, assignedAt: true },
    }),
  ]);

  const location = siGunGu ? `${siDo} ${siGunGu}` : siDo;
  const statsText = gradeStats
    .map((s) => `${s.grade}: ${s._count.grade}개소`)
    .join(", ");
  const bizList = topBizzes
    .map((b) => `- ${b.bizName} (${b.industryName}) / ${b.address}`)
    .join("\n");

  if (topBizzes.length === 0) {
    return { error: `${location}에 해당하는 위생등급 데이터가 없습니다.` };
  }

  const prompt = `당신은 맛집 정보와 위생 안전을 다루는 블로그 작가입니다.
아래 공공데이터(식품의약품안전처 위생등급 지정현황)를 바탕으로 SEO에 최적화된 블로그 글을 HTML로 작성해주세요.

## 지역: ${location}
## 위생등급 현황: ${statsText}
## 매우우수 업소 목록:
${bizList}

## 요구사항
- 제목(title): 검색에 잘 걸리는 제목 1개
- 발췌(excerpt): 160자 이내 메타 설명
- 본문(content): HTML 형식, h2/h3/p/ul 태그 사용
- 본문 구성: 1) 지역 위생등급 개요, 2) 등급별 현황 통계, 3) 매우우수 업소 소개, 4) 마무리
- 자연스러운 한국어, 독자 친화적 문체
- 특수문자나 마크다운 없이 순수 HTML만

## 응답 형식 (JSON):
{
  "title": "...",
  "excerpt": "...",
  "content": "..."
}`;

  try {
    const client = new Anthropic({ apiKey: anthropicKey });
    const message = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 4096,
      messages: [{ role: "user", content: prompt }],
    });

    const text = message.content[0].type === "text" ? message.content[0].text : "";
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return { error: "AI 응답 파싱 실패" };

    const { title, excerpt, content } = JSON.parse(jsonMatch[0]);

    const slug = `hygiene-${siDo.replace(/\s+/g, "-")}-${siGunGu ?? "all"}-${Date.now()}`
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, "-");

    const post = await prisma.post.create({
      data: {
        title,
        slug,
        excerpt,
        content,
        published: false,
        authorId,
      },
    });

    return { ok: true, postId: post.id, slug: post.slug };
  } catch (e) {
    console.error("[generateHygienePost]", e);
    return { error: String(e) };
  }
}
