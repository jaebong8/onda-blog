import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { cache } from "react";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils/date";

export const revalidate = 3600;

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
const PAGE_SIZE = 20;

export async function generateStaticParams() {
  try {
    const tags = await prisma.tag.findMany({ select: { slug: true } });
    return tags.map((tag) => ({ slug: tag.slug }));
  } catch {
    return [];
  }
}

const getTag = cache(async (slug: string) => {
  return prisma.tag.findUnique({
    where: { slug },
    select: { id: true, name: true, slug: true },
  });
});

const getTagPosts = cache(async (tagId: string, page: number) => {
  return Promise.all([
    prisma.post.count({ where: { published: true, tags: { some: { tagId } } } }),
    prisma.post.findMany({
      where: { published: true, tags: { some: { tagId } } },
      orderBy: { publishedAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: {
        slug: true,
        title: true,
        excerpt: true,
        publishedAt: true,
      },
    }),
  ]);
});

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string }>;
};

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const { slug } = await params;
  const { page: pageParam } = await searchParams;
  const page = Math.max(1, parseInt(pageParam ?? "1", 10) || 1);
  const tag = await getTag(decodeURIComponent(slug));
  if (!tag) return {};
  const canonical = page > 1 ? `${siteUrl}/tags/${slug}?page=${page}` : `${siteUrl}/tags/${slug}`;
  const baseDescription = `${tag.name} 태그의 글 목록`;
  const title = page > 1 ? `#${tag.name} - ${page}페이지` : `#${tag.name}`;
  const description = page > 1 ? `${baseDescription} (${page}페이지)` : baseDescription;
  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      title,
      description,
      url: canonical,
    },
  };
}

export default async function TagPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const { page: pageParam } = await searchParams;
  const page = Math.max(1, parseInt(pageParam ?? "1", 10) || 1);

  const tag = await getTag(decodeURIComponent(slug));
  if (!tag) notFound();

  const [total, posts] = await getTagPosts(tag.id, page);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  if (page > totalPages) notFound();

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

      {totalPages > 1 && (
        <nav className="flex items-center justify-center gap-4 pt-4">
          <Link
            href={page > 1 ? `/tags/${slug}?page=${page - 1}` : `/tags/${slug}`}
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
            href={`/tags/${slug}?page=${page + 1}`}
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
