import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { buttonVariants } from "@/components/ui/button";

export const dynamic = "force-dynamic";
import { formatDate } from "@/lib/utils/date";
import { DeletePostButton } from "@/components/admin/delete-post-button";

export default async function AdminPostsPage() {
  const posts = await prisma.post.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      title: true,
      slug: true,
      published: true,
      publishedAt: true,
      createdAt: true,
      category: { select: { name: true } },
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">글 관리</h1>
        <Link href="/admin/posts/new" className={buttonVariants()}>
          새 글 작성
        </Link>
      </div>

      <div className="border rounded-lg divide-y">
        {posts.length === 0 ? (
          <div className="px-4 py-10 text-center text-muted-foreground text-sm">
            작성된 글이 없습니다.
          </div>
        ) : (
          posts.map((post: { id: string; title: string; slug: string; published: boolean; publishedAt: Date | null; createdAt: Date; category: { name: string } | null }) => (
            <div key={post.id} className="flex items-center justify-between px-4 py-3 gap-4">
              <div className="flex items-center gap-3 min-w-0">
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
