"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { syncHygieneData, getHygienePrompt } from "@/lib/actions/hygiene";

const SI_DO_LIST = [
  "서울특별시", "부산광역시", "대구광역시", "인천광역시", "광주광역시",
  "대전광역시", "울산광역시", "세종특별자치시", "경기도", "강원도",
  "충청북도", "충청남도", "전라북도", "전라남도", "경상북도", "경상남도", "제주특별자치도",
];

export function SyncButton() {
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<string | null>(null);
  const router = useRouter();

  function handleSync() {
    startTransition(async () => {
      setResult(null);
      const res = await syncHygieneData(30);
      if ("error" in res && res.error) {
        setResult(`오류: ${res.error}`);
      } else {
        setResult(`완료: ${res.upserted}건 동기화 (전체 ${res.total}건 중)`);
        router.refresh();
      }
    });
  }

  return (
    <div className="space-y-2">
      <button
        onClick={handleSync}
        disabled={isPending}
        className="px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm hover:bg-primary/90 disabled:opacity-50 transition-colors"
      >
        {isPending ? "동기화 중..." : "최근 30일 데이터 동기화"}
      </button>
      {result && (
        <p className={`text-sm ${result.startsWith("오류") ? "text-destructive" : "text-green-600 dark:text-green-400"}`}>
          {result}
        </p>
      )}
    </div>
  );
}

export function CopyPromptButton({ siDoList }: { siDoList: string[] }) {
  const [isPending, startTransition] = useTransition();
  const [siDo, setSiDo] = useState(siDoList[0] ?? SI_DO_LIST[0]);
  const [siGunGu, setSiGunGu] = useState("");
  const [status, setStatus] = useState<"idle" | "copied" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [prompt, setPrompt] = useState("");

  const displayList = siDoList.length > 0 ? siDoList : SI_DO_LIST;

  function handleCopy() {
    startTransition(async () => {
      setStatus("idle");
      setPrompt("");
      const res = await getHygienePrompt(siDo, siGunGu.trim() || undefined);
      if ("error" in res && res.error) {
        setStatus("error");
        setErrorMsg(res.error);
        return;
      }
      const text = res.prompt ?? "";
      setPrompt(text);
      try {
        await navigator.clipboard.writeText(text);
        setStatus("copied");
        setTimeout(() => setStatus("idle"), 3000);
      } catch {
        // clipboard 실패 시 텍스트 영역 표시로 fallback
        setStatus("error");
        setErrorMsg("클립보드 복사 실패 — 아래 텍스트를 직접 복사하세요.");
      }
    });
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-2 flex-wrap items-center">
        <select
          value={siDo}
          onChange={(e) => { setSiDo(e.target.value); setStatus("idle"); setPrompt(""); }}
          className="px-3 py-2 rounded-md border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        >
          {displayList.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <input
          type="text"
          value={siGunGu}
          onChange={(e) => { setSiGunGu(e.target.value); setStatus("idle"); setPrompt(""); }}
          placeholder="시군구 (선택, 예: 강남구)"
          className="px-3 py-2 rounded-md border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring w-44"
        />
        <button
          onClick={handleCopy}
          disabled={isPending}
          className="flex items-center gap-2 px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm hover:bg-primary/90 disabled:opacity-50 transition-colors"
        >
          {isPending ? (
            "데이터 조회 중..."
          ) : status === "copied" ? (
            <>
              <svg viewBox="0 0 24 24" className="w-4 h-4 fill-none stroke-current" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
              복사됨!
            </>
          ) : (
            <>
              <svg viewBox="0 0 24 24" className="w-4 h-4 fill-none stroke-current" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184" />
              </svg>
              프롬프트 복사
            </>
          )}
        </button>
      </div>

      {status === "copied" && (
        <p className="text-sm text-green-600 dark:text-green-400">
          클립보드에 복사됐습니다. Claude.ai 또는 ChatGPT에 붙여넣으세요.
        </p>
      )}

      {status === "error" && (
        <div className="space-y-2">
          <p className="text-sm text-destructive">{errorMsg}</p>
          {prompt && (
            <textarea
              readOnly
              value={prompt}
              rows={8}
              className="w-full rounded-md border bg-muted px-3 py-2 text-xs font-mono resize-y focus:outline-none"
              onClick={(e) => (e.target as HTMLTextAreaElement).select()}
            />
          )}
        </div>
      )}
    </div>
  );
}
