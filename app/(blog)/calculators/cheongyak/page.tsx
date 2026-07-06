import type { Metadata } from "next";
import Link from "next/link";
import { CheongyakCalc } from "@/components/calculators/cheongyak-calc";

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

export default function CheongyakCalcPage() {
  return (
    <div className="space-y-8">
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
    </div>
  );
}
