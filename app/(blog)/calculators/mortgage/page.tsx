import type { Metadata } from "next";
import Link from "next/link";
import Script from "next/script";
import { MortgageCalc } from "@/components/calculators/mortgage-calc";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils/date";

const FAQS = [
  {
    q: "원리금균등과 원금균등 중 어느 게 유리한가요?",
    a: "총 이자 부담은 원금균등이 적습니다. 하지만 초기 납부액이 커서 자금 여유가 필요합니다. 매달 동일한 금액을 내고 싶다면 원리금균등, 이자 절감을 원한다면 원금균등이 유리합니다.",
  },
  {
    q: "DSR 40% 기준으로 최대 대출 가능 금액은?",
    a: "DSR(총부채원리금상환비율) 40% 기준으로 연소득의 40%가 모든 대출의 연간 원리금 합계를 넘으면 안 됩니다. 월소득 500만원이면 월 200만원까지 납부 가능합니다. 단, 2026년 현재 수도권·규제지역은 스트레스 DSR 3단계(스트레스 금리 +3.0%p)가 적용되어 실질 한도가 더 낮아집니다. 이 계산기로 금액을 조정하며 확인해보세요.",
  },
  {
    q: "중도상환수수료는 얼마인가요?",
    a: "은행별·상품별로 다르지만 통상 잔여 원금의 1~2% 수준입니다. 대출 후 3년이 지나면 수수료 없이 중도상환이 가능한 경우가 많습니다. 계약 전 약관을 반드시 확인하세요.",
  },
  {
    q: "변동금리와 고정금리 중 어느 게 유리한가요?",
    a: "금리 상승기에는 고정금리, 하락기에는 변동금리가 유리합니다. 현재 금리가 높은 시기라면 고정금리로 묶어두는 전략이 안전합니다. 리스크 관리 측면에서는 고정금리가 더 예측 가능합니다.",
  },
  {
    q: "대출 후 금리가 내리면 대환대출이 유리한가요?",
    a: "대환대출은 낮은 금리로 갈아타는 방법으로, 금리 차이가 0.5%p 이상이면 중도상환수수료를 감안해도 이익인 경우가 많습니다. 잔여 원금, 남은 대출 기간, 수수료를 모두 계산해보고 결정하세요.",
  },
];

const FAQ_LD = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: FAQS.map(({ q, a }) => ({
    "@type": "Question",
    name: q,
    acceptedAnswer: { "@type": "Answer", text: a },
  })),
};

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  title: "주택담보대출 이자 계산기 — 원리금균등·원금균등·만기일시",
  description: "주담대 월 납부액과 총 이자를 즉시 계산하세요. 원리금균등·원금균등·만기일시 3가지 상환 방식, 연도별 상환 현황 제공.",
  alternates: { canonical: `${siteUrl}/calculators/mortgage` },
  openGraph: {
    title: "주담대 이자 계산기",
    description: "주택담보대출 월 납부액·총이자 즉시 계산 (원리금균등·원금균등·만기일시)",
    url: `${siteUrl}/calculators/mortgage`,
  },
};

export default async function MortgageCalcPage() {
  let recentPosts: { slug: string; title: string; publishedAt: Date | null }[] = [];
  try {
    recentPosts = await prisma.post.findMany({
      where: { published: true, slug: { startsWith: "apt-" } },
      orderBy: { publishedAt: "desc" },
      take: 4,
      select: { slug: true, title: true, publishedAt: true },
    });
  } catch {}

  return (
    <div className="space-y-8">
      <Script id="faq-ld-mortgage" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(FAQ_LD) }} />
      <header className="space-y-2">
        <nav className="text-sm text-muted-foreground">
          <Link href="/calculators" className="hover:underline underline-offset-4">계산기 모음</Link>
          <span className="mx-1.5">→</span>
          <span>주담대 이자 계산기</span>
        </nav>
        <h1 className="text-3xl font-bold tracking-tight">주택담보대출 이자 계산기</h1>
        <p className="text-muted-foreground">대출금액·금리·기간·상환 방식을 선택하면 월 납부액과 총 이자를 계산합니다.</p>
      </header>

      <MortgageCalc />

      <section className="border-t pt-8 space-y-4">
        <h2 className="text-lg font-semibold">상환 방식 비교</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead><tr className="border-b text-muted-foreground text-xs">
              <th className="text-left py-2 pr-4">방식</th>
              <th className="text-left py-2 pr-4">특징</th>
              <th className="text-left py-2">적합한 경우</th>
            </tr></thead>
            <tbody className="divide-y">
              <tr>
                <td className="py-2 pr-4 font-medium">원리금균등</td>
                <td className="py-2 pr-4 text-muted-foreground">매달 동일 금액. 초기엔 이자 비중 높음</td>
                <td className="py-2 text-muted-foreground">일정한 현금흐름 선호</td>
              </tr>
              <tr>
                <td className="py-2 pr-4 font-medium">원금균등</td>
                <td className="py-2 pr-4 text-muted-foreground">초기 납부액이 크고 점차 줄어듦</td>
                <td className="py-2 text-muted-foreground">초기 소득이 높은 경우, 총 이자 절감</td>
              </tr>
              <tr>
                <td className="py-2 pr-4 font-medium">만기일시</td>
                <td className="py-2 pr-4 text-muted-foreground">매달 이자만, 만기에 원금 일시 상환</td>
                <td className="py-2 text-muted-foreground">단기 자금 운용, 재투자 수익 기대 시</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="text-xs text-muted-foreground">원금균등 방식은 원리금균등 대비 총 이자가 적지만, 초기 상환 부담이 큽니다.</p>
      </section>

      {recentPosts.length > 0 && (
        <section className="border-t pt-8 space-y-4">
          <h2 className="text-lg font-semibold">최신 아파트 거래 정보</h2>
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
