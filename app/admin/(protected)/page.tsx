import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { buttonVariants } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const [
    totalPosts, publishedPosts, draftPosts,
    totalComments, totalViews, totalLikes,
    totalCategories, totalTags,
  ] = await Promise.all([
    prisma.post.count(),
    prisma.post.count({ where: { published: true } }),
    prisma.post.count({ where: { published: false } }),
    prisma.comment.count(),
    prisma.post.aggregate({ _sum: { views: true } }),
    prisma.postLike.count(),
    prisma.category.count(),
    prisma.tag.count(),
  ]);

  const [recentPosts, recentComments, categoryStats] = await Promise.all([
    prisma.post.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      select: { id: true, title: true, published: true, createdAt: true, views: true, _count: { select: { comments: true } } },
    }),
    prisma.comment.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        id: true,
        content: true,
        createdAt: true,
        author: { select: { name: true } },
        post: { select: { id: true, title: true } },
      },
    }),
    prisma.category.findMany({
      select: { name: true, _count: { select: { posts: true } } },
      orderBy: { posts: { _count: "desc" } },
      take: 6,
    }),
  ]);

  const views = totalViews._sum.views ?? 0;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">대시보드</h1>
        <Link href="/admin/posts/new" className={buttonVariants()}>
          새 글 작성
        </Link>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "전체 글", value: totalPosts },
          { label: "발행된 글", value: publishedPosts },
          { label: "총 조회수", value: views.toLocaleString() },
          { label: "총 댓글", value: totalComments },
          { label: "글 좋아요", value: totalLikes },
          { label: "임시저장", value: draftPosts },
          { label: "카테고리", value: totalCategories },
          { label: "태그", value: totalTags },
        ].map(({ label, value }) => (
          <div key={label} className="border rounded-lg p-4 space-y-1">
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="text-2xl font-bold">{value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* 최근 글 */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold">최근 글</h2>
            <Link href="/admin/posts" className="text-xs text-muted-foreground hover:text-foreground">전체 보기</Link>
          </div>
          <div className="border rounded-lg divide-y">
            {recentPosts.length === 0 ? (
              <p className="px-4 py-6 text-center text-sm text-muted-foreground">글이 없습니다.</p>
            ) : recentPosts.map((post) => (
              <div key={post.id} className="flex items-center justify-between px-4 py-3 gap-3">
                <div className="flex items-center gap-2 min-w-0">
                  <span className={`shrink-0 text-xs px-2 py-0.5 rounded-full ${post.published ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300" : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"}`}>
                    {post.published ? "발행" : "임시"}
                  </span>
                  <span className="text-sm font-medium truncate">{post.title}</span>
                </div>
                <div className="flex items-center gap-3 shrink-0 text-xs text-muted-foreground">
                  <span>👁 {post.views}</span>
                  <span>💬 {post._count.comments}</span>
                  <Link href={`/admin/posts/${post.id}/edit`} className="hover:text-foreground">편집</Link>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 최근 댓글 */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold">최근 댓글</h2>
            <Link href="/admin/comments" className="text-xs text-muted-foreground hover:text-foreground">전체 보기</Link>
          </div>
          <div className="border rounded-lg divide-y">
            {recentComments.length === 0 ? (
              <p className="px-4 py-6 text-center text-sm text-muted-foreground">댓글이 없습니다.</p>
            ) : recentComments.map((c) => (
              <div key={c.id} className="px-4 py-3 space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-medium">{c.author.name}</span>
                  <span className="text-xs text-muted-foreground">{c.createdAt.toLocaleDateString("ko-KR")}</span>
                </div>
                <p className="text-sm text-muted-foreground truncate">{c.content}</p>
                <p className="text-xs text-muted-foreground truncate">↳ {c.post.title}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 카테고리별 글 수 */}
      {categoryStats.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-base font-semibold">카테고리별 글 수</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {categoryStats.map((cat) => (
              <div key={cat.name} className="border rounded-lg px-4 py-3 flex items-center justify-between">
                <span className="text-sm">{cat.name}</span>
                <span className="text-sm font-bold">{cat._count.posts}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
