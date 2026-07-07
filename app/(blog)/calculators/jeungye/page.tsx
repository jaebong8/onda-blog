import type { Metadata } from "next";
import Link from "next/link";
import Script from "next/script";
import { JeungyeCalc } from "@/components/calculators/jeungye-calc";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils/date";

const FAQS = [
  {
    q: "증여세 신고기한과 납부기한은 언제인가요?",
    a: "증여일이 속하는 달의 말일로부터 3개월 이내에 수증자(받는 사람) 주소지 관할 세무서에 신고·납부해야 합니다. 신고기한 내 자진신고하면 산출세액의 3%를 신고세액공제로 받을 수 있습니다. 기한을 넘기면 무신고 가산세 20%와 납부지연 가산세(1일 0.022%)가 부과됩니다.",
  },
  {
    q: "증여재산공제는 어떻게 적용되나요?",
    a: "증여재산공제는 동일인으로부터 10년 동안 받은 증여액을 합산해 한 번만 적용합니다. 배우자 6억원, 직계존속(부모·조부모) 5천만원(미성년자 2천만원), 직계비속(자녀) 5천만원, 기타 친족(6촌 이내 혈족·4촌 이내 인척) 1천만원입니다. 직계존속 공제는 부모 합산으로 5천만원이며, 어머니와 아버지로부터 각각 5천만원씩 공제받는 것이 아닙니다.",
  },
  {
    q: "부동산 증여 시 취득세도 내야 하나요?",
    a: "네. 부동산을 증여받으면 증여세와 별도로 취득세(일반 3.5%)도 납부해야 합니다. 조정대상지역 내 3억원 이상 주택을 증여받는 경우 취득세율이 12%로 높아집니다. 증여세 계산 시 취득세는 필요경비로 공제되지 않습니다.",
  },
  {
    q: "세대생략 증여란 무엇인가요?",
    a: "조부모가 자녀(부모)를 건너뛰고 손자·손녀에게 바로 증여하는 경우를 세대생략 증여라 합니다. 이 경우 절세 효과가 크다고 보아 산출세액의 30%를 할증합니다. 수증자가 미성년자이고 증여재산가액이 20억원을 초과하면 40%를 할증합니다.",
  },
  {
    q: "부담부증여란 무엇인가요?",
    a: "증여하는 재산에 붙어 있는 채무(임대보증금, 근저당 등)를 수증자가 인수하는 조건으로 증여하는 방식입니다. 채무 인수 부분은 유상 양도로 보아 증여자에게 양도소득세가 과세되고, 나머지 부분만 증여세 과세 대상이 됩니다. 증여가액에서 채무액을 뺀 금액이 증여세 과세가액이 됩니다.",
  },
  {
    q: "배우자에게 증여하면 왜 유리한가요?",
    a: "배우자 증여재산공제는 6억원으로 직계존속(5천만원)보다 훨씬 큽니다. 예를 들어 공시가격이 높아진 아파트를 배우자에게 증여하면 6억까지는 증여세가 없고, 이후 배우자가 양도할 때 취득가액이 증여 시점 시가로 높아지므로 양도소득세를 줄일 수 있습니다. 단, 이월과세(증여 후 5년 이내 양도 시 증여자 취득가액 적용) 규정에 주의해야 합니다.",
  },
  {
    q: "증여 후 양도하면 이월과세가 적용되나요?",
    a: "배우자 또는 직계존비속에게 증여 후 5년 이내에 양도하면 증여 당시가 아닌 증여자(원래 소유자)의 취득가액을 기준으로 양도소득세를 계산하는 이월과세가 적용됩니다. 절세 목적으로 증여한 뒤 단기간에 양도하는 경우 이 규정으로 세금 혜택이 사라질 수 있으니 주의가 필요합니다.",
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
  title: "증여세 계산기 — 부동산·현금 증여세 즉시 계산",
  description: "부동산·현금 증여 시 납부할 증여세를 계산하세요. 증여재산공제(배우자 6억·직계존속 5천만), 세대생략 할증, 신고세액공제 3% 자동 반영.",
  alternates: { canonical: `${siteUrl}/calculators/jeungye` },
  openGraph: {
    title: "증여세 계산기",
    description: "증여재산공제·세대생략 할증·신고세액공제 반영 증여세 즉시 계산",
    url: `${siteUrl}/calculators/jeungye`,
  },
};

export default async function JeungyeCalcPage() {
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
      <Script id="faq-ld-jeungye" type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(FAQ_LD) }} />

      <header className="space-y-2">
        <nav className="text-sm text-muted-foreground">
          <Link href="/calculators" className="hover:underline underline-offset-4">계산기 모음</Link>
          <span className="mx-1.5">→</span>
          <span>증여세 계산기</span>
        </nav>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">증여세 계산기</h1>
        <p className="text-muted-foreground">부동산·현금 증여 시 납부할 증여세를 계산합니다. 증여재산공제와 세대생략 할증을 자동으로 반영합니다.</p>
        <p className="text-xs text-muted-foreground">※ 창업자금·가업승계 주식 등 특례세율 적용 대상은 이 계산기의 범위 밖입니다.</p>
      </header>

      <JeungyeCalc />

      <section className="border-t pt-8 space-y-4">
        <h2 className="text-lg font-semibold">증여세율 및 공제 요약</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead><tr className="border-b text-muted-foreground text-xs">
              <th className="text-left py-2 pr-4">과세표준</th>
              <th className="text-right py-2 pr-4">세율</th>
              <th className="text-right py-2">누진공제</th>
            </tr></thead>
            <tbody className="divide-y">
              <tr><td className="py-2 pr-4">1억원 이하</td><td className="text-right pr-4">10%</td><td className="text-right text-muted-foreground">—</td></tr>
              <tr><td className="py-2 pr-4">5억원 이하</td><td className="text-right pr-4">20%</td><td className="text-right text-muted-foreground">1,000만원</td></tr>
              <tr><td className="py-2 pr-4">10억원 이하</td><td className="text-right pr-4">30%</td><td className="text-right text-muted-foreground">6,000만원</td></tr>
              <tr><td className="py-2 pr-4">30억원 이하</td><td className="text-right pr-4">40%</td><td className="text-right text-muted-foreground">1억 6,000만원</td></tr>
              <tr><td className="py-2 pr-4">30억원 초과</td><td className="text-right pr-4">50%</td><td className="text-right text-muted-foreground">4억 6,000만원</td></tr>
            </tbody>
          </table>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead><tr className="border-b text-muted-foreground text-xs">
              <th className="text-left py-2 pr-4">관계</th>
              <th className="text-right py-2">증여재산공제 (10년 합산)</th>
            </tr></thead>
            <tbody className="divide-y">
              <tr><td className="py-2 pr-4">배우자</td><td className="text-right font-medium">6억원</td></tr>
              <tr><td className="py-2 pr-4">직계존속 (부모·조부모 → 성년 자녀·손자)</td><td className="text-right font-medium">5천만원</td></tr>
              <tr><td className="py-2 pr-4">직계존속 → 미성년자</td><td className="text-right font-medium">2천만원</td></tr>
              <tr><td className="py-2 pr-4">직계비속 (자녀·손자 → 부모·조부모)</td><td className="text-right font-medium">5천만원</td></tr>
              <tr><td className="py-2 pr-4">기타 친족 (6촌 이내 혈족, 4촌 이내 인척)</td><td className="text-right font-medium">1천만원</td></tr>
            </tbody>
          </table>
        </div>
        <div className="rounded-lg bg-muted/50 p-4 text-sm space-y-1 text-muted-foreground">
          <p>• 세대생략 증여(조부모→손자 등): 산출세액 30% 할증, 수증자 미성년 & 20억 초과 시 40%</p>
          <p>• 신고기한 내 자진신고 시 산출세액의 3% 신고세액공제</p>
          <p>• 부동산 증여 시 취득세(일반 3.5%, 조정대상지역 12%) 별도</p>
          <p>• 배우자·직계존비속 간 증여 후 5년 이내 양도 시 이월과세 주의</p>
        </div>
      </section>

      {recentPosts.length > 0 && (
        <section className="border-t pt-8 space-y-4">
          <h2 className="text-lg font-semibold">최신 아파트 거래 정보</h2>
          <ul className="divide-y border rounded-lg overflow-hidden">
            {recentPosts.map(p => (
              <li key={p.slug}>
                <Link href={`/posts/${encodeURIComponent(p.slug)}`}
                  className="flex items-center justify-between px-4 py-3 hover:bg-muted/50 transition-colors">
                  <span className="text-sm font-medium line-clamp-1">{p.title}</span>
                  {p.publishedAt && (
                    <span className="shrink-0 ml-4 text-xs text-muted-foreground">{formatDate(p.publishedAt)}</span>
                  )}
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
