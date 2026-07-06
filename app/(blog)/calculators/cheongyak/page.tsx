import type { Metadata } from "next";
import Link from "next/link";
import Script from "next/script";
import { CheongyakCalc } from "@/components/calculators/cheongyak-calc";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils/date";

const FAQS = [
  {
    q: "부양가족에 배우자도 포함되나요?",
    a: "네, 배우자는 부양가족에 포함됩니다. 본인을 제외하고 동일 세대원으로 등재된 배우자·직계존속(부모·조부모)·직계비속(자녀·손자녀)이 해당됩니다.",
  },
  {
    q: "무주택 기간은 어떻게 계산하나요?",
    a: "만 30세 이후부터 입주자모집공고일까지를 기준으로 합니다. 만 30세 이전에 혼인했다면 혼인신고일부터 산정합니다. 주택을 처분한 경우 소유권 이전일부터 다시 산정합니다.",
  },
  {
    q: "서울 아파트 청약 당첨에 필요한 가점은?",
    a: "서울 인기 단지는 보통 70점 이상이 커트라인입니다. 2026년 기준 북서울자이 폴라리스 59㎡의 최저 당첨 가점은 74점이었습니다. 비인기 단지나 추첨제 물량은 더 낮을 수 있습니다.",
  },
  {
    q: "청약통장 가입 기간은 어떻게 확인하나요?",
    a: "청약홈(applyhome.co.kr)에 로그인 후 '청약통장 정보'에서 가입일을 확인할 수 있습니다. 주택청약종합저축 기준으로 산정합니다.",
  },
  {
    q: "주택 보유 중 청약 신청이 가능한가요?",
    a: "1순위 청약은 세대원 전원이 무주택자여야 합니다. 주택 보유 시 2순위 청약은 가능하지만, 가점제 무주택 기간은 0점이 적용됩니다.",
  },
];

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  title: "청약 가점 계산기 — 무주택기간·부양가족·청약통장",
  description: "청약 가점을 즉시 계산하세요. 무주택 기간(32점)·부양가족 수(35점)·청약통장 가입 기간(17점) 입력, 만점 84점 기준.",
  alternates: { canonical: `${siteUrl}/calculators/cheongyak` },
  openGraph: {
    title: "청약 가점 계산기",
    description: "무주택기간·부양가족·청약통장 가입 기간으로 청약 가점 즉시 계산",
    url: `${siteUrl}/calculators/cheongyak`,
  },
};

const FAQ_LD = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: FAQS.map(({ q, a }) => ({
    "@type": "Question",
    name: q,
    acceptedAnswer: { "@type": "Answer", text: a },
  })),
};

export default async function CheongyakCalcPage() {
  let recentPosts: { slug: string; title: string; publishedAt: Date | null }[] = [];
  try {
    recentPosts = await prisma.post.findMany({
      where: { published: true, slug: { startsWith: "apt-top10-" } },
      orderBy: { publishedAt: "desc" },
      take: 4,
      select: { slug: true, title: true, publishedAt: true },
    });
  } catch {}

  return (
    <div className="space-y-8">
      <Script id="faq-ld-cheongyak" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(FAQ_LD) }} />
      <header className="space-y-2">
        <nav className="text-sm text-muted-foreground">
          <Link href="/calculators" className="hover:underline underline-offset-4">계산기 모음</Link>
          <span className="mx-1.5">→</span>
          <span>청약 가점 계산기</span>
        </nav>
        <h1 className="text-3xl font-bold tracking-tight">청약 가점 계산기</h1>
        <p className="text-muted-foreground">무주택 기간·부양가족 수·청약통장 가입 기간을 선택하면 총 가점을 계산합니다. (만점 84점)</p>
      </header>

      <CheongyakCalc />

      <section className="border-t pt-8 space-y-4">
        <h2 className="text-lg font-semibold">청약 가점 항목별 배점</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b text-left">
                <th className="py-2 pr-4 text-muted-foreground font-medium">항목</th>
                <th className="py-2 pr-4 text-muted-foreground font-medium">최저점</th>
                <th className="py-2 text-muted-foreground font-medium">최고점</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              <tr><td className="py-2 pr-4">무주택 기간</td><td className="py-2 pr-4">2점 (1년 미만)</td><td className="py-2">32점 (15년 이상)</td></tr>
              <tr><td className="py-2 pr-4">부양가족 수</td><td className="py-2 pr-4">5점 (0명)</td><td className="py-2">35점 (6명 이상)</td></tr>
              <tr><td className="py-2 pr-4">청약통장 가입 기간</td><td className="py-2 pr-4">1점 (6개월 미만)</td><td className="py-2">17점 (15년 이상)</td></tr>
              <tr className="font-semibold"><td className="py-2 pr-4">합계</td><td className="py-2 pr-4">8점</td><td className="py-2">84점</td></tr>
            </tbody>
          </table>
        </div>
        <p className="text-xs text-muted-foreground">현재 주택을 보유한 경우 무주택 기간 0점 적용. 주택 처분 후 무주택 기간은 처분일부터 산정.</p>
      </section>

      {recentPosts.length > 0 && (
        <section className="border-t pt-8 space-y-4">
          <h2 className="text-lg font-semibold">최신 청약 경쟁률 결과</h2>
          <ul className="divide-y border rounded-lg overflow-hidden">
            {recentPosts.map((p) => (
              <li key={p.slug}>
                <Link
                  href={`/posts/${encodeURIComponent(p.slug)}`}
                  className="flex items-center justify-between px-4 py-3 hover:bg-muted/50 transition-colors"
                >
                  <span className="text-sm font-medium line-clamp-1">{p.title}</span>
                  {p.publishedAt && <span className="shrink-0 ml-4 text-xs text-muted-foreground">{formatDate(p.publishedAt)}</span>}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="border-t pt-8 space-y-4">
        <h2 className="text-lg font-semibold">자주 묻는 질문</h2>
        <div className="border rounded-lg overflow-hidden divide-y">
          {FAQS.map(({ q, a }) => (
            <details key={q} className="group">
              <summary className="flex justify-between items-center px-5 py-4 cursor-pointer font-medium text-sm list-none select-none hover:bg-muted/50">
                {q}
                <span className="shrink-0 ml-4 text-muted-foreground transition-transform duration-200 group-open:rotate-180">▾</span>
              </summary>
              <div className="px-5 pb-4 text-sm text-muted-foreground leading-relaxed">{a}</div>
            </details>
          ))}
        </div>
      </section>
    </div>
  );
}
