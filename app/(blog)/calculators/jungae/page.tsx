import type { Metadata } from "next";
import Link from "next/link";
import { JungaeCalc } from "@/components/calculators/jungae-calc";

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

export default function JungaeCalcPage() {
  return (
    <div className="space-y-8">
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
    </div>
  );
}
