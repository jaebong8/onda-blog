"use client";
import { useState } from "react";

function calcRate(priceManwon: number, homeCount: number, isAdjusted: boolean): number {
  if (homeCount === 1) {
    if (priceManwon <= 60000) return 0.01;
    if (priceManwon <= 90000) return (priceManwon / 10000) * (2 / 3) / 100 - 0.03;
    return 0.03;
  }
  if (homeCount === 2) {
    if (isAdjusted) return 0.08;
    if (priceManwon <= 60000) return 0.01;
    if (priceManwon <= 90000) return (priceManwon / 10000) * (2 / 3) / 100 - 0.03;
    return 0.03;
  }
  if (homeCount === 3) {
    return isAdjusted ? 0.12 : 0.08;
  }
  // 4주택 이상: 조정/비조정 모두 12%
  return 0.12;
}

function isSurcharge(homeCount: number, isAdjusted: boolean): boolean {
  return (homeCount === 2 && isAdjusted) || homeCount >= 3;
}

function fmtWon(manwon: number): string {
  if (manwon <= 0) return "0원";
  if (manwon >= 10000) {
    const eok = Math.floor(manwon / 10000);
    const man = Math.round(manwon % 10000);
    return man === 0 ? `${eok}억원` : `${eok}억 ${man.toLocaleString()}만원`;
  }
  return `${manwon.toLocaleString()}만원`;
}

export function ChwideukseCalc() {
  const [price, setPrice] = useState("");
  const [homeCount, setHomeCount] = useState(1);
  const [isAdjusted, setIsAdjusted] = useState(false);
  const [area, setArea] = useState("");
  const [isFirstHome, setIsFirstHome] = useState(false);

  const p = Number(price) || 0;
  const a = Number(area) || 0;

  const rate = p > 0 ? calcRate(p, homeCount, isAdjusted) : 0;
  const acqTax = p * rate;
  const surcharge = isSurcharge(homeCount, isAdjusted);
  // 지방교육세: 일반세율 → 취득세 × 10%, 중과세율(8%·12%) → 취득가액 × 0.4%
  const eduTax = surcharge ? p * 0.004 : acqTax * 0.1;
  // 농어촌특별세: 일반 → 취득세 × 20%, 8% 중과 → 취득가액 × 0.6%, 12% 중과 → 취득가액 × 1%
  const specialTax = a > 85
    ? (!surcharge ? acqTax * 0.2 : rate >= 0.12 ? p * 0.01 : p * 0.006)
    : 0;

  // 생애최초 감면: 1주택, 12억 이하 취득 시 취득세 최대 200만원 감면 (지방세특례제한법 §36의3)
  const canFirstHome = homeCount === 1 && p > 0 && p <= 120000;
  const firstHomeDiscount = canFirstHome && isFirstHome ? Math.min(200, acqTax) : 0;

  const total = acqTax - firstHomeDiscount + eduTax + specialTax;

  const inputClass = "w-full rounded-md border bg-background px-3 py-2 text-sm";

  return (
    <div className="max-w-lg mx-auto space-y-6">
      {/* 취득가액 */}
      <div className="rounded-lg border bg-card p-5 space-y-3">
        <span className="font-medium">취득가액</span>
        <div className="relative">
          <input type="number" value={price} onChange={(e) => setPrice(e.target.value)}
            placeholder="50000" className={inputClass} min="0" />
          <span className="absolute right-3 top-2 text-sm text-muted-foreground">만원</span>
        </div>
        {p > 0 && <p className="text-xs text-muted-foreground">{fmtWon(p)}</p>}
      </div>

      {/* 취득 후 주택 수 */}
      <div className="rounded-lg border bg-card p-5 space-y-3">
        <span className="font-medium">취득 후 주택 수</span>
        <div className="flex gap-2">
          {([1, 2, 3, 4] as const).map((n) => (
            <button
              key={n}
              onClick={() => setHomeCount(n)}
              className={`flex-1 py-2 rounded-md text-sm font-medium border transition-colors ${
                homeCount === n ? "bg-primary text-primary-foreground border-primary" : "hover:bg-muted"
              }`}
            >
              {n === 4 ? "4주택+" : `${n}주택`}
            </button>
          ))}
        </div>
        {homeCount >= 2 && homeCount < 4 && (
          <label className="flex items-center gap-2 text-sm cursor-pointer select-none pt-1">
            <input type="checkbox" checked={isAdjusted} onChange={(e) => setIsAdjusted(e.target.checked)} className="rounded" />
            조정대상지역 내 취득
          </label>
        )}
        {homeCount >= 4 && (
          <p className="text-xs text-destructive pt-1">4주택 이상은 조정·비조정 무관 12% 중과</p>
        )}
      </div>

      {/* 생애최초 감면 */}
      {canFirstHome && (
        <div className="rounded-lg border bg-card p-5">
          <label className="flex items-start gap-3 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={isFirstHome}
              onChange={(e) => setIsFirstHome(e.target.checked)}
              className="rounded mt-0.5"
            />
            <div>
              <span className="font-medium text-sm">생애최초 주택 구입 감면 적용</span>
              <p className="text-xs text-muted-foreground mt-0.5">
                본인·배우자 모두 무주택 이력 없을 것 — 취득세 최대 200만원 감면
              </p>
            </div>
          </label>
        </div>
      )}

      {/* 전용면적 */}
      <div className="rounded-lg border bg-card p-5 space-y-3">
        <div className="flex justify-between">
          <span className="font-medium">전용면적</span>
          <span className="text-xs text-muted-foreground">농어촌특별세 과세 여부 결정</span>
        </div>
        <div className="relative">
          <input type="number" value={area} onChange={(e) => setArea(e.target.value)}
            placeholder="84" className={inputClass} min="0" />
          <span className="absolute right-3 top-2 text-sm text-muted-foreground">㎡</span>
        </div>
        {a > 0 && (
          <p className="text-xs text-muted-foreground">
            {a > 85 ? "85㎡ 초과 → 농어촌특별세 부과" : "85㎡ 이하 → 농어촌특별세 면제"}
          </p>
        )}
      </div>

      {/* 결과 */}
      {p > 0 && (
        <div className="rounded-xl border-2 border-primary bg-primary/5 p-6 space-y-4">
          <p className="text-sm font-medium text-muted-foreground text-center">세금 합계</p>
          <p className="text-4xl font-bold text-center text-primary">{fmtWon(Math.round(total))}</p>
          <div className="space-y-2 pt-3 border-t border-primary/20 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">취득세 ({(rate * 100).toFixed(2)}%)</span>
              <span className="font-medium">{fmtWon(Math.round(acqTax))}</span>
            </div>
            {firstHomeDiscount > 0 && (
              <div className="flex justify-between text-green-600 dark:text-green-400">
                <span>생애최초 감면</span>
                <span className="font-medium">−{fmtWon(firstHomeDiscount)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-muted-foreground">지방교육세 ({surcharge ? "과세표준 × 0.4%" : "취득세 × 10%"})</span>
              <span className="font-medium">{fmtWon(Math.round(eduTax))}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">농어촌특별세 ({!surcharge ? "취득세 × 20%" : rate >= 0.12 ? "과세표준 × 1%" : "과세표준 × 0.6%"})</span>
              <span className="font-medium">{a > 85 ? fmtWon(Math.round(specialTax)) : "면제"}</span>
            </div>
          </div>
          {surcharge && (
            <p className="text-xs text-center text-destructive pt-1">
              {homeCount === 2 && isAdjusted ? "조정대상지역 2주택 중과 (8%)"
               : homeCount === 3 && isAdjusted ? "3주택 조정대상지역 중과 (12%)"
               : homeCount === 3 && !isAdjusted ? "3주택 비조정 중과 (8%)"
               : "4주택 이상 중과 (12%)"}
            </p>
          )}
        </div>
      )}

      <p className="text-xs text-muted-foreground leading-relaxed">
        * 일반적인 주택 취득 기준입니다. 법인·신탁·증여·상속 등은 세율이 다릅니다.<br />
        * 6억 초과 ~ 9억 이하 1주택: 취득가액에 따라 1~3% 사이 세율 적용.
      </p>
    </div>
  );
}
