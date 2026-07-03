"use client";

import { deleteComment } from "./actions";

export function DeleteCommentButton({ id }: { id: string }) {
  return (
    <button
      type="button"
      className="text-xs text-destructive hover:underline shrink-0"
      onClick={async () => {
        if (!confirm("댓글을 삭제할까요? 답글도 함께 삭제됩니다.")) return;
        await deleteComment(id);
      }}
    >
      삭제
    </button>
  );
}
