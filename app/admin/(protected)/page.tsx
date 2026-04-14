import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { buttonVariants } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const [totalPosts, publishedPosts, draftPosts] = await Promise.all([
    prisma.post.count(),
    prisma.post.count({ where: { published: true } }),
    prisma.post.count({ where: { published: false } }),
  ]);

  const recentPosts = await prisma.post.findMany({
    orderBy: { createdAt: "desc" },
    take: 5,
    select: {
      id: true,
      title: true,
      published: true,
      createdAt: true,
    },
  });

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">대시보드</h1>
        <Link href="/admin/posts/new" className={buttonVariants()}>
          새 글 작성
        </Link>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="border rounded-lg p-4 space-y-1">
          <p className="text-sm text-muted-foreground">전체 글</p>
          <p className="text-3xl font-bold">{totalPosts}</p>
        </div>
        <div className="border rounded-lg p-4 space-y-1">
          <p className="text-sm text-muted-foreground">발행된 글</p>
          <p className="text-3xl font-bold">{publishedPosts}</p>
        </div>
        <div className="border rounded-lg p-4 space-y-1">
          <p className="text-sm text-muted-foreground">임시저장</p>
          <p className="text-3xl font-bold">{draftPosts}</p>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold">최근 글</h2>
        <div className="border rounded-lg divide-y">
          {recentPosts.length === 0 ? (
            <div className="px-4 py-6 text-center text-muted-foreground text-sm">
              작성된 글이 없습니다.
            </div>
          ) : (
            recentPosts.map((post: { id: string; title: string; published: boolean; createdAt: Date }) => (
              <div key={post.id} className="flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-3">
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full ${
                      post.published
                        ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                        : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
                    }`}
                  >
                    {post.published ? "발행" : "임시저장"}
                  </span>
                  <span className="text-sm font-medium">{post.title}</span>
                </div>
                <Link
                  href={`/admin/posts/${post.id}/edit`}
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  편집
                </Link>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
