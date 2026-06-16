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
    const categories = await prisma.category.findMany({ select: { slug: true } });
    return categories.map((cat) => ({ slug: cat.slug }));
  } catch {
    return [];
  }
}

const getCategory = cache(async (slug: string) => {
  return prisma.category.findUnique({
    where: { slug },
    select: { id: true, name: true, description: true },
  });
});

const getCategoryPosts = cache(async (categoryId: string, page: number) => {
  return Promise.all([
    prisma.post.count({ where: { published: true, categoryId } }),
    prisma.post.findMany({
      where: { published: true, categoryId },
      orderBy: { publishedAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: {
        slug: true,
        title: true,
        excerpt: true,
        publishedAt: true,
        tags: { select: { tag: { select: { name: true, slug: true } } } },
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
  const category = await getCategory(decodeURIComponent(slug));
  if (!category) return {};
  const canonical = page > 1 ? `${siteUrl}/categories/${slug}?page=${page}` : `${siteUrl}/categories/${slug}`;
  const baseDescription = category.description ?? `${category.name} 카테고리의 글 목록`;
  const title = page > 1 ? `${category.name} - ${page}페이지` : category.name;
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

export default async function CategoryPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const { page: pageParam } = await searchParams;
  const page = Math.max(1, parseInt(pageParam ?? "1", 10) || 1);

  const category = await getCategory(decodeURIComponent(slug));
  if (!category) notFound();

  const [total, posts] = await getCategoryPosts(category.id, page);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  if (page > totalPages) notFound();

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
        {posts.length === 0 ? (
          <p className="text-muted-foreground">이 카테고리의 글이 없습니다.</p>
        ) : (
          posts.map((post) => (
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
          ))
        )}
      </div>

      {totalPages > 1 && (
        <nav className="flex items-center justify-center gap-4 pt-4">
          <Link
            href={page > 1 ? `/categories/${slug}?page=${page - 1}` : `/categories/${slug}`}
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
            href={`/categories/${slug}?page=${page + 1}`}
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
