"use client";
import { useState } from "react";

// 증여세 누진세율 (상속세 및 증여세법 §56, 만원 기준)
const BRACKETS = [
  { limit: 10000,    rate: 0.10, ded: 0 },
  { limit: 50000,    rate: 0.20, ded: 1000 },
  { limit: 100000,   rate: 0.30, ded: 6000 },
  { limit: 300000,   rate: 0.40, ded: 16000 },
  { limit: Infinity, rate: 0.50, ded: 46000 },
];

function calcTax(base: number): number {
  if (base <= 0) return 0;
  for (const b of BRACKETS) {
    if (base <= b.limit) return Math.max(0, base * b.rate - b.ded);
  }
  return 0;
}

type Relation = "spouse" | "lineal_asc" | "lineal_desc" | "relative" | "other";

const RELATIONS: { value: Relation; label: string; subLabel: string; deductionAdult: number; deductionMinor?: number }[] = [
  { value: "lineal_asc",  label: "직계존속으로부터", subLabel: "부모·조부모 → 자녀·손자",           deductionAdult: 5000,  deductionMinor: 2000 },
  { value: "spouse",      label: "배우자로부터",     subLabel: "배우자 간 증여",                    deductionAdult: 60000 },
  { value: "lineal_desc", label: "직계비속으로부터", subLabel: "자녀·손자 → 부모·조부모",           deductionAdult: 5000 },
  { value: "relative",    label: "기타 친족으로부터", subLabel: "6촌 이내 혈족, 4촌 이내 인척",     deductionAdult: 1000 },
  { value: "other",       label: "타인으로부터",     subLabel: "친족 외 제3자",                    deductionAdult: 0 },
];

function getDeduction(rel: Relation, isMinor: boolean): number {
  const r = RELATIONS.find(x => x.value === rel)!;
  return (isMinor && r.deductionMinor !== undefined) ? r.deductionMinor : r.deductionAdult;
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

export function JeungyeCalc() {
  const [amount, setAmount]       = useState("");
  const [prior, setPrior]         = useState("");
  const [relation, setRelation]   = useState<Relation>("lineal_asc");
  const [isMinor, setIsMinor]     = useState(false);
  const [isSkipGen, setIsSkipGen] = useState(false);
  const [willReport, setWillReport] = useState(true);

  const amt      = Number(amount) || 0;
  const priorAmt = Number(prior)  || 0;
  const deduction = getDeduction(relation, isMinor);

  // 10년 합산 기준 과세표준
  const combinedBase = Math.max(0, amt + priorAmt - deduction);
  const priorBase    = Math.max(0, priorAmt - deduction);

  // 이번 증여분 산출세액 (합산 세액 – 과거분 세액)
  const tax = Math.max(0, calcTax(combinedBase) - calcTax(priorBase));

  // 세대생략 할증 (§57): 30%, 수증자 미성년 & 증여재산 20억 초과는 40%
  let surcharge = 0;
  if (isSkipGen && relation === "lineal_asc") {
    surcharge = tax * ((isMinor && amt > 200000) ? 0.40 : 0.30);
  }

  // 신고세액공제 3% (§69)
  const taxBeforeDiscount = tax + surcharge;
  const reportDiscount    = willReport ? taxBeforeDiscount * 0.03 : 0;
  const finalTax          = Math.max(0, taxBeforeDiscount - reportDiscount);

  const showResult = amt > 0;
  const isTaxable  = combinedBase > 0;
  const effectiveTaxBase = combinedBase - priorBase;  // 이번 분 실질 과세표준

  const inputClass = "w-full rounded-md border bg-background px-3 py-2 text-sm";

  return (
    <div className="max-w-lg mx-auto space-y-6">
      {/* 증여가액 */}
      <div className="rounded-lg border bg-card p-5 space-y-4">
        <span className="font-medium">증여가액</span>
        <div className="space-y-1.5">
          <label className="text-sm text-muted-foreground">이번 증여가액</label>
          <div className="relative">
            <input type="number" value={amount} onChange={e => setAmount(e.target.value)}
              placeholder="50000" className={inputClass} min="0" />
            <span className="absolute right-3 top-2 text-sm text-muted-foreground">만원</span>
          </div>
          {amt > 0 && <p className="text-xs text-muted-foreground">{fmtWon(amt)}</p>}
        </div>
        <div className="space-y-1.5">
          <label className="text-sm text-muted-foreground">
            10년 내 동일인으로부터 기존 증여액
            <span className="ml-1 text-xs opacity-60">없으면 0</span>
          </label>
          <div className="relative">
            <input type="number" value={prior} onChange={e => setPrior(e.target.value)}
              placeholder="0" className={inputClass} min="0" />
            <span className="absolute right-3 top-2 text-sm text-muted-foreground">만원</span>
          </div>
          {priorAmt > 0 && (
            <p className="text-xs text-muted-foreground">합산 {fmtWon(amt + priorAmt)}</p>
          )}
        </div>
      </div>

      {/* 관계 */}
      <div className="rounded-lg border bg-card p-5 space-y-3">
        <span className="font-medium">증여자 관계 (수증자 기준)</span>
        <div className="space-y-2.5">
          {RELATIONS.map(r => (
            <label key={r.value} className="flex items-start gap-2.5 cursor-pointer">
              <input type="radio" checked={relation === r.value}
                onChange={() => { setRelation(r.value); setIsMinor(false); setIsSkipGen(false); }}
                className="mt-0.5 shrink-0" />
              <div className="flex-1 min-w-0">
                <span className="text-sm font-medium">{r.label}</span>
                <span className="ml-2 text-xs text-muted-foreground">{r.subLabel}</span>
              </div>
              <span className="shrink-0 text-xs text-muted-foreground">
                공제 {r.deductionAdult >= 10000
                  ? `${r.deductionAdult / 10000}억`
                  : r.deductionAdult > 0
                  ? `${r.deductionAdult.toLocaleString()}만원`
                  : "없음"}
              </span>
            </label>
          ))}
        </div>

        {relation === "lineal_asc" && (
          <div className="space-y-2 pt-2 border-t">
            <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
              <input type="checkbox" checked={isMinor}
                onChange={e => setIsMinor(e.target.checked)} className="rounded" />
              수증자가 미성년자 (공제 5천만 → 2천만원)
            </label>
            <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
              <input type="checkbox" checked={isSkipGen}
                onChange={e => setIsSkipGen(e.target.checked)} className="rounded" />
              세대생략 증여 (조부모→손자 등, 산출세액 30% 할증)
              {isMinor && isSkipGen && amt > 200000 && (
                <span className="text-xs text-amber-600 dark:text-amber-400">미성년·20억↑ → 40%</span>
              )}
            </label>
          </div>
        )}
      </div>

      {/* 신고 */}
      <div className="rounded-lg border bg-card p-5 space-y-2">
        <span className="font-medium">신고</span>
        <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
          <input type="checkbox" checked={willReport}
            onChange={e => setWillReport(e.target.checked)} className="rounded" />
          신고기한 내 자진신고 (신고세액공제 3%)
        </label>
        <p className="text-xs text-muted-foreground">신고기한: 증여일이 속하는 달의 말일로부터 3개월 이내</p>
      </div>

      {/* 결과 */}
      {showResult && (
        <div className={`rounded-xl border-2 p-6 space-y-4 ${
          isTaxable ? "border-primary bg-primary/5" : "border-muted bg-muted/20"
        }`}>
          <p className="text-sm font-medium text-muted-foreground text-center">납부세액</p>

          {!isTaxable ? (
            <div className="text-center space-y-2">
              <p className="text-3xl sm:text-4xl font-bold text-green-600 dark:text-green-400">0원</p>
              <p className="text-sm text-muted-foreground">
                증여재산공제 ({fmtWon(deduction)}) 이하 — 납부세액 없음
              </p>
            </div>
          ) : (
            <>
              <p className="text-3xl sm:text-4xl font-bold text-center text-primary">
                {fmtWon(Math.round(finalTax))}
              </p>
              <div className="space-y-2 pt-3 border-t border-primary/20 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">이번 증여가액</span>
                  <span className="font-medium">{fmtWon(amt)}</span>
                </div>
                {priorAmt > 0 && (
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">10년 합산 증여가액</span>
                    <span className="font-medium">{fmtWon(amt + priorAmt)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">증여재산공제</span>
                  <span className="font-medium text-green-600 dark:text-green-400">
                    −{fmtWon(Math.min(deduction, amt + priorAmt))}
                  </span>
                </div>
                <div className="flex justify-between font-semibold border-t pt-2">
                  <span className="text-muted-foreground">이번 분 과세표준</span>
                  <span>{fmtWon(Math.max(0, effectiveTaxBase))}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">산출세액</span>
                  <span className="font-medium">{fmtWon(Math.round(tax))}</span>
                </div>
                {surcharge > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      세대생략 할증 ({isMinor && amt > 200000 ? "40%" : "30%"})
                    </span>
                    <span className="font-medium">{fmtWon(Math.round(surcharge))}</span>
                  </div>
                )}
                {reportDiscount > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">신고세액공제 (3%)</span>
                    <span className="font-medium text-green-600 dark:text-green-400">
                      −{fmtWon(Math.round(reportDiscount))}
                    </span>
                  </div>
                )}
                <div className="flex justify-between font-bold border-t pt-2 text-base">
                  <span>납부세액</span>
                  <span className="text-primary">{fmtWon(Math.round(finalTax))}</span>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      <p className="text-xs text-muted-foreground leading-relaxed">
        * 부동산·현금 증여 기준 추정값입니다. 창업자금·가업승계 주식 등 특례세율 대상은 적용되지 않습니다.<br />
        * 증여재산공제는 동일인(직계존속은 부·모 합산)으로부터 10년간 증여받은 금액을 합산 적용합니다.<br />
        * 부동산 증여 시 취득세(일반 3.5%, 조정대상지역 12%)가 별도 부과됩니다.<br />
        * 10년 내 기존 증여가 있는 경우 과거 납부세액 공제는 반영되지 않아 실제 납부액과 다를 수 있습니다.
      </p>
    </div>
  );
}
