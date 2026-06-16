import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { buttonVariants } from "@/components/ui/button";

export const dynamic = "force-dynamic";
import { PostsManager } from "@/components/admin/posts-manager";

const PAGE_SIZE = 30;

type Props = { searchParams: Promise<{ page?: string }> };

export default async function AdminPostsPage({ searchParams }: Props) {
  const { page: pageParam } = await searchParams;
  const page = Math.max(1, parseInt(pageParam ?? "1", 10) || 1);

  const [total, posts] = await Promise.all([
    prisma.post.count(),
    prisma.post.findMany({
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: {
        id: true,
        title: true,
        slug: true,
        published: true,
        publishedAt: true,
        createdAt: true,
        category: { select: { name: true } },
      },
    }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">글 관리</h1>
        <Link href="/admin/posts/new" className={buttonVariants()}>
          새 글 작성
        </Link>
      </div>

      <PostsManager posts={posts} />

      {totalPages > 1 && (
        <nav className="flex items-center justify-center gap-4 pt-4">
          <Link
            href={page > 1 ? `/admin/posts?page=${page - 1}` : "/admin/posts"}
            aria-disabled={page <= 1}
            className={`text-sm font-medium ${
              page <= 1
                ? "text-muted-foreground/40 pointer-events-none"
                : "hover:underline underline-offset-4"
            }`}
          >
            ← 이전
          </Link>
          <span className="text-sm text-muted-foreground">
            {page} / {totalPages}
          </span>
          <Link
            href={`/admin/posts?page=${page + 1}`}
            aria-disabled={page >= totalPages}
            className={`text-sm font-medium ${
              page >= totalPages
                ? "text-muted-foreground/40 pointer-events-none"
                : "hover:underline underline-offset-4"
            }`}
          >
            다음 →
          </Link>
        </nav>
      )}
    </div>
  );
}
