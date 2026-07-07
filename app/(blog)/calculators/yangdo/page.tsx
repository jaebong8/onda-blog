import type { Metadata } from "next";
import Link from "next/link";
import Script from "next/script";
import { YangdoCalc } from "@/components/calculators/yangdo-calc";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils/date";

const FAQS = [
  {
    q: "1세대 1주택 비과세 요건이 무엇인가요?",
    a: "보유 기간 2년 이상(조정대상지역은 거주 기간 2년 이상 추가), 양도가액 12억 원 이하여야 합니다. 2017년 8월 2일 이후 조정대상지역으로 지정된 지역에서 취득한 주택은 거주 2년 요건이 적용됩니다.",
  },
  {
    q: "고가주택(12억 초과) 1주택 비과세는 어떻게 계산하나요?",
    a: "양도가액이 12억 원을 초과하면 비과세 요건을 충족하더라도 12억 초과분 비율에 해당하는 양도차익만 과세됩니다. 과세대상 양도차익 = 전체 양도차익 × (양도가액 - 12억) ÷ 양도가액 으로 계산합니다.",
  },
  {
    q: "장기보유특별공제는 어떻게 적용되나요?",
    a: "일반: 보유 3년부터 2%/년(최대 30%). 1세대 1주택(거주 2년 이상): 보유 4%/년(최대 40%) + 거주 4%/년(최대 40%), 합산 최대 80%입니다. 단기(2년 미만) 보유 시에는 장기보유특별공제가 적용되지 않습니다.",
  },
  {
    q: "단기 보유 시 세율은 얼마인가요?",
    a: "보유 1년 미만이면 70%, 보유 1~2년이면 60%의 단일 세율이 적용됩니다. 이 경우 장기보유특별공제도 없으므로 세 부담이 매우 큽니다.",
  },
  {
    q: "필요경비로 인정되는 항목이 무엇인가요?",
    a: "취득세, 법무사 수수료, 중개보수(양도·취득 시 모두), 인테리어·리모델링 비용(자본적 지출만 해당), 장기수선충당금, 소송비용 등이 포함됩니다. 수리·유지비(도배, 장판 교체 등 수익적 지출)는 원칙적으로 제외됩니다.",
  },
  {
    q: "다주택자 중과세율은 현재 적용되나요?",
    a: "조정대상지역 내 2주택 +20%p, 3주택 이상 +30%p 중과세율은 2022년 5월 10일부터 2026년 5월 9일까지 한시 배제되어 기본세율이 적용됐습니다. 2026년 5월 10일 이후 양도분부터는 추가 연장이 없는 한 중과가 다시 적용될 수 있으므로 반드시 국세청에 확인하세요.",
  },
  {
    q: "주택을 상가로 바꾸고 팔면 비과세가 되나요?",
    a: "2025년 2월 28일 이후 매매계약을 체결해 주택에서 상가 등 주택 외 용도로 변경한 경우, 1주택 여부는 양도일이 아닌 매매계약일을 기준으로 판단합니다(소득세법 시행령 §154①). 계약 시점에 1주택 비과세 요건을 충족했다면 비과세가 적용될 수 있습니다.",
  },
  {
    q: "양도소득세 신고·납부 기한은?",
    a: "잔금 지급일(또는 등기접수일 중 빠른 날)이 속하는 달의 말일로부터 2개월 이내에 예정신고·납부해야 합니다. 무신고 시 납부세액의 20% 무신고가산세와 1일 0.022% 납부지연가산세가 부과됩니다. 납부세액이 1천만원 초과 시 최대 2개월 분할납부 가능합니다.",
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
  title: "양도소득세 계산기 — 1주택 비과세·장기보유특별공제 포함",
  description: "아파트·주택 양도 시 납부할 양도소득세를 계산하세요. 1세대 1주택 비과세, 고가주택 12억 초과분, 장기보유특별공제, 단기세율까지 반영합니다.",
  alternates: { canonical: `${siteUrl}/calculators/yangdo` },
  openGraph: {
    title: "양도소득세 계산기",
    description: "1주택 비과세·고가주택·장기보유특별공제·단기세율 적용 양도소득세 즉시 계산",
    url: `${siteUrl}/calculators/yangdo`,
  },
};

export default async function YangdoCalcPage() {
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
      <Script id="faq-ld-yangdo" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(FAQ_LD) }} />
      <header className="space-y-2">
        <nav className="text-sm text-muted-foreground">
          <Link href="/calculators" className="hover:underline underline-offset-4">계산기 모음</Link>
          <span className="mx-1.5">→</span>
          <span>양도소득세 계산기</span>
        </nav>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">양도소득세 계산기</h1>
        <p className="text-muted-foreground">아파트·주택 양도 시 납부할 양도소득세와 지방소득세 합계를 계산합니다. 1세대 1주택 비과세, 장기보유특별공제를 자동으로 반영합니다.</p>
      </header>

      <YangdoCalc />

      <section className="border-t pt-8 space-y-4">
        <h2 className="text-lg font-semibold">양도소득세 세율 요약</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead><tr className="border-b text-muted-foreground text-xs">
              <th className="text-left py-2 pr-4">구분</th>
              <th className="text-right py-2 pr-4">세율</th>
              <th className="text-right py-2">비고</th>
            </tr></thead>
            <tbody className="divide-y">
              <tr><td className="py-2 pr-4">보유 1년 미만</td><td className="text-right pr-4">70%</td><td className="text-right text-muted-foreground">단기</td></tr>
              <tr><td className="py-2 pr-4">보유 1~2년 미만</td><td className="text-right pr-4">60%</td><td className="text-right text-muted-foreground">단기</td></tr>
              <tr><td className="py-2 pr-4">기본세율 (2년+)</td><td className="text-right pr-4">6 ~ 45%</td><td className="text-right text-muted-foreground">8 구간 누진</td></tr>
              <tr><td className="py-2 pr-4">1주택 비과세</td><td className="text-right pr-4">0%</td><td className="text-right text-muted-foreground">12억 이하</td></tr>
              <tr><td className="py-2 pr-4">지방소득세</td><td className="text-right pr-4">양도소득세 × 10%</td><td className="text-right text-muted-foreground">별도 납부</td></tr>
            </tbody>
          </table>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead><tr className="border-b text-muted-foreground text-xs">
              <th className="text-left py-2 pr-4">과세표준</th>
              <th className="text-right py-2 pr-4">세율</th>
              <th className="text-right py-2">누진공제</th>
            </tr></thead>
            <tbody className="divide-y">
              <tr><td className="py-2 pr-4">1,400만원 이하</td><td className="text-right pr-4">6%</td><td className="text-right text-muted-foreground">—</td></tr>
              <tr><td className="py-2 pr-4">5,000만원 이하</td><td className="text-right pr-4">15%</td><td className="text-right text-muted-foreground">126만원</td></tr>
              <tr><td className="py-2 pr-4">8,800만원 이하</td><td className="text-right pr-4">24%</td><td className="text-right text-muted-foreground">576만원</td></tr>
              <tr><td className="py-2 pr-4">1억 5천만원 이하</td><td className="text-right pr-4">35%</td><td className="text-right text-muted-foreground">1,544만원</td></tr>
              <tr><td className="py-2 pr-4">3억원 이하</td><td className="text-right pr-4">38%</td><td className="text-right text-muted-foreground">1,994만원</td></tr>
              <tr><td className="py-2 pr-4">5억원 이하</td><td className="text-right pr-4">40%</td><td className="text-right text-muted-foreground">2,594만원</td></tr>
              <tr><td className="py-2 pr-4">10억원 이하</td><td className="text-right pr-4">42%</td><td className="text-right text-muted-foreground">3,594만원</td></tr>
              <tr><td className="py-2 pr-4">10억원 초과</td><td className="text-right pr-4">45%</td><td className="text-right text-muted-foreground">6,594만원</td></tr>
            </tbody>
          </table>
        </div>
        <div className="rounded-lg bg-muted/50 p-4 text-sm space-y-1 text-muted-foreground">
          <p>• 기본공제 연 250만원이 과세표준에서 차감됩니다.</p>
          <p>• 1세대 1주택(거주 2년+) 장기보유특별공제: 보유·거주 각 4%/년, 합산 최대 80%</p>
          <p>• 일반 장기보유특별공제: 보유 3년부터 2%/년, 최대 30%</p>
          <p>• 다주택 조정지역 중과(+20~30%p)는 현재 한시 배제 중</p>
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
