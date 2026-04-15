"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { deletePost } from "@/lib/actions/post";

export function DeletePostButton({ id }: { id: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    if (!confirm("정말 삭제하시겠습니까?")) return;
    startTransition(async () => {
      await deletePost(id);
      router.refresh();
    });
  }

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={isPending}
      className="text-xs text-destructive hover:text-destructive/80 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
    >
      {isPending ? "삭제 중..." : "삭제"}
    </button>
  );
}
