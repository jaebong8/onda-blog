import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils/date";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const category = await prisma.category.findUnique({ where: { slug: decodeURIComponent(slug) } });
  if (!category) return {};
  return {
    title: category.name,
    description: category.description ?? `${category.name} 카테고리의 글 목록`,
  };
}

export default async function CategoryPage({ params }: Props) {
  const { slug } = await params;

  const category = await prisma.category.findUnique({
    where: { slug: decodeURIComponent(slug) },
    include: {
      posts: {
        where: { published: true },
        orderBy: { publishedAt: "desc" },
        select: {
          slug: true,
          title: true,
          excerpt: true,
          publishedAt: true,
          tags: { select: { tag: { select: { name: true, slug: true } } } },
        },
      },
    },
  });

  if (!category) notFound();

  return (
    <div className="space-y-10">
      <div>
        <p className="text-sm text-muted-foreground mb-1">카테고리</p>
        <h1 className="text-3xl font-bold tracking-tight">{category.name}</h1>
        {category.description && (
          <p className="text-muted-foreground mt-1">{category.description}</p>
        )}
      </div>

      <div className="space-y-8">
        {category.posts.map((post: { slug: string; title: string; excerpt: string; publishedAt: Date | null }) => (
          <article key={post.slug} className="space-y-2 pb-8 border-b last:border-0">
            <div className="text-sm text-muted-foreground">
              {post.publishedAt && formatDate(post.publishedAt)}
            </div>
            <h2 className="text-xl font-semibold">
              <Link href={`/posts/${post.slug}`} className="hover:underline underline-offset-4">
                {post.title}
              </Link>
            </h2>
            <p className="text-muted-foreground">{post.excerpt}</p>
          </article>
        ))}
      </div>
    </div>
  );
}
