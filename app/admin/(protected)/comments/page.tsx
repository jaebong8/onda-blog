import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import Link from "next/link";

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

  async function deleteComment(formData: FormData) {
    "use server";
    const id = formData.get("id") as string;
    // 답글(자식) 먼저 삭제 (onDelete: NoAction이라 cascade 안 됨)
    await prisma.comment.deleteMany({ where: { parentId: id } });
    await prisma.comment.delete({ where: { id } });
    revalidatePath("/admin/comments");
  }

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
          <div key={c.id} className="px-4 py-4 space-y-2">
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
              <form action={deleteComment} className="shrink-0">
                <input type="hidden" name="id" value={c.id} />
                <button
                  type="submit"
                  className="text-xs text-destructive hover:underline"
                  onClick={(e) => {
                    if (!confirm("댓글을 삭제할까요? 답글도 함께 삭제됩니다.")) e.preventDefault();
                  }}
                >
                  삭제
                </button>
              </form>
            </div>
          </div>
        ))}
      </div>

      {/* 페이지네이션 */}
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
