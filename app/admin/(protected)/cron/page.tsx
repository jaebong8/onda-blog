"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

type SidoResult = {
  sido: string;
  status: string;
  count?: number;
  jeonseCount?: number;
  wolseCount?: number;
  failed?: number;
  total?: number;
};

type CronResult = {
  ok: boolean;
  dealYmd: string;
  revalidated?: string;
  results: SidoResult[];
};

type State = { loading: boolean; data: CronResult | null; error: string | null };

function prevMonthLabel() {
  const d = new Date();
  d.setMonth(d.getMonth() - 1);
  return `${d.getFullYear()}년 ${String(d.getMonth() + 1).padStart(2, "0")}월`;
}

function StatusBadge({ status, count, jeonseCount, wolseCount, failed, total }: SidoResult) {
  if (status === "ok") {
    const detail = count !== undefined
      ? `${count}건`
      : `전세 ${jeonseCount ?? 0}건 · 월세 ${wolseCount ?? 0}건`;
    return (
      <span className="text-green-600 dark:text-green-400">
        ✓ {detail}
        {failed ? (
          <span className="text-amber-600 dark:text-amber-500 ml-1.5" title={`${total}개 중 ${failed}개 시군구 조회 실패 — 순위가 일부 누락됐을 수 있습니다`}>
            (시군구 {failed}개 누락)
          </span>
        ) : null}
      </span>
    );
  }
  if (status === "partial_failure") {
    return (
      <span className="text-amber-600 dark:text-amber-500" title="조회 실패가 많아 순위를 신뢰할 수 없어 발행하지 않았습니다">
        발행 안 함 ({total}개 중 {failed}개 실패)
      </span>
    );
  }
  if (status === "no_deals" || status === "no_lawdcds") {
    return <span className="text-muted-foreground">데이터 없음</span>;
  }
  if (status.startsWith("error")) {
    return <span className="text-red-500 truncate max-w-[200px]" title={status}>오류</span>;
  }
  return <span className="text-muted-foreground">{status}</span>;
}

function CronCard({ title, type }: { title: string; type: "apt-price" | "apt-rent" }) {
  const [state, setState] = useState<State>({ loading: false, data: null, error: null });

  async function handleRun() {
    setState({ loading: true, data: null, error: null });
    try {
      const res = await fetch("/api/admin/cron", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "실행 실패");
      setState({ loading: false, data, error: null });
    } catch (e) {
      setState({ loading: false, data: null, error: String(e) });
    }
  }

  const okCount = state.data?.results.filter((r) => r.status === "ok").length ?? 0;
  const errCount = state.data?.results.filter((r) => r.status.startsWith("error")).length ?? 0;
  const skipCount = state.data?.results.filter((r) => r.status === "partial_failure").length ?? 0;

  return (
    <div className="border rounded-lg p-6 space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="font-semibold">{title}</h2>
          <p className="text-xs text-muted-foreground mt-0.5">대상: {prevMonthLabel()}</p>
        </div>
        <Button onClick={handleRun} disabled={state.loading} className="shrink-0">
          {state.loading ? (
            <span className="flex items-center gap-2">
              <span className="size-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
              실행 중…
            </span>
          ) : "실행"}
        </Button>
      </div>

      {state.loading && (
        <p className="text-sm text-muted-foreground">
          35개 시도 순차 처리 중입니다. 수 분 소요됩니다…
        </p>
      )}

      {state.data && (
        <div className="space-y-2">
          <p className="text-sm font-medium">
            완료 — 성공 {okCount}개
            {skipCount > 0 && <span className="text-amber-600 dark:text-amber-500 ml-2">발행 안 함 {skipCount}개</span>}
            {errCount > 0 && <span className="text-red-500 ml-2">오류 {errCount}개</span>}
          </p>
          {state.data.revalidated && (
            <p className="text-xs text-muted-foreground">
              프로덕션 캐시 무효화: {state.data.revalidated}
            </p>
          )}
          <div className="border rounded-md divide-y max-h-72 overflow-y-auto text-sm">
            {state.data.results.map((r) => (
              <div key={r.sido} className="flex items-center justify-between px-3 py-2 gap-4">
                <span className="text-muted-foreground">{r.sido}</span>
                <StatusBadge {...r} />
              </div>
            ))}
          </div>
        </div>
      )}

      {state.error && (
        <p className="text-sm text-red-500 border border-red-200 rounded-md px-3 py-2 bg-red-50 dark:bg-red-950/30">
          {state.error}
        </p>
      )}
    </div>
  );
}

export default function AdminCronPage() {
  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold">자동발행</h1>
        <p className="text-sm text-muted-foreground mt-1">
          매월 1일 실행. 전월 국토교통부 실거래 데이터를 수집해 포스트를 자동 발행합니다.
          로컬 dev 서버에서 실행해야 정상 동작합니다.
        </p>
      </div>

      <CronCard title="아파트 매매 실거래가 TOP10" type="apt-price" />
      <CronCard title="아파트 전월세 실거래가 TOP10" type="apt-rent" />
    </div>
  );
}
