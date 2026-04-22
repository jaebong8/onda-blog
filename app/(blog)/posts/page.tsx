import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils/date";
import { extractFirstImage } from "@/lib/utils/extract-image";

export const revalidate = 3600;

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  title: "전체 글",
  description: "모든 블로그 글 목록입니다.",
  alternates: { canonical: `${siteUrl}/posts` },
};

export default async function PostsPage() {
  const posts = await prisma.post.findMany({
    where: { published: true },
    orderBy: { publishedAt: "desc" },
    select: {
      slug: true,
      title: true,
      excerpt: true,
      content: true,
      thumbnail: true,
      publishedAt: true,
      category: { select: { name: true, slug: true } },
      tags: { select: { tag: { select: { name: true, slug: true } } } },
    },
  });

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">전체 글</h1>
        <p className="text-muted-foreground mt-1">
          총 {posts.length}개의 글이 있습니다.
        </p>
      </div>

      <div className="space-y-8">
        {posts.length === 0 ? (
          <p className="text-muted-foreground">아직 작성된 글이 없습니다.</p>
        ) : (
          posts.map((post) => {
            const thumbSrc = post.thumbnail || extractFirstImage(post.content);
            return (
              <article key={post.slug} className="group pb-8 border-b last:border-0">
                <Link href={`/posts/${post.slug}`} className="flex gap-4 sm:gap-6">
                  {thumbSrc && (
                    <div className="relative shrink-0 w-24 h-24 sm:w-36 sm:h-28 rounded-lg overflow-hidden bg-muted">
                      <Image
                        src={thumbSrc}
                        alt={post.title}
                        fill
                        className="object-cover transition-transform group-hover:scale-105"
                        sizes="(max-width: 640px) 96px, 144px"
                      />
                    </div>
                  )}
                  <div className="flex-1 min-w-0 space-y-1.5">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      {post.category && (
                        <span>{post.category.name}</span>
                      )}
                      {post.publishedAt && (
                        <span>{formatDate(post.publishedAt)}</span>
                      )}
                    </div>
                    <h2 className="text-xl font-semibold group-hover:underline underline-offset-4">
                      {post.title}
                    </h2>
                    <p className="text-muted-foreground line-clamp-2 text-sm">
                      {post.excerpt}
                    </p>
                    {post.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-0.5">
                        {post.tags.map(({ tag }) => (
                          <span
                            key={tag.slug}
                            className="text-xs px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground"
                          >
                            #{tag.name}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </Link>
              </article>
            );
          })
        )}
      </div>
    </div>
  );
}
