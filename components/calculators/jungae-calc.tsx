"use client";
import { useState } from "react";

type DealType = "sale" | "jeonse" | "monthly";

function calcRentAmount(deposit: number, monthly: number): number {
  const base = deposit + monthly * 100;
  return base < 5000 ? base : deposit + monthly * 70;
}

function calcFee(type: DealType, amount: number): { rate: number; fee: number } {
  let rate: number;
  let limit: number | null = null;

  if (type === "sale") {
    if (amount < 5000)        { rate = 0.006; limit = 25; }
    else if (amount < 20000)  { rate = 0.005; limit = 80; }
    else if (amount < 90000)  { rate = 0.004; }
    else if (amount < 120000) { rate = 0.005; }
    else if (amount < 150000) { rate = 0.006; }
    else                      { rate = 0.007; }
  } else {
    if (amount < 5000)         { rate = 0.005; limit = 20; }
    else if (amount < 10000)   { rate = 0.004; limit = 30; }
    else if (amount < 60000)   { rate = 0.003; }
    else if (amount < 120000)  { rate = 0.004; }
    else if (amount < 150000)  { rate = 0.005; }
    else                       { rate = 0.006; }
  }

  const raw = amount * rate;
  const fee = limit !== null ? Math.min(raw, limit) : raw;
  return { rate, fee };
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

export function JungaeCalc() {
  const [dealType, setDealType] = useState<DealType>("sale");
  const [saleAmount, setSaleAmount] = useState("");
  const [jeonseAmount, setJeonseAmount] = useState("");
  const [monthlyDeposit, setMonthlyDeposit] = useState("");
  const [monthlyRent, setMonthlyRent] = useState("");

  let tradeAmount = 0;
  if (dealType === "sale") tradeAmount = Number(saleAmount) || 0;
  else if (dealType === "jeonse") tradeAmount = Number(jeonseAmount) || 0;
  else tradeAmount = calcRentAmount(Number(monthlyDeposit) || 0, Number(monthlyRent) || 0);

  const { rate, fee } = calcFee(dealType, tradeAmount);
  const vat = fee * 1.1;

  const inputClass = "w-full rounded-md border bg-background px-3 py-2 text-sm";

  return (
    <div className="max-w-lg mx-auto space-y-6">
      {/* 거래 유형 */}
      <div className="rounded-lg border bg-card p-5 space-y-3">
        <span className="font-medium">거래 유형</span>
        <div className="flex gap-2">
          {(["sale", "jeonse", "monthly"] as DealType[]).map((t) => (
            <button
              key={t}
              onClick={() => setDealType(t)}
              className={`flex-1 py-2 rounded-md text-sm font-medium border transition-colors ${
                dealType === t ? "bg-primary text-primary-foreground border-primary" : "hover:bg-muted"
              }`}
            >
              {t === "sale" ? "매매" : t === "jeonse" ? "전세" : "월세"}
            </button>
          ))}
        </div>
      </div>

      {/* 금액 입력 */}
      <div className="rounded-lg border bg-card p-5 space-y-4">
        <span className="font-medium">거래금액</span>
        {dealType === "sale" && (
          <div className="space-y-1.5">
            <label className="text-sm text-muted-foreground">매매가</label>
            <div className="relative">
              <input type="number" value={saleAmount} onChange={(e) => setSaleAmount(e.target.value)}
                placeholder="30000" className={inputClass} min="0" />
              <span className="absolute right-3 top-2 text-sm text-muted-foreground">만원</span>
            </div>
            {Number(saleAmount) > 0 && <p className="text-xs text-muted-foreground">{fmtWon(Number(saleAmount))}</p>}
          </div>
        )}
        {dealType === "jeonse" && (
          <div className="space-y-1.5">
            <label className="text-sm text-muted-foreground">전세보증금</label>
            <div className="relative">
              <input type="number" value={jeonseAmount} onChange={(e) => setJeonseAmount(e.target.value)}
                placeholder="30000" className={inputClass} min="0" />
              <span className="absolute right-3 top-2 text-sm text-muted-foreground">만원</span>
            </div>
            {Number(jeonseAmount) > 0 && <p className="text-xs text-muted-foreground">{fmtWon(Number(jeonseAmount))}</p>}
          </div>
        )}
        {dealType === "monthly" && (
          <>
            <div className="space-y-1.5">
              <label className="text-sm text-muted-foreground">보증금</label>
              <div className="relative">
                <input type="number" value={monthlyDeposit} onChange={(e) => setMonthlyDeposit(e.target.value)}
                  placeholder="1000" className={inputClass} min="0" />
                <span className="absolute right-3 top-2 text-sm text-muted-foreground">만원</span>
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm text-muted-foreground">월세</label>
              <div className="relative">
                <input type="number" value={monthlyRent} onChange={(e) => setMonthlyRent(e.target.value)}
                  placeholder="80" className={inputClass} min="0" />
                <span className="absolute right-3 top-2 text-sm text-muted-foreground">만원/월</span>
              </div>
            </div>
            {tradeAmount > 0 && (
              <p className="text-xs text-muted-foreground">환산 거래금액: {fmtWon(tradeAmount)}</p>
            )}
          </>
        )}
      </div>

      {/* 결과 */}
      {tradeAmount > 0 && (
        <div className="rounded-xl border-2 border-primary bg-primary/5 p-6 space-y-4">
          <p className="text-sm font-medium text-muted-foreground text-center">공인중개사 수수료 (상한액 기준)</p>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <p className="text-xs text-muted-foreground mb-1">수수료 (VAT 별도)</p>
              <p className="text-2xl font-bold text-primary">{fmtWon(Math.ceil(fee))}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-muted-foreground mb-1">VAT 포함 (×1.1)</p>
              <p className="text-2xl font-bold">{fmtWon(Math.ceil(vat))}</p>
            </div>
          </div>
          <div className="pt-3 border-t border-primary/20 text-sm text-center text-muted-foreground">
            적용 요율: {(rate * 100).toFixed(1)}% (상한)
            {fee < tradeAmount * rate && ` · 한도 ${fmtWon(fee)} 적용`}
          </div>
        </div>
      )}

      <p className="text-xs text-muted-foreground leading-relaxed">
        * 2021년 10월 개정 기준 상한 요율입니다. 실제 수수료는 협의에 따라 다를 수 있습니다.<br />
        * 월세 거래금액: 보증금 + 월세×100 (5천만원 초과 시 보증금 + 월세×70) 적용.
      </p>
    </div>
  );
}
