"use client";

import { useState, useTransition } from "react";
import { replyToComment } from "./actions";

export function ReplyForm({ parentId, postId }: { parentId: string; postId: string }) {
  const [open, setOpen] = useState(false);
  const [content, setContent] = useState("");
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    startTransition(async () => {
      try {
        await replyToComment(parentId, postId, content);
        setContent("");
        setOpen(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : "오류가 발생했습니다.");
      }
    });
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-xs text-muted-foreground hover:text-foreground"
      >
        답글
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mt-3 space-y-2">
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="답글을 입력하세요..."
        rows={3}
        autoFocus
        className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
      />
      {error && <p className="text-xs text-destructive">{error}</p>}
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={isPending || !content.trim()}
          className="text-xs px-3 py-1.5 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
        >
          {isPending ? "등록 중..." : "등록"}
        </button>
        <button
          type="button"
          onClick={() => { setOpen(false); setContent(""); setError(""); }}
          className="text-xs px-3 py-1.5 rounded-md border hover:bg-muted transition-colors"
        >
          취소
        </button>
      </div>
    </form>
  );
}
