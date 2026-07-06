import type { Metadata } from "next";
import Link from "next/link";
import Script from "next/script";
import { JungaeCalc } from "@/components/calculators/jungae-calc";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils/date";

const FAQS = [
  {
    q: "중개수수료는 깎을 수 있나요?",
    a: "네, 법정 요율은 상한선입니다. 중개사와 협의해 낮출 수 있으며, 실제로 많은 경우 상한 요율보다 낮은 수수료를 지불합니다.",
  },
  {
    q: "월세 거래금액은 어떻게 계산하나요?",
    a: "보증금 + (월세 × 100)으로 계산합니다. 이 금액이 5천만원을 초과하면 보증금 + (월세 × 70)으로 재계산합니다. 예를 들어 보증금 1,000만원에 월세 80만원이면 9,000만원 초과이므로 1,000 + 80×70 = 6,600만원을 거래금액으로 적용합니다.",
  },
  {
    q: "중개수수료에 VAT가 포함인가요?",
    a: "법정 요율에는 VAT(부가가치세 10%)가 포함되지 않습니다. 최종 납부액은 수수료 × 1.1입니다. 간이과세자 중개사는 VAT 청구를 하지 않을 수 있습니다.",
  },
  {
    q: "양측 모두 중개사를 쓸 때 수수료는?",
    a: "공동중개(양측 각각 중개사 사용) 시 매도인과 매수인이 각자 자신의 중개사에게 수수료를 납부합니다. 각각 상한 요율 이내로 계산하면 됩니다.",
  },
  {
    q: "분양권 매매 중개수수료는 어떻게 계산하나요?",
    a: "분양권은 주택이 아닌 권리이므로 공인중개사법상 중개 대상물이 아닙니다. 따라서 법정 요율이 적용되지 않고 당사자 간 합의로 결정됩니다.",
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
  title: "부동산 중개수수료 계산기 — 매매·전세·월세",
  description: "아파트 매매·전세·월세 공인중개사 수수료를 즉시 계산하세요. 2021년 10월 개정 상한 요율 기준, VAT 포함 금액까지 안내.",
  alternates: { canonical: `${siteUrl}/calculators/jungae` },
  openGraph: {
    title: "부동산 중개수수료 계산기",
    description: "매매·전세·월세 공인중개사 상한 수수료 즉시 계산 (2021년 개정 기준)",
    url: `${siteUrl}/calculators/jungae`,
  },
};

export default async function JungaeCalcPage() {
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
      <Script id="faq-ld-jungae" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(FAQ_LD) }} />
      <header className="space-y-2">
        <nav className="text-sm text-muted-foreground">
          <Link href="/calculators" className="hover:underline underline-offset-4">계산기 모음</Link>
          <span className="mx-1.5">→</span>
          <span>중개수수료 계산기</span>
        </nav>
        <h1 className="text-3xl font-bold tracking-tight">부동산 중개수수료 계산기</h1>
        <p className="text-muted-foreground">매매·전세·월세 거래금액을 입력하면 공인중개사 상한 수수료와 VAT 포함 금액을 계산합니다.</p>
      </header>

      <JungaeCalc />

      <section className="border-t pt-8 space-y-4">
        <h2 className="text-lg font-semibold">중개보수 상한 요율표 (2021년 10월 개정)</h2>
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-semibold mb-2">매매</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead><tr className="border-b text-muted-foreground text-xs">
                  <th className="text-left py-2 pr-3">거래금액</th>
                  <th className="text-right py-2 pr-3">상한 요율</th>
                  <th className="text-right py-2">한도액</th>
                </tr></thead>
                <tbody className="divide-y text-sm">
                  <tr><td className="py-1.5 pr-3">5천만원 미만</td><td className="text-right pr-3">0.6%</td><td className="text-right">25만원</td></tr>
                  <tr><td className="py-1.5 pr-3">5천만원 ~ 2억원 미만</td><td className="text-right pr-3">0.5%</td><td className="text-right">80만원</td></tr>
                  <tr><td className="py-1.5 pr-3">2억원 ~ 9억원 미만</td><td className="text-right pr-3">0.4%</td><td className="text-right">—</td></tr>
                  <tr><td className="py-1.5 pr-3">9억원 ~ 12억원 미만</td><td className="text-right pr-3">0.5%</td><td className="text-right">—</td></tr>
                  <tr><td className="py-1.5 pr-3">12억원 ~ 15억원 미만</td><td className="text-right pr-3">0.6%</td><td className="text-right">—</td></tr>
                  <tr><td className="py-1.5 pr-3">15억원 이상</td><td className="text-right pr-3">0.7%</td><td className="text-right">—</td></tr>
                </tbody>
              </table>
            </div>
          </div>
          <div>
            <h3 className="text-sm font-semibold mb-2">전·월세</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead><tr className="border-b text-muted-foreground text-xs">
                  <th className="text-left py-2 pr-3">거래금액</th>
                  <th className="text-right py-2 pr-3">상한 요율</th>
                  <th className="text-right py-2">한도액</th>
                </tr></thead>
                <tbody className="divide-y text-sm">
                  <tr><td className="py-1.5 pr-3">5천만원 미만</td><td className="text-right pr-3">0.5%</td><td className="text-right">20만원</td></tr>
                  <tr><td className="py-1.5 pr-3">5천만원 ~ 1억원 미만</td><td className="text-right pr-3">0.4%</td><td className="text-right">30만원</td></tr>
                  <tr><td className="py-1.5 pr-3">1억원 ~ 6억원 미만</td><td className="text-right pr-3">0.3%</td><td className="text-right">—</td></tr>
                  <tr><td className="py-1.5 pr-3">6억원 ~ 12억원 미만</td><td className="text-right pr-3">0.4%</td><td className="text-right">—</td></tr>
                  <tr><td className="py-1.5 pr-3">12억원 ~ 15억원 미만</td><td className="text-right pr-3">0.5%</td><td className="text-right">—</td></tr>
                  <tr><td className="py-1.5 pr-3">15억원 이상</td><td className="text-right pr-3">0.6%</td><td className="text-right">—</td></tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
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
