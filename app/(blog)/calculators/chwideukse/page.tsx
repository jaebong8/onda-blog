import type { Metadata } from "next";
import Link from "next/link";
import Script from "next/script";
import { ChwideukseCalc } from "@/components/calculators/chwideukse-calc";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils/date";

const FAQS = [
  {
    q: "취득세는 언제 납부하나요?",
    a: "취득일(잔금 지급일 또는 소유권 이전 등기일 중 빠른 날)로부터 60일 이내에 납부해야 합니다. 상속은 6개월, 증여는 60일 이내입니다. 기한 초과 시 가산세가 부과됩니다.",
  },
  {
    q: "생애 최초 주택 구입 시 취득세 감면이 있나요?",
    a: "12억 원 이하 주택 취득 시 소득 제한 없이 취득세를 200만 원 한도로 감면받을 수 있습니다(지방세특례제한법 제36조의3). 본인과 배우자 모두 국내에서 주택을 소유한 사실이 없어야 합니다. 다만 ①상속으로 취득한 공유지분을 처분한 경우, ②전용면적 20㎡ 이하 주택 1채, ③시가표준액 100만 원 이하 주거용 건축물, ④전세사기피해주택 등은 주택 소유로 보지 않습니다. 취득일로부터 3개월 이내 전입 및 실거주 의무가 있고, 위반 시 감면세액이 추징됩니다. (행정안전부고시 제2026-3호, 2026.1.13. 시행)",
  },
  {
    q: "현재 조정대상지역이 어디인가요?",
    a: "2025년 10월 15일부터 서울 전역(25개 구) 및 경기도 일부(성남 수정·중원·분당, 하남, 과천, 광명 등)가 조정대상지역으로 지정되어 있습니다. 지정 현황은 수시로 바뀌므로 국토교통부(molit.go.kr) 공식 발표를 확인하세요.",
  },
  {
    q: "분양권 취득세는 어떻게 계산하나요?",
    a: "분양권 자체는 부동산이 아닌 권리이므로, 취득세는 실제 주택 완공 후 소유권 이전 시점에 납부합니다. 분양가(계약금+중도금+잔금)를 취득가액으로 봅니다.",
  },
  {
    q: "증여로 주택을 받으면 취득세율은?",
    a: "증여 취득세율은 3.5%가 기본입니다. 단, 조정대상지역 내 3억원 이상 주택을 증여받는 경우 12%가 적용됩니다. 증여자와 수증자 관계, 주택 수에 따라 달라질 수 있습니다.",
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
  title: "취득세 계산기 — 아파트 주택 취득세·지방교육세·농특세",
  description: "아파트·주택 취득 시 납부할 취득세를 계산하세요. 1~3주택, 조정대상지역 중과세율, 지방교육세·농어촌특별세 포함.",
  alternates: { canonical: `${siteUrl}/calculators/chwideukse` },
  openGraph: {
    title: "취득세 계산기",
    description: "주택 취득세·지방교육세·농어촌특별세 합계 즉시 계산, 다주택 중과 포함",
    url: `${siteUrl}/calculators/chwideukse`,
  },
};

export default async function ChwideukseCalcPage() {
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
      <Script id="faq-ld-chwideukse" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(FAQ_LD) }} />
      <header className="space-y-2">
        <nav className="text-sm text-muted-foreground">
          <Link href="/calculators" className="hover:underline underline-offset-4">계산기 모음</Link>
          <span className="mx-1.5">→</span>
          <span>취득세 계산기</span>
        </nav>
        <h1 className="text-3xl font-bold tracking-tight">취득세 계산기</h1>
        <p className="text-muted-foreground">아파트·주택 취득 시 납부할 취득세, 지방교육세, 농어촌특별세 합계를 계산합니다.</p>
      </header>

      <ChwideukseCalc />

      <section className="border-t pt-8 space-y-4">
        <h2 className="text-lg font-semibold">취득세율 요약</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead><tr className="border-b text-muted-foreground text-xs">
              <th className="text-left py-2 pr-4">구분</th>
              <th className="text-right py-2 pr-4">취득세율</th>
              <th className="text-right py-2">비고</th>
            </tr></thead>
            <tbody className="divide-y">
              <tr><td className="py-2 pr-4">1주택 6억 이하</td><td className="text-right pr-4">1%</td><td className="text-right text-muted-foreground">—</td></tr>
              <tr><td className="py-2 pr-4">1주택 6억 초과 ~ 9억 이하</td><td className="text-right pr-4">1~3%</td><td className="text-right text-muted-foreground">취득가액 비례</td></tr>
              <tr><td className="py-2 pr-4">1주택 9억 초과</td><td className="text-right pr-4">3%</td><td className="text-right text-muted-foreground">—</td></tr>
              <tr><td className="py-2 pr-4">2주택 (조정대상지역)</td><td className="text-right pr-4">8%</td><td className="text-right text-muted-foreground">중과</td></tr>
              <tr><td className="py-2 pr-4">2주택 (비조정)</td><td className="text-right pr-4">1~3%</td><td className="text-right text-muted-foreground">일반세율</td></tr>
              <tr><td className="py-2 pr-4">3주택 (조정)</td><td className="text-right pr-4">12%</td><td className="text-right text-muted-foreground">중과</td></tr>
              <tr><td className="py-2 pr-4">3주택 (비조정)</td><td className="text-right pr-4">8%</td><td className="text-right text-muted-foreground">중과</td></tr>
              <tr><td className="py-2 pr-4">4주택 이상</td><td className="text-right pr-4">12%</td><td className="text-right text-muted-foreground">중과</td></tr>
            </tbody>
          </table>
        </div>
        <div className="rounded-lg bg-muted/50 p-4 text-sm space-y-1 text-muted-foreground">
          <p>• 지방교육세: 일반세율 → 취득세 × 10%, 중과세율(8%·12%) → 취득가액 × 0.4%</p>
          <p>• 농어촌특별세: 85㎡ 초과 시 부과 (이하 면제). 일반세율 → 취득세 × 20%, 8% 중과 → 취득가액 × 0.6%, 12% 중과 → 취득가액 × 1%</p>
          <p>• 4주택 이상은 조정·비조정 관계없이 12% 중과</p>
          <p>• 증여·상속·법인 취득은 세율이 다릅니다.</p>
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
