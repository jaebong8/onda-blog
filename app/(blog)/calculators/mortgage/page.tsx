import type { Metadata } from "next";
import Link from "next/link";
import { MortgageCalc } from "@/components/calculators/mortgage-calc";

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

export default function MortgageCalcPage() {
  return (
    <div className="space-y-8">
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
    </div>
  );
}
