"use client";
import { useState } from "react";
import {
  BENEFIT_DAYS,
  INSURED_PERIOD_LABELS,
  JOB_SEEKING_ALLOWANCE as JSA,
  LABOR_YEAR,
  type InsuredPeriod,
} from "@/lib/constants/labor";

const PERIODS = Object.keys(INSURED_PERIOD_LABELS) as InsuredPeriod[];

/**
 * 평균임금일액 = 이직 전 3개월 임금총액 ÷ 그 기간의 총일수.
 * 총일수는 퇴사일에 따라 89~92일로 달라지지만, 월급만 아는 사용자를 위해
 * 90일로 근사한다. 결과 화면에 근사임을 명시한다.
 */
const DAYS_IN_3_MONTHS = 90;

function fmtWon(won: number): string {
  return `${Math.round(won).toLocaleString()}원`;
}

function fmtManwon(won: number): string {
  const man = won / 10_000;
  if (man >= 10_000) {
    const eok = Math.floor(man / 10_000);
    const rest = Math.round(man % 10_000);
    return rest === 0 ? `약 ${eok}억원` : `약 ${eok}억 ${rest.toLocaleString()}만원`;
  }
  return `약 ${Math.round(man).toLocaleString()}만원`;
}

export function UnemploymentCalc() {
  const [monthlyPay, setMonthlyPay] = useState("");
  const [period, setPeriod] = useState<InsuredPeriod>("lt3");
  const [isOver50, setIsOver50] = useState(false);
  const [isDisabled, setIsDisabled] = useState(false);
  const [isInvoluntary, setIsInvoluntary] = useState(true);

  const monthly = (Number(monthlyPay) || 0) * 10_000;
  const showResult = monthly > 0;

  // 1일 평균임금 → 구직급여일액(60%) → 상·하한 적용
  const avgDailyWage = (monthly * 3) / DAYS_IN_3_MONTHS;
  const rawDaily = avgDailyWage * JSA.RATE;
  const dailyAmount = Math.min(Math.max(rawDaily, JSA.DAILY_MIN), JSA.DAILY_MAX);

  const hitMin = showResult && rawDaily < JSA.DAILY_MIN;
  const hitMax = showResult && rawDaily > JSA.DAILY_MAX;

  // 소정급여일수: 장애인은 50세 이상과 동일하게 본다
  const useOver50Table = isOver50 || isDisabled;
  const days = (useOver50Table ? BENEFIT_DAYS.over50 : BENEFIT_DAYS.under50)[period];

  const total = dailyAmount * days;
  const monthlyEstimate = dailyAmount * 30;

  const inputClass = "w-full rounded-md border bg-background px-3 py-2 text-sm";

  return (
    <div className="max-w-lg mx-auto space-y-6">
      {/* 퇴직 전 월급 */}
      <div className="rounded-lg border bg-card p-5 space-y-4">
        <span className="font-medium">퇴직 전 3개월 평균 월급</span>
        <div className="space-y-1.5">
          <label className="text-sm text-muted-foreground">
            세전 기준
            <span className="ml-1 text-xs opacity-60">상여금·수당 포함</span>
          </label>
          <div className="relative">
            <input
              type="number"
              inputMode="numeric"
              value={monthlyPay}
              onChange={(e) => setMonthlyPay(e.target.value)}
              placeholder="300"
              className={inputClass}
              min="0"
            />
            <span className="absolute right-3 top-2 text-sm text-muted-foreground">만원</span>
          </div>
          {monthly > 0 && (
            <p className="text-xs text-muted-foreground">
              1일 평균임금 {fmtWon(avgDailyWage)}
            </p>
          )}
        </div>
      </div>

      {/* 고용보험 가입기간 */}
      <div className="rounded-lg border bg-card p-5 space-y-3">
        <span className="font-medium">고용보험 총 가입기간</span>
        <div className="space-y-2">
          {PERIODS.map((p) => (
            <label key={p} className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="radio"
                checked={period === p}
                onChange={() => setPeriod(p)}
                className="shrink-0"
              />
              <span className="text-sm flex-1">{INSURED_PERIOD_LABELS[p]}</span>
              <span className="shrink-0 text-xs text-muted-foreground">
                {(useOver50Table ? BENEFIT_DAYS.over50 : BENEFIT_DAYS.under50)[p]}일
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* 연령·장애 */}
      <div className="rounded-lg border bg-card p-5 space-y-3">
        <span className="font-medium">이직 당시 연령</span>
        <div className="space-y-2">
          <label className="flex items-center gap-2.5 cursor-pointer">
            <input type="radio" checked={!isOver50} onChange={() => setIsOver50(false)} className="shrink-0" />
            <span className="text-sm">만 50세 미만</span>
          </label>
          <label className="flex items-center gap-2.5 cursor-pointer">
            <input type="radio" checked={isOver50} onChange={() => setIsOver50(true)} className="shrink-0" />
            <span className="text-sm">만 50세 이상</span>
          </label>
        </div>
        <label className="flex items-center gap-2 text-sm cursor-pointer select-none pt-2 border-t">
          <input
            type="checkbox"
            checked={isDisabled}
            onChange={(e) => setIsDisabled(e.target.checked)}
            className="rounded"
          />
          장애인
          <span className="text-xs text-muted-foreground">50세 이상과 동일 적용</span>
        </label>
      </div>

      {/* 퇴사 사유 */}
      <div className="rounded-lg border bg-card p-5 space-y-2">
        <span className="font-medium">퇴사 사유</span>
        <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
          <input
            type="checkbox"
            checked={isInvoluntary}
            onChange={(e) => setIsInvoluntary(e.target.checked)}
            className="rounded"
          />
          비자발적 퇴사 (계약만료·권고사직·경영상 해고 등)
        </label>
        <p className="text-xs text-muted-foreground">
          정당한 사유 없는 자발적 퇴사는 원칙적으로 수급 대상이 아닙니다.
        </p>
      </div>

      {/* 결과 */}
      {showResult && (
        <div
          className={`rounded-xl border-2 p-6 space-y-4 ${
            isInvoluntary ? "border-primary bg-primary/5" : "border-muted bg-muted/20"
          }`}
        >
          {!isInvoluntary && (
            <div className="rounded-md bg-amber-50 dark:bg-amber-950/40 px-4 py-3 text-sm text-amber-800 dark:text-amber-300">
              자발적 퇴사는 원칙적으로 수급 자격이 없습니다. 아래 금액은 자격이
              인정될 경우를 가정한 참고치입니다.
            </div>
          )}

          <p className="text-sm font-medium text-muted-foreground text-center">
            예상 총 수령액
          </p>
          <div className="text-center space-y-1">
            <p className="text-3xl sm:text-4xl font-bold">{fmtWon(total)}</p>
            <p className="text-sm text-muted-foreground">{fmtManwon(total)}</p>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2">
            <div className="rounded-lg bg-background/60 p-3 text-center">
              <p className="text-xs text-muted-foreground">1일 지급액</p>
              <p className="font-semibold">{fmtWon(dailyAmount)}</p>
            </div>
            <div className="rounded-lg bg-background/60 p-3 text-center">
              <p className="text-xs text-muted-foreground">소정급여일수</p>
              <p className="font-semibold">{days}일</p>
            </div>
          </div>

          <div className="rounded-lg bg-background/60 p-3 text-center">
            <p className="text-xs text-muted-foreground">30일 기준 월 수령액</p>
            <p className="font-semibold">{fmtWon(monthlyEstimate)}</p>
          </div>

          {/* 상·하한 적용 안내 — 실제로 대부분 여기 걸린다 */}
          {hitMin && (
            <div className="rounded-md bg-muted px-4 py-3 text-sm space-y-1">
              <p className="font-medium">하한액이 적용되었습니다</p>
              <p className="text-muted-foreground text-xs leading-relaxed">
                평균임금의 60%는 {fmtWon(rawDaily)}이지만, {LABOR_YEAR}년 하한액{" "}
                {fmtWon(JSA.DAILY_MIN)}보다 적어 하한액을 받습니다. 월급이 약 330만원
                미만이면 금액에 관계없이 동일합니다.
              </p>
            </div>
          )}
          {hitMax && (
            <div className="rounded-md bg-muted px-4 py-3 text-sm space-y-1">
              <p className="font-medium">상한액이 적용되었습니다</p>
              <p className="text-muted-foreground text-xs leading-relaxed">
                평균임금의 60%는 {fmtWon(rawDaily)}이지만, {LABOR_YEAR}년 상한액{" "}
                {fmtWon(JSA.DAILY_MAX)}을 넘어 상한액을 받습니다. 월급이 약 341만원을
                넘으면 금액에 관계없이 동일합니다.
              </p>
            </div>
          )}

          <p className="text-xs text-muted-foreground leading-relaxed border-t pt-3">
            1일 평균임금은 3개월을 90일로 계산한 근사치입니다. 실제 수급액은 퇴사일과
            임금 지급 내역에 따라 달라지며, 최종 금액은 고용센터 심사로 확정됩니다.
          </p>
        </div>
      )}
    </div>
  );
}
