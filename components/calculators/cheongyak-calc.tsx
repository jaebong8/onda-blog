"use client";
import { useState } from "react";

const HOMELESS_OPTIONS = [
  { label: "1년 미만", score: 2 },
  { label: "1년 이상 ~ 2년 미만", score: 4 },
  { label: "2년 이상 ~ 3년 미만", score: 6 },
  { label: "3년 이상 ~ 4년 미만", score: 8 },
  { label: "4년 이상 ~ 5년 미만", score: 10 },
  { label: "5년 이상 ~ 6년 미만", score: 12 },
  { label: "6년 이상 ~ 7년 미만", score: 14 },
  { label: "7년 이상 ~ 8년 미만", score: 16 },
  { label: "8년 이상 ~ 9년 미만", score: 18 },
  { label: "9년 이상 ~ 10년 미만", score: 20 },
  { label: "10년 이상 ~ 11년 미만", score: 22 },
  { label: "11년 이상 ~ 12년 미만", score: 24 },
  { label: "12년 이상 ~ 13년 미만", score: 26 },
  { label: "13년 이상 ~ 14년 미만", score: 28 },
  { label: "14년 이상 ~ 15년 미만", score: 30 },
  { label: "15년 이상", score: 32 },
];

const ACCOUNT_OPTIONS = [
  { label: "6개월 미만", score: 1 },
  { label: "6개월 이상 ~ 1년 미만", score: 2 },
  { label: "1년 이상 ~ 2년 미만", score: 3 },
  { label: "2년 이상 ~ 3년 미만", score: 4 },
  { label: "3년 이상 ~ 4년 미만", score: 5 },
  { label: "4년 이상 ~ 5년 미만", score: 6 },
  { label: "5년 이상 ~ 6년 미만", score: 7 },
  { label: "6년 이상 ~ 7년 미만", score: 8 },
  { label: "7년 이상 ~ 8년 미만", score: 9 },
  { label: "8년 이상 ~ 9년 미만", score: 10 },
  { label: "9년 이상 ~ 10년 미만", score: 11 },
  { label: "10년 이상 ~ 11년 미만", score: 12 },
  { label: "11년 이상 ~ 12년 미만", score: 13 },
  { label: "12년 이상 ~ 13년 미만", score: 14 },
  { label: "13년 이상 ~ 14년 미만", score: 15 },
  { label: "14년 이상 ~ 15년 미만", score: 16 },
  { label: "15년 이상", score: 17 },
];

function depScore(count: number) {
  if (count >= 6) return 35;
  return (count + 1) * 5;
}

export function CheongyakCalc() {
  const [hasHome, setHasHome] = useState(false);
  const [homelessIdx, setHomelessIdx] = useState(0);
  const [dependents, setDependents] = useState(0);
  const [accountIdx, setAccountIdx] = useState(0);

  const homeless = hasHome ? 0 : HOMELESS_OPTIONS[homelessIdx].score;
  const dep = depScore(dependents);
  const account = ACCOUNT_OPTIONS[accountIdx].score;
  const total = homeless + dep + account;

  return (
    <div className="max-w-lg mx-auto space-y-6">
      {/* 무주택 기간 */}
      <div className="rounded-lg border bg-card p-5 space-y-3">
        <div className="flex justify-between items-center">
          <span className="font-medium">무주택 기간</span>
          <span className="text-sm text-muted-foreground">최대 32점</span>
        </div>
        <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
          <input type="checkbox" checked={hasHome} onChange={(e) => setHasHome(e.target.checked)} className="rounded" />
          현재 주택 보유 (0점 적용)
        </label>
        {!hasHome && (
          <select
            value={homelessIdx}
            onChange={(e) => setHomelessIdx(Number(e.target.value))}
            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
          >
            {HOMELESS_OPTIONS.map((o, i) => (
              <option key={i} value={i}>{o.label} ({o.score}점)</option>
            ))}
          </select>
        )}
        <div className="text-right text-lg font-bold text-primary">{homeless}점</div>
      </div>

      {/* 부양가족 */}
      <div className="rounded-lg border bg-card p-5 space-y-3">
        <div className="flex justify-between items-center">
          <span className="font-medium">부양가족 수</span>
          <span className="text-sm text-muted-foreground">최대 35점</span>
        </div>
        <p className="text-xs text-muted-foreground">본인 제외. 배우자·직계존비속 등 동일 세대원</p>
        <div className="flex items-center gap-4">
          <button
            onClick={() => setDependents(Math.max(0, dependents - 1))}
            className="w-9 h-9 rounded-full border flex items-center justify-center text-xl font-bold hover:bg-muted transition-colors"
          >−</button>
          <span className="text-2xl font-bold w-10 text-center">{dependents}</span>
          <button
            onClick={() => setDependents(Math.min(6, dependents + 1))}
            className="w-9 h-9 rounded-full border flex items-center justify-center text-xl font-bold hover:bg-muted transition-colors"
          >+</button>
          <span className="text-sm text-muted-foreground">{dependents >= 6 ? "6명 이상" : `${dependents}명`}</span>
        </div>
        <div className="text-right text-lg font-bold text-primary">{dep}점</div>
      </div>

      {/* 청약통장 가입 기간 */}
      <div className="rounded-lg border bg-card p-5 space-y-3">
        <div className="flex justify-between items-center">
          <span className="font-medium">청약통장 가입 기간</span>
          <span className="text-sm text-muted-foreground">최대 17점</span>
        </div>
        <select
          value={accountIdx}
          onChange={(e) => setAccountIdx(Number(e.target.value))}
          className="w-full rounded-md border bg-background px-3 py-2 text-sm"
        >
          {ACCOUNT_OPTIONS.map((o, i) => (
            <option key={i} value={i}>{o.label} ({o.score}점)</option>
          ))}
        </select>
        <div className="text-right text-lg font-bold text-primary">{account}점</div>
      </div>

      {/* 결과 */}
      <div className="rounded-xl border-2 border-primary bg-primary/5 p-6 text-center space-y-4">
        <p className="text-sm text-muted-foreground font-medium">나의 청약 가점</p>
        <p className="text-7xl font-bold text-primary">{total}<span className="text-3xl">점</span></p>
        <p className="text-sm text-muted-foreground">만점 84점 기준</p>
        <div className="grid grid-cols-3 gap-3 pt-4 border-t border-primary/20 text-sm">
          <div>
            <p className="text-muted-foreground">무주택 기간</p>
            <p className="font-bold text-base mt-1">{homeless}점 <span className="text-muted-foreground font-normal">/32</span></p>
          </div>
          <div>
            <p className="text-muted-foreground">부양가족</p>
            <p className="font-bold text-base mt-1">{dep}점 <span className="text-muted-foreground font-normal">/35</span></p>
          </div>
          <div>
            <p className="text-muted-foreground">청약통장</p>
            <p className="font-bold text-base mt-1">{account}점 <span className="text-muted-foreground font-normal">/17</span></p>
          </div>
        </div>
      </div>

      <p className="text-xs text-muted-foreground leading-relaxed">
        * 「주택공급에 관한 규칙」 기준. 실제 가점은 단지별 모집공고 기준을 따르며 다를 수 있습니다.
      </p>
    </div>
  );
}
