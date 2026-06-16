"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { formatDate } from "@/lib/utils/date";
import { deletePosts } from "@/lib/actions/post";
import { DeletePostButton } from "@/components/admin/delete-post-button";

type PostRow = {
  id: string;
  title: string;
  slug: string;
  published: boolean;
  publishedAt: Date | null;
  createdAt: Date;
  category: { name: string } | null;
};

export function PostsManager({ posts }: { posts: PostRow[] }) {
  const router = useRouter();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [isPending, startTransition] = useTransition();

  const allSelected = posts.length > 0 && selected.size === posts.length;

  function toggleAll() {
    setSelected(allSelected ? new Set() : new Set(posts.map((p) => p.id)));
  }

  function toggleOne(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function handleBulkDelete() {
    if (selected.size === 0) return;
    if (!confirm(`선택한 ${selected.size}개의 글을 삭제하시겠습니까?`)) return;
    startTransition(async () => {
      await deletePosts(Array.from(selected));
      setSelected(new Set());
      router.refresh();
    });
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between px-1">
        <label className="flex items-center gap-2 text-sm text-muted-foreground">
          <input
            type="checkbox"
            checked={allSelected}
            onChange={toggleAll}
            disabled={posts.length === 0}
            className="size-4 rounded border-border accent-primary"
          />
          전체 선택
        </label>
        {selected.size > 0 && (
          <button
            type="button"
            onClick={handleBulkDelete}
            disabled={isPending}
            className="text-xs text-destructive hover:text-destructive/80 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {isPending ? "삭제 중..." : `선택 삭제 (${selected.size})`}
          </button>
        )}
      </div>

      <div className="border rounded-lg divide-y">
        {posts.length === 0 ? (
          <div className="px-4 py-10 text-center text-muted-foreground text-sm">
            작성된 글이 없습니다.
          </div>
        ) : (
          posts.map((post) => (
            <div key={post.id} className="flex items-center justify-between px-4 py-3 gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <input
                  type="checkbox"
                  checked={selected.has(post.id)}
                  onChange={() => toggleOne(post.id)}
                  className="size-4 shrink-0 rounded border-border accent-primary"
                />
                <span
                  className={`shrink-0 text-xs px-2 py-0.5 rounded-full ${
                    post.published
                      ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                      : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
                  }`}
                >
                  {post.published ? "발행" : "임시저장"}
                </span>
                <span className="text-sm font-medium truncate">{post.title}</span>
                {post.category && (
                  <span className="text-xs text-muted-foreground shrink-0">
                    {post.category.name}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <span className="text-xs text-muted-foreground hidden sm:block">
                  {formatDate(post.createdAt)}
                </span>
                <Link
                  href={`/admin/posts/${post.id}/edit`}
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  편집
                </Link>
                {post.published && (
                  <Link
                    href={`/posts/${post.slug}`}
                    target="_blank"
                    className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    보기
                  </Link>
                )}
                <DeletePostButton id={post.id} />
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
