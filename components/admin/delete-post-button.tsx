"use client";

import { useRouter } from "next/navigation";
import { deletePost } from "@/lib/actions/post";

export function DeletePostButton({ id }: { id: string }) {
  const router = useRouter();

  async function handleDelete() {
    if (!confirm("정말 삭제하시겠습니까?")) return;
    await deletePost(id);
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={handleDelete}
      className="text-xs text-destructive hover:text-destructive/80 transition-colors"
    >
      삭제
    </button>
  );
}
