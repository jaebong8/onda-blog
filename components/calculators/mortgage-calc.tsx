"use client";
import { useState } from "react";

type RepayType = "equal-pi" | "equal-p" | "balloon";

function fmtWon(manwon: number): string {
  if (manwon <= 0) return "0원";
  if (manwon >= 10000) {
    const eok = Math.floor(manwon / 10000);
    const man = Math.round(manwon % 10000);
    return man === 0 ? `${eok}억원` : `${eok}억 ${man.toLocaleString()}만원`;
  }
  return `${Math.round(manwon).toLocaleString()}만원`;
}

function calcMortgage(principal: number, annualRate: number, years: number, type: RepayType) {
  const months = years * 12;
  const r = annualRate / 100 / 12;

  if (type === "equal-pi") {
    if (r === 0) {
      const m = principal / months;
      return { firstMonthly: m, lastMonthly: m, totalInterest: 0, totalPayment: principal };
    }
    const m = principal * r * Math.pow(1 + r, months) / (Math.pow(1 + r, months) - 1);
    return { firstMonthly: m, lastMonthly: m, totalInterest: m * months - principal, totalPayment: m * months };
  }

  if (type === "equal-p") {
    const mp = principal / months;
    let totalInterest = 0;
    for (let i = 0; i < months; i++) {
      totalInterest += (principal - mp * i) * r;
    }
    return {
      firstMonthly: mp + principal * r,
      lastMonthly: mp + mp * r,
      totalInterest,
      totalPayment: principal + totalInterest,
    };
  }

  // balloon
  const monthly = principal * r;
  return {
    firstMonthly: monthly,
    lastMonthly: monthly + principal,
    totalInterest: monthly * months,
    totalPayment: principal + monthly * months,
  };
}

function getAnnualSchedule(principal: number, annualRate: number, years: number) {
  const r = annualRate / 100 / 12;
  if (r === 0 || principal <= 0) return [];
  const months = years * 12;
  const monthly = principal * r * Math.pow(1 + r, months) / (Math.pow(1 + r, months) - 1);
  let remaining = principal;
  const rows = [];
  for (let yr = 1; yr <= years; yr++) {
    let yInterest = 0, yPrincipal = 0;
    for (let m = 0; m < 12; m++) {
      const interest = remaining * r;
      const pmt = monthly - interest;
      yInterest += interest;
      yPrincipal += pmt;
      remaining = Math.max(0, remaining - pmt);
    }
    rows.push({ year: yr, interest: yInterest, principal: yPrincipal, remaining });
  }
  return rows;
}

export function MortgageCalc() {
  const [principal, setPrincipal] = useState("");
  const [annualRate, setAnnualRate] = useState("");
  const [years, setYears] = useState("30");
  const [repayType, setRepayType] = useState<RepayType>("equal-pi");

  const p = Number(principal) || 0;
  const r = Number(annualRate) || 0;
  const y = Number(years) || 30;

  const result = p > 0 && r > 0 ? calcMortgage(p, r, y, repayType) : null;
  const schedule = repayType === "equal-pi" && p > 0 && r > 0 ? getAnnualSchedule(p, r, y) : [];

  const inputClass = "w-full rounded-md border bg-background px-3 py-2 text-sm";

  return (
    <div className="max-w-lg mx-auto space-y-6">
      {/* 입력 */}
      <div className="rounded-lg border bg-card p-5 space-y-4">
        <span className="font-semibold">대출 조건</span>
        <div className="space-y-1.5">
          <label className="text-sm text-muted-foreground">대출금액</label>
          <div className="relative">
            <input type="number" value={principal} onChange={(e) => setPrincipal(e.target.value)}
              placeholder="30000" className={inputClass} min="0" />
            <span className="absolute right-3 top-2 text-sm text-muted-foreground">만원</span>
          </div>
          {p > 0 && <p className="text-xs text-muted-foreground">{fmtWon(p)}</p>}
        </div>
        <div className="space-y-1.5">
          <label className="text-sm text-muted-foreground">연 이자율</label>
          <div className="relative">
            <input type="number" value={annualRate} onChange={(e) => setAnnualRate(e.target.value)}
              placeholder="3.5" step="0.1" className={inputClass} min="0" />
            <span className="absolute right-3 top-2 text-sm text-muted-foreground">%</span>
          </div>
        </div>
        <div className="space-y-1.5">
          <label className="text-sm text-muted-foreground">대출 기간</label>
          <div className="flex gap-2">
            {[10, 20, 30, 40].map((n) => (
              <button key={n} onClick={() => setYears(String(n))}
                className={`flex-1 py-1.5 rounded-md text-sm border transition-colors ${
                  y === n ? "bg-primary text-primary-foreground border-primary" : "hover:bg-muted"
                }`}
              >{n}년</button>
            ))}
          </div>
        </div>
        <div className="space-y-2">
          <label className="text-sm text-muted-foreground">상환 방식</label>
          <div className="flex flex-col gap-2">
            {([
              ["equal-pi", "원리금균등", "매달 동일한 금액 납부 (가장 일반적)"],
              ["equal-p",  "원금균등",   "매달 원금 동일, 이자는 줄어듦"],
              ["balloon",  "만기일시",   "매달 이자만, 만기에 원금 상환"],
            ] as [RepayType, string, string][]).map(([v, label, desc]) => (
              <label key={v} className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                repayType === v ? "border-primary bg-primary/5" : "hover:bg-muted"
              }`}>
                <input type="radio" name="repay" value={v} checked={repayType === v}
                  onChange={() => setRepayType(v)} className="mt-0.5" />
                <div>
                  <p className="text-sm font-medium">{label}</p>
                  <p className="text-xs text-muted-foreground">{desc}</p>
                </div>
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* 결과 */}
      {result && (
        <>
          <div className="rounded-xl border-2 border-primary bg-primary/5 p-6 space-y-4">
            <p className="text-sm font-medium text-muted-foreground text-center">상환 요약</p>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <p className="text-xs text-muted-foreground mb-1">
                  {repayType === "equal-pi" ? "월 납부액" : repayType === "equal-p" ? "첫달 납부액" : "매월 이자"}
                </p>
                <p className="text-xl font-bold text-primary">{fmtWon(Math.round(result.firstMonthly))}</p>
              </div>
              {repayType === "equal-p" && (
                <div className="text-center">
                  <p className="text-xs text-muted-foreground mb-1">마지막달 납부액</p>
                  <p className="text-xl font-bold text-primary">{fmtWon(Math.round(result.lastMonthly))}</p>
                </div>
              )}
              {repayType === "balloon" && (
                <div className="text-center">
                  <p className="text-xs text-muted-foreground mb-1">만기 상환액</p>
                  <p className="text-xl font-bold text-primary">{fmtWon(Math.round(result.lastMonthly))}</p>
                </div>
              )}
              {repayType === "equal-pi" && (
                <div className="text-center">
                  <p className="text-xs text-muted-foreground mb-1">총 납부액</p>
                  <p className="text-xl font-bold">{fmtWon(Math.round(result.totalPayment))}</p>
                </div>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4 pt-3 border-t border-primary/20 text-sm">
              <div className="text-center">
                <p className="text-xs text-muted-foreground">총 이자</p>
                <p className="font-bold mt-1">{fmtWon(Math.round(result.totalInterest))}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-muted-foreground">이자 비율</p>
                <p className="font-bold mt-1">{p > 0 ? ((result.totalInterest / p) * 100).toFixed(1) : 0}%</p>
              </div>
            </div>
          </div>

          {/* 원리금균등 연도별 표 */}
          {repayType === "equal-pi" && schedule.length > 0 && (
            <div className="rounded-lg border overflow-hidden">
              <div className="px-4 py-3 bg-muted/50 text-sm font-medium">연도별 상환 현황</div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-muted-foreground text-xs">
                      <th className="text-left px-4 py-2">연도</th>
                      <th className="text-right px-4 py-2">원금</th>
                      <th className="text-right px-4 py-2">이자</th>
                      <th className="text-right px-4 py-2">잔여 원금</th>
                    </tr>
                  </thead>
                  <tbody>
                    {schedule.map((row) => (
                      <tr key={row.year} className="border-b last:border-0 hover:bg-muted/30">
                        <td className="px-4 py-2">{row.year}년차</td>
                        <td className="text-right px-4 py-2">{fmtWon(Math.round(row.principal))}</td>
                        <td className="text-right px-4 py-2 text-muted-foreground">{fmtWon(Math.round(row.interest))}</td>
                        <td className="text-right px-4 py-2">{fmtWon(Math.round(row.remaining))}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      <p className="text-xs text-muted-foreground leading-relaxed">
        * 고정금리 기준. 변동금리 대출은 실제 납부액이 달라질 수 있습니다.<br />
        * 중도상환수수료, 인지세 등 부대비용은 포함하지 않습니다.
      </p>
    </div>
  );
}
