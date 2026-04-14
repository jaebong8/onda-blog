import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils/date";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const tag = await prisma.tag.findUnique({ where: { slug: decodeURIComponent(slug) } });
  if (!tag) return {};
  return {
    title: `#${tag.name}`,
    description: `${tag.name} 태그의 글 목록`,
  };
}

export default async function TagPage({ params }: Props) {
  const { slug } = await params;

  const tag = await prisma.tag.findUnique({
    where: { slug: decodeURIComponent(slug) },
    select: { id: true, name: true, slug: true },
  });

  if (!tag) notFound();

  const posts = await prisma.post.findMany({
    where: {
      published: true,
      tags: { some: { tagId: tag.id } },
    },
    orderBy: { publishedAt: "desc" },
    select: {
      slug: true,
      title: true,
      excerpt: true,
      publishedAt: true,
    },
  });

  return (
    <div className="space-y-10">
      <div>
        <p className="text-sm text-muted-foreground mb-1">태그</p>
        <h1 className="text-3xl font-bold tracking-tight">#{tag.name}</h1>
      </div>

      <div className="space-y-8">
        {posts.length === 0 ? (
          <p className="text-muted-foreground">이 태그의 글이 없습니다.</p>
        ) : (
          posts.map((post) => (
            <article key={post.slug} className="space-y-2 pb-8 border-b last:border-0">
              <div className="text-sm text-muted-foreground">
                {post.publishedAt && formatDate(post.publishedAt)}
              </div>
              <h2 className="text-xl font-semibold">
                <Link
                  href={`/posts/${post.slug}`}
                  className="hover:underline underline-offset-4"
                >
                  {post.title}
                </Link>
              </h2>
              <p className="text-muted-foreground">{post.excerpt}</p>
            </article>
          ))
        )}
      </div>
    </div>
  );
}
