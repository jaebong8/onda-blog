import type { Metadata } from "next";
import Link from "next/link";
import { ChwideukseCalc } from "@/components/calculators/chwideukse-calc";

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

export default function ChwideukseCalcPage() {
  return (
    <div className="space-y-8">
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
              <tr><td className="py-2 pr-4">3주택+ (조정)</td><td className="text-right pr-4">12%</td><td className="text-right text-muted-foreground">중과</td></tr>
              <tr><td className="py-2 pr-4">3주택+ (비조정)</td><td className="text-right pr-4">8%</td><td className="text-right text-muted-foreground">중과</td></tr>
            </tbody>
          </table>
        </div>
        <div className="rounded-lg bg-muted/50 p-4 text-sm space-y-1 text-muted-foreground">
          <p>• 지방교육세 = 취득세 × 10%</p>
          <p>• 농어촌특별세 = 전용면적 85㎡ 초과 시 취득세 × 20% (이하 면제)</p>
          <p>• 증여·상속·법인 취득은 세율이 다릅니다.</p>
        </div>
      </section>
    </div>
  );
}
