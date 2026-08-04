import type { Metadata } from "next";
import Link from "next/link";
import Script from "next/script";
import { UnemploymentCalc } from "@/components/calculators/unemployment-calc";
import {
  BENEFIT_DAYS,
  INSURED_PERIOD_LABELS,
  JOB_SEEKING_ALLOWANCE as JSA,
  LABOR_YEAR,
  MINIMUM_WAGE,
  REQUIRED_INSURED_DAYS,
  type InsuredPeriod,
} from "@/lib/constants/labor";

const FAQS = [
  {
    q: "실업급여 수급 조건은 무엇인가요?",
    a: `네 가지를 모두 충족해야 합니다. 첫째, 이직일 이전 18개월 동안 고용보험 피보험 단위기간이 ${REQUIRED_INSURED_DAYS}일 이상이어야 합니다. 둘째, 경영상 해고·계약만료·권고사직 등 비자발적으로 이직해야 합니다. 셋째, 근로할 의사와 능력이 있는데 취업하지 못한 상태여야 합니다. 넷째, 적극적으로 재취업 활동을 해야 합니다. 피보험 단위기간은 보수를 받은 날을 세므로, 주 5일 근무자는 대략 8개월 이상 근무해야 ${REQUIRED_INSURED_DAYS}일이 채워집니다.`,
  },
  {
    q: "자발적으로 퇴사해도 실업급여를 받을 수 있나요?",
    a: "원칙적으로는 받을 수 없습니다. 다만 자발적 퇴사라도 정당한 사유가 인정되면 수급이 가능합니다. 임금 체불, 최저임금 미달, 사업장의 휴업, 직장 내 괴롭힘이나 성희롱, 통근이 왕복 3시간 이상으로 곤란해진 경우, 질병으로 업무 수행이 어려운데 사업주가 배치전환을 해주지 않는 경우 등이 해당합니다. 인정 여부는 고용센터가 개별 심사하므로 퇴사 전에 관련 증빙을 확보해두는 것이 좋습니다.",
  },
  {
    q: `${LABOR_YEAR}년 실업급여는 하루에 얼마인가요?`,
    a: `퇴직 전 3개월 평균임금의 60%를 지급하되 상한액과 하한액이 있습니다. ${LABOR_YEAR}년 기준 1일 상한액은 ${JSA.DAILY_MAX.toLocaleString()}원, 하한액은 ${JSA.DAILY_MIN.toLocaleString()}원입니다. 하한액은 최저임금(시간급 ${MINIMUM_WAGE[LABOR_YEAR].toLocaleString()}원)의 80%에 8시간을 곱해 정합니다. 상한과 하한의 차이가 ${(JSA.DAILY_MAX - JSA.DAILY_MIN).toLocaleString()}원에 불과해, 월급이 약 330만원 미만이면 대부분 하한액을, 약 341만원을 넘으면 상한액을 받습니다.`,
  },
  {
    q: "실업급여는 며칠 동안 받을 수 있나요?",
    a: "이직 당시 만 나이와 고용보험 가입기간에 따라 120일에서 270일까지입니다. 만 50세 미만은 가입기간에 따라 120·150·180·210·240일이고, 만 50세 이상이거나 장애인은 120·180·210·240·270일입니다. 다만 이 일수는 이직일 다음 날부터 12개월 안에 받아야 합니다. 신청이 늦어져 12개월이 지나면 남은 일수가 있어도 더 이상 받을 수 없으므로 퇴사 후 바로 신청하는 것이 좋습니다.",
  },
  {
    q: "실업급여는 언제 어떻게 신청하나요?",
    a: "퇴사 후 바로 신청하는 것이 원칙입니다. 먼저 워크넷에 구직등록을 하고, 고용보험 홈페이지에서 수급자격 신청자 온라인 교육을 이수한 뒤, 거주지 관할 고용센터를 방문해 수급자격 인정을 신청합니다. 사업주가 이직확인서를 제출해야 처리되므로 미제출 시 회사에 요청해야 합니다. 수급자격이 인정되면 실업 신고일부터 7일간은 대기기간으로 급여가 지급되지 않고, 이후 1~4주 간격의 실업인정일마다 재취업 활동을 신고하면 지급됩니다.",
  },
  {
    q: "실업급여를 받으면서 아르바이트를 해도 되나요?",
    a: "일을 했다면 실업인정일에 반드시 신고해야 합니다. 신고하면 근로한 날은 급여가 지급되지 않거나 감액될 수 있지만, 소정급여일수가 줄지 않고 뒤로 미뤄집니다. 신고하지 않고 받으면 부정수급에 해당해 지급받은 금액의 반환은 물론 추가 징수와 형사처벌까지 받을 수 있습니다. 소액이라도 반드시 신고하시기 바랍니다.",
  },
  {
    q: "재취업하면 남은 실업급여는 어떻게 되나요?",
    a: "소정급여일수를 절반 이상 남기고 재취업해 12개월 이상 계속 근무하거나 사업을 유지하면 조기재취업수당을 신청할 수 있습니다. 남은 급여일수의 절반을 일시금으로 받는 제도입니다. 재취업한 날 이후 12개월이 지난 시점에 신청하며, 이전 사업주에게 재고용되거나 이미 예정되어 있던 취업인 경우에는 제외됩니다.",
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
  title: `실업급여 계산기 — ${LABOR_YEAR}년 기준 예상 수령액 계산`,
  description: `퇴직 전 월급과 고용보험 가입기간을 입력하면 ${LABOR_YEAR}년 기준 실업급여 예상 수령액을 계산합니다. 1일 상한액 ${JSA.DAILY_MAX.toLocaleString()}원·하한액 ${JSA.DAILY_MIN.toLocaleString()}원과 소정급여일수 자동 반영.`,
  alternates: { canonical: `${siteUrl}/calculators/unemployment` },
  openGraph: {
    title: `실업급여 계산기 (${LABOR_YEAR}년 기준)`,
    description: "월급과 가입기간만 넣으면 1일 지급액·소정급여일수·총 수령액을 즉시 계산",
    url: `${siteUrl}/calculators/unemployment`,
  },
};

const PERIODS = Object.keys(INSURED_PERIOD_LABELS) as InsuredPeriod[];

export default function UnemploymentCalcPage() {
  return (
    <div className="space-y-8">
      <Script
        id="faq-ld-unemployment"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(FAQ_LD) }}
      />

      <header className="space-y-2">
        <nav className="text-sm text-muted-foreground">
          <Link href="/calculators" className="hover:underline underline-offset-4">
            계산기 모음
          </Link>
          <span className="mx-1.5">→</span>
          <span>실업급여 계산기</span>
        </nav>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">실업급여 계산기</h1>
        <p className="text-muted-foreground">
          퇴직 전 월급과 고용보험 가입기간을 입력하면 1일 지급액과 총 수령액을 계산합니다.
          {LABOR_YEAR}년 상·하한액과 소정급여일수를 자동으로 반영합니다.
        </p>
        <p className="text-xs text-muted-foreground">
          ※ {LABOR_YEAR}년 1월 1일 이후 이직자 기준입니다. 자영업자·예술인·노무제공자
          고용보험은 산정 방식이 달라 이 계산기의 범위 밖입니다.
        </p>
      </header>

      <UnemploymentCalc />

      <section className="border-t pt-8 space-y-4">
        <h2 className="text-lg font-semibold">{LABOR_YEAR}년 실업급여 기준 요약</h2>

        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b text-muted-foreground text-xs">
                <th className="text-left py-2 pr-4">구분</th>
                <th className="text-right py-2 pr-4">1일</th>
                <th className="text-right py-2">30일 기준</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              <tr>
                <td className="py-2 pr-4">상한액</td>
                <td className="text-right pr-4 font-medium">
                  {JSA.DAILY_MAX.toLocaleString()}원
                </td>
                <td className="text-right text-muted-foreground">
                  {(JSA.DAILY_MAX * 30).toLocaleString()}원
                </td>
              </tr>
              <tr>
                <td className="py-2 pr-4">하한액</td>
                <td className="text-right pr-4 font-medium">
                  {JSA.DAILY_MIN.toLocaleString()}원
                </td>
                <td className="text-right text-muted-foreground">
                  {(JSA.DAILY_MIN * 30).toLocaleString()}원
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <h3 className="text-base font-semibold pt-2">소정급여일수</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b text-muted-foreground text-xs">
                <th className="text-left py-2 pr-4">고용보험 가입기간</th>
                <th className="text-right py-2 pr-4">만 50세 미만</th>
                <th className="text-right py-2">만 50세 이상·장애인</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {PERIODS.map((p) => (
                <tr key={p}>
                  <td className="py-2 pr-4">{INSURED_PERIOD_LABELS[p]}</td>
                  <td className="text-right pr-4">{BENEFIT_DAYS.under50[p]}일</td>
                  <td className="text-right">{BENEFIT_DAYS.over50[p]}일</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="rounded-lg bg-muted/50 p-4 text-sm space-y-1 text-muted-foreground">
          <p>• 지급액 = 퇴직 전 3개월 평균임금의 60% (상·하한액 적용)</p>
          <p>
            • 하한액은 최저임금(시간급 {MINIMUM_WAGE[LABOR_YEAR].toLocaleString()}원)의 80% ×
            8시간
          </p>
          <p>• 이직일 이전 18개월간 피보험 단위기간 {REQUIRED_INSURED_DAYS}일 이상 필요</p>
          <p>• 실업 신고일부터 7일은 대기기간으로 지급되지 않음</p>
          <p>• 소정급여일수는 이직일 다음 날부터 12개월 이내에 받아야 함</p>
        </div>
      </section>

      <section className="border-t pt-8 space-y-4">
        <h2 className="text-lg font-semibold">자주 묻는 질문</h2>
        <div className="border rounded-lg overflow-hidden divide-y">
          {FAQS.map(({ q, a }) => (
            <details key={q} className="group">
              <summary className="flex justify-between items-center px-5 py-4 cursor-pointer font-medium text-sm list-none select-none hover:bg-muted/50">
                {q}
                <span className="shrink-0 ml-4 text-muted-foreground transition-transform duration-200 group-open:rotate-180">
                  ▾
                </span>
              </summary>
              <div className="px-5 pb-4 text-sm text-muted-foreground leading-relaxed">{a}</div>
            </details>
          ))}
        </div>
      </section>
    </div>
  );
}
