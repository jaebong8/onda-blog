import type { Metadata } from "next";
import Link from "next/link";

export const revalidate = 3600;

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  title: "부동산 계산기 모음 — 청약가점·중개수수료·취득세·주담대",
  description: "청약 가점 계산기, 공인중개사 수수료 계산기, 취득세 계산기, 주택담보대출 이자 계산기를 한 곳에서 무료로 이용하세요.",
  alternates: { canonical: `${siteUrl}/calculators` },
  openGraph: {
    title: "부동산 계산기 모음",
    description: "청약가점·중개수수료·취득세·주담대 이자 무료 계산기",
    url: `${siteUrl}/calculators`,
  },
};

const CALCULATORS = [
  {
    href: "/calculators/cheongyak",
    title: "청약 가점 계산기",
    desc: "무주택 기간·부양가족·청약통장 가입 기간을 입력하면 총 가점을 즉시 계산합니다.",
    badge: "최대 84점",
  },
  {
    href: "/calculators/jungae",
    title: "중개수수료 계산기",
    desc: "매매·전세·월세 거래금액에 따른 공인중개사 상한 수수료와 VAT 포함 금액을 계산합니다.",
    badge: "2021년 개정 기준",
  },
  {
    href: "/calculators/chwideukse",
    title: "취득세 계산기",
    desc: "취득가액·주택 수·조정대상지역 여부·전용면적을 입력하면 취득세·지방교육세·농특세를 계산합니다.",
    badge: "다주택 중과 포함",
  },
  {
    href: "/calculators/mortgage",
    title: "주담대 이자 계산기",
    desc: "원리금균등·원금균등·만기일시 상환 방식별 월 납부액과 총 이자를 연도별로 계산합니다.",
    badge: "3가지 상환 방식",
  },
];

export default function CalculatorsPage() {
  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">부동산 계산기</h1>
        <p className="text-muted-foreground">청약·중개수수료·취득세·주담대 계산을 한 곳에서 무료로 이용하세요.</p>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {CALCULATORS.map((calc) => (
          <Link
            key={calc.href}
            href={calc.href}
            className="rounded-xl border bg-card p-6 hover:shadow-md hover:border-primary/50 transition-all space-y-3 group"
          >
            <div className="flex items-start justify-between gap-2">
              <h2 className="text-lg font-semibold group-hover:text-primary transition-colors">{calc.title}</h2>
              <span className="shrink-0 text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">{calc.badge}</span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">{calc.desc}</p>
            <p className="text-sm font-medium text-primary">계산하기 →</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
