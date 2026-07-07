"use client";
import { useState } from "react";

// 기본세율 구간 (만원)
const BRACKETS = [
  { limit: 1400,     rate: 0.06, ded: 0 },
  { limit: 5000,     rate: 0.15, ded: 126 },
  { limit: 8800,     rate: 0.24, ded: 576 },
  { limit: 15000,    rate: 0.35, ded: 1544 },
  { limit: 30000,    rate: 0.38, ded: 1994 },
  { limit: 50000,    rate: 0.40, ded: 2594 },
  { limit: 100000,   rate: 0.42, ded: 3594 },
  { limit: Infinity, rate: 0.45, ded: 6594 },
];

function progressiveTax(base: number): { tax: number; rate: number } {
  for (const b of BRACKETS) {
    if (base <= b.limit) {
      return { tax: Math.max(0, base * b.rate - b.ded), rate: b.rate };
    }
  }
  return { tax: 0, rate: 0 };
}

// 장기보유특별공제율
// 1세대 1주택 거주 2년 이상: 보유 4%/년(최대 40%) + 거주 4%/년(최대 40%), 합산 최대 80%
// 일반: 보유 2%/년(최대 30%), 3년 이상부터
function longTermRate(holdY: number, isOneHome: boolean, resY: number): number {
  if (holdY < 3) return 0;
  if (isOneHome && resY >= 2) {
    const h = Math.min(Math.floor(holdY) * 4, 40);
    const r = Math.min(Math.floor(resY) * 4, 40);
    return Math.min(h + r, 80) / 100;
  }
  return Math.min(Math.floor(holdY) * 2, 30) / 100;
}

function fmtWon(man: number): string {
  if (man <= 0) return "0원";
  if (man >= 10000) {
    const eok = Math.floor(man / 10000);
    const rest = Math.round(man % 10000);
    return rest === 0 ? `${eok}억원` : `${eok}억 ${rest.toLocaleString()}만원`;
  }
  return `${Math.round(man).toLocaleString()}만원`;
}

export function YangdoCalc() {
  const [salePrice, setSalePrice] = useState("");
  const [buyPrice,  setBuyPrice]  = useState("");
  const [expenses,  setExpenses]  = useState("");
  const [holdYears, setHoldYears] = useState("");
  const [resYears,  setResYears]  = useState("");
  const [homeCount, setHomeCount] = useState<1 | 2 | 3>(1);
  const [isAdjusted, setIsAdjusted] = useState(false);

  const sale  = Number(salePrice) || 0;
  const buy   = Number(buyPrice)  || 0;
  const exp   = Number(expenses)  || 0;
  const holdY = Number(holdYears) || 0;
  const resY  = Number(resYears)  || 0;

  const gain = sale - buy - exp;  // 양도차익

  // 1세대 1주택 비과세 요건
  const oneHomeCond =
    homeCount === 1 &&
    holdY >= 2 &&
    (!isAdjusted || resY >= 2);
  const isNonTaxable = oneHomeCond && sale > 0 && sale <= 120000 && gain > 0;
  const isHighPrice  = oneHomeCond && sale > 120000 && gain > 0;  // 고가주택

  // 과세대상 양도차익
  let taxableGain = Math.max(0, gain);
  if (isNonTaxable) taxableGain = 0;
  if (isHighPrice && sale > 0) taxableGain = gain * (sale - 120000) / sale;

  // 단기 여부
  const isShort1 = holdY > 0 && holdY < 1;     // 1년 미만 70%
  const isShort2 = holdY >= 1 && holdY < 2;    // 1~2년 60%

  // 장기보유특별공제 (1주택 고가주택 포함 1주택 조건, 단기는 적용 안 함)
  const isOneHomeLong = homeCount === 1 && holdY >= 2;
  const ltdRate   = (isShort1 || isShort2) ? 0 : longTermRate(holdY, isOneHomeLong, resY);
  const ltdAmount = taxableGain * ltdRate;

  // 과세표준
  const BASIC = 250;
  const taxBase = Math.max(0, taxableGain - ltdAmount - BASIC);

  // 세액
  let incomeTax = 0;
  let taxRate   = 0;
  if (taxBase > 0) {
    if (isShort1) {
      incomeTax = taxBase * 0.7;
      taxRate   = 0.7;
    } else if (isShort2) {
      incomeTax = taxBase * 0.6;
      taxRate   = 0.6;
    } else {
      const r = progressiveTax(taxBase);
      incomeTax = r.tax;
      taxRate   = r.rate;
    }
  }

  const localTax = incomeTax * 0.1;
  const totalTax = incomeTax + localTax;

  const inputClass = "w-full rounded-md border bg-background px-3 py-2 text-sm";
  const showResult = sale > 0 && buy > 0 && holdY > 0;

  return (
    <div className="max-w-lg mx-auto space-y-6">
      {/* 매도·취득가액 */}
      <div className="rounded-lg border bg-card p-5 space-y-4">
        <span className="font-medium">매매가액</span>
        <div className="space-y-1.5">
          <label className="text-sm text-muted-foreground">양도가액 (매도가)</label>
          <div className="relative">
            <input type="number" value={salePrice} onChange={e => setSalePrice(e.target.value)}
              placeholder="50000" className={inputClass} min="0" />
            <span className="absolute right-3 top-2 text-sm text-muted-foreground">만원</span>
          </div>
          {sale > 0 && <p className="text-xs text-muted-foreground">{fmtWon(sale)}</p>}
        </div>
        <div className="space-y-1.5">
          <label className="text-sm text-muted-foreground">취득가액 (매수가)</label>
          <div className="relative">
            <input type="number" value={buyPrice} onChange={e => setBuyPrice(e.target.value)}
              placeholder="30000" className={inputClass} min="0" />
            <span className="absolute right-3 top-2 text-sm text-muted-foreground">만원</span>
          </div>
          {buy > 0 && <p className="text-xs text-muted-foreground">{fmtWon(buy)}</p>}
        </div>
        <div className="space-y-1.5">
          <label className="text-sm text-muted-foreground">
            필요경비
            <span className="ml-1 text-xs opacity-60">취득세·중개수수료·인테리어 등</span>
          </label>
          <div className="relative">
            <input type="number" value={expenses} onChange={e => setExpenses(e.target.value)}
              placeholder="0" className={inputClass} min="0" />
            <span className="absolute right-3 top-2 text-sm text-muted-foreground">만원</span>
          </div>
        </div>
        {sale > 0 && buy > 0 && (
          <p className="text-sm font-medium pt-1 border-t">
            양도차익{" "}
            <span className={gain >= 0 ? "text-primary" : "text-destructive"}>
              {gain >= 0 ? fmtWon(gain) : `−${fmtWon(-gain)} (손실)`}
            </span>
          </p>
        )}
      </div>

      {/* 보유 · 거주 기간 */}
      <div className="rounded-lg border bg-card p-5 space-y-3">
        <span className="font-medium">보유 기간</span>
        <div className="space-y-1.5">
          <label className="text-sm text-muted-foreground">보유 기간</label>
          <div className="relative">
            <input type="number" value={holdYears} onChange={e => setHoldYears(e.target.value)}
              placeholder="3" className={inputClass} min="0" step="0.5" />
            <span className="absolute right-3 top-2 text-sm text-muted-foreground">년</span>
          </div>
          {holdY > 0 && (
            <p className="text-xs text-muted-foreground">
              {isShort1 ? "1년 미만 단기 양도세율 70% 적용"
               : isShort2 ? "1~2년 단기 양도세율 60% 적용"
               : holdY < 3 ? "2년 이상 보유 — 장기보유특별공제 3년 이상부터 적용"
               : `장기보유특별공제 ${(ltdRate * 100).toFixed(0)}% 적용`}
            </p>
          )}
        </div>
        {homeCount === 1 && (
          <div className="space-y-1.5">
            <label className="text-sm text-muted-foreground">
              거주 기간
              <span className="ml-1 text-xs opacity-60">1주택 장기보유특별공제 거주분 적용</span>
            </label>
            <div className="relative">
              <input type="number" value={resYears} onChange={e => setResYears(e.target.value)}
                placeholder="2" className={inputClass} min="0" step="0.5" />
              <span className="absolute right-3 top-2 text-sm text-muted-foreground">년</span>
            </div>
          </div>
        )}
      </div>

      {/* 주택 수 */}
      <div className="rounded-lg border bg-card p-5 space-y-3">
        <span className="font-medium">양도 시 보유 주택 수</span>
        <div className="flex gap-2">
          {([1, 2, 3] as const).map(n => (
            <button key={n} onClick={() => setHomeCount(n)}
              className={`flex-1 py-2 rounded-md text-sm font-medium border transition-colors ${
                homeCount === n ? "bg-primary text-primary-foreground border-primary" : "hover:bg-muted"
              }`}>
              {n === 3 ? "3주택+" : `${n}주택`}
            </button>
          ))}
        </div>
        <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
          <input type="checkbox" checked={isAdjusted} onChange={e => setIsAdjusted(e.target.checked)} className="rounded" />
          조정대상지역 내 양도
        </label>
        {homeCount === 1 && isAdjusted && (
          <p className="text-xs text-muted-foreground">조정대상지역 1주택 비과세는 거주 2년 이상 필요</p>
        )}
        {homeCount >= 2 && isAdjusted && (
          <p className="text-xs text-amber-600 dark:text-amber-400">
            다주택 중과(2주택 +20%p, 3주택 +30%p) 한시 배제는 2026.5.9.까지였습니다. 이후 양도분은 중과가 적용될 수 있으니 반드시 확인하세요.
          </p>
        )}
      </div>

      {/* 결과 */}
      {showResult && gain <= 0 && (
        <div className="rounded-xl border-2 border-muted bg-muted/20 p-6 text-center space-y-2">
          <p className="font-semibold text-lg">양도손실</p>
          <p className="text-sm text-muted-foreground">양도가액이 취득가액보다 낮아 납부세액이 없습니다.</p>
        </div>
      )}

      {showResult && gain > 0 && (
        <div className="rounded-xl border-2 border-primary bg-primary/5 p-6 space-y-4">
          <p className="text-sm font-medium text-muted-foreground text-center">납부세액 합계</p>

          {isNonTaxable ? (
            <div className="text-center space-y-2">
              <p className="text-3xl sm:text-4xl font-bold text-green-600 dark:text-green-400">비과세</p>
              <p className="text-sm text-muted-foreground">1세대 1주택 비과세 요건 충족 (12억 이하)</p>
            </div>
          ) : (
            <>
              <p className="text-3xl sm:text-4xl font-bold text-center text-primary">
                {fmtWon(Math.round(totalTax))}
              </p>
              <div className="space-y-2 pt-3 border-t border-primary/20 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">양도차익</span>
                  <span className="font-medium">{fmtWon(Math.round(gain))}</span>
                </div>
                {isHighPrice && (
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">과세대상 양도차익 (12억 초과분 비율)</span>
                    <span className="font-medium">{fmtWon(Math.round(taxableGain))}</span>
                  </div>
                )}
                {ltdAmount > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">장기보유특별공제 ({(ltdRate * 100).toFixed(0)}%)</span>
                    <span className="font-medium text-green-600 dark:text-green-400">−{fmtWon(Math.round(ltdAmount))}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">기본공제</span>
                  <span className="font-medium text-green-600 dark:text-green-400">−{fmtWon(Math.min(BASIC, Math.max(0, taxableGain - ltdAmount)))}</span>
                </div>
                <div className="flex justify-between font-semibold border-t pt-2">
                  <span className="text-muted-foreground">과세표준</span>
                  <span>{fmtWon(Math.round(taxBase))}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    양도소득세{" "}
                    ({isShort1 ? "단기 70%" : isShort2 ? "단기 60%" : `${(taxRate * 100).toFixed(0)}%`})
                  </span>
                  <span className="font-medium">{fmtWon(Math.round(incomeTax))}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">지방소득세 (10%)</span>
                  <span className="font-medium">{fmtWon(Math.round(localTax))}</span>
                </div>
              </div>
            </>
          )}

          {isHighPrice && (
            <p className="text-xs text-center text-amber-600 dark:text-amber-400 pt-1">
              고가주택 1세대 1주택 — 12억 초과분 비율에 해당하는 양도차익만 과세
            </p>
          )}
        </div>
      )}

      <p className="text-xs text-muted-foreground leading-relaxed">
        * 일반적인 주거용 주택 기준 추정값입니다. 실제 세액은 세무사 확인을 권장합니다.<br />
        * 장기보유특별공제: 1세대 1주택(거주 2년 이상)은 보유·거주 각 4%/년 최대 80%, 일반은 2%/년 최대 30%.<br />
        * 다주택 조정대상지역 중과(+20~30%p) 한시 배제는 2026.5.9.까지였습니다. 이후 양도분은 중과 적용 여부를 반드시 확인하세요.
      </p>
    </div>
  );
}
