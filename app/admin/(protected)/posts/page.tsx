import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { buttonVariants } from "@/components/ui/button";

export const dynamic = "force-dynamic";
import { PostsManager } from "@/components/admin/posts-manager";

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

      <PostsManager posts={posts} />
    </div>
  );
}
