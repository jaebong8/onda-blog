"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { syncHygieneData, generateHygienePost } from "@/lib/actions/hygiene";

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

export function GeneratePostButton({ siDoList }: { siDoList: string[] }) {
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<{ type: "success" | "error"; message: string; link?: string } | null>(null);
  const [siDo, setSiDo] = useState(siDoList[0] ?? SI_DO_LIST[0]);
  const [siGunGu, setSiGunGu] = useState("");
  const router = useRouter();

  function handleGenerate() {
    startTransition(async () => {
      setResult(null);
      const res = await generateHygienePost(siDo, siGunGu.trim() || undefined);
      if ("error" in res && res.error) {
        setResult({ type: "error", message: res.error });
      } else {
        setResult({
          type: "success",
          message: "초안 생성 완료!",
          link: `/admin/posts/${res.postId}/edit`,
        });
        router.refresh();
      }
    });
  }

  const displayList = siDoList.length > 0 ? siDoList : SI_DO_LIST;

  return (
    <div className="space-y-3">
      <div className="flex gap-2 flex-wrap">
        <select
          value={siDo}
          onChange={(e) => setSiDo(e.target.value)}
          className="px-3 py-2 rounded-md border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        >
          {displayList.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <input
          type="text"
          value={siGunGu}
          onChange={(e) => setSiGunGu(e.target.value)}
          placeholder="시군구 (선택, 예: 강남구)"
          className="px-3 py-2 rounded-md border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring w-48"
        />
        <button
          onClick={handleGenerate}
          disabled={isPending}
          className="px-4 py-2 rounded-md bg-green-600 text-white text-sm hover:bg-green-700 disabled:opacity-50 transition-colors"
        >
          {isPending ? "AI 생성 중..." : "AI 블로그 글 생성"}
        </button>
      </div>
      {result && (
        <p className={`text-sm ${result.type === "error" ? "text-destructive" : "text-green-600 dark:text-green-400"}`}>
          {result.message}{" "}
          {result.link && (
            <a href={result.link} className="underline font-medium">
              글 편집하기 →
            </a>
          )}
        </p>
      )}
    </div>
  );
}
