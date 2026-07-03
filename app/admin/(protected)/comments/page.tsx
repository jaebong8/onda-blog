import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { DeleteCommentButton } from "./delete-button";
import { ReplyForm } from "./reply-form";

export const dynamic = "force-dynamic";

export default async function AdminCommentsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page: pageParam } = await searchParams;
  const page = Math.max(1, Number(pageParam ?? 1));
  const PAGE_SIZE = 20;

  const [total, comments] = await Promise.all([
    prisma.comment.count(),
    prisma.comment.findMany({
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: {
        id: true,
        content: true,
        createdAt: true,
        parentId: true,
        author: { select: { name: true, email: true } },
        post: { select: { id: true, title: true, slug: true } },
        _count: { select: { likes: true, replies: true } },
      },
    }),
  ]);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">댓글 관리</h1>
        <span className="text-sm text-muted-foreground">총 {total.toLocaleString()}개</span>
      </div>

      <div className="border rounded-lg divide-y">
        {comments.length === 0 ? (
          <p className="px-4 py-10 text-center text-sm text-muted-foreground">댓글이 없습니다.</p>
        ) : comments.map((c) => (
          <div key={c.id} className="px-4 py-4">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  {c.parentId && (
                    <span className="text-xs bg-muted px-1.5 py-0.5 rounded">답글</span>
                  )}
                  <span className="text-sm font-medium">{c.author.name}</span>
                  <span className="text-xs text-muted-foreground">{c.author.email}</span>
                  <span className="text-xs text-muted-foreground">
                    {c.createdAt.toLocaleString("ko-KR", { dateStyle: "short", timeStyle: "short" })}
                  </span>
                  <span className="text-xs text-muted-foreground">❤ {c._count.likes}</span>
                  {c._count.replies > 0 && (
                    <span className="text-xs text-muted-foreground">💬 답글 {c._count.replies}</span>
                  )}
                </div>
                <p className="text-sm whitespace-pre-wrap wrap-break-word">{c.content}</p>
                <Link
                  href={`/posts/${c.post.slug}`}
                  target="_blank"
                  className="text-xs text-muted-foreground hover:text-foreground truncate block"
                >
                  ↳ {c.post.title}
                </Link>
              </div>
              <DeleteCommentButton id={c.id} />
            </div>
            {/* 답글은 최상위 댓글(parentId 없음)에만 달 수 있음 */}
            {!c.parentId && (
              <ReplyForm parentId={c.id} postId={c.post.id} />
            )}
          </div>
        ))}
      </div>

      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          {page > 1 && (
            <Link href={`?page=${page - 1}`} className="text-sm px-3 py-1 border rounded hover:bg-muted">이전</Link>
          )}
          <span className="text-sm px-3 py-1">{page} / {totalPages}</span>
          {page < totalPages && (
            <Link href={`?page=${page + 1}`} className="text-sm px-3 py-1 border rounded hover:bg-muted">다음</Link>
          )}
        </div>
      )}
    </div>
  );
}
