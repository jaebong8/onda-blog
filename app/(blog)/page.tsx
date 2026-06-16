import type { Metadata } from "next";
import Link from "next/link";
import Script from "next/script";
import { prisma } from "@/lib/prisma";
import { extractFirstImage } from "@/lib/utils/extract-image";
import { PostFilter } from "@/components/blog/post-filter";

export const revalidate = 3600;

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
const siteName = process.env.NEXT_PUBLIC_SITE_NAME ?? "My Blog";
const siteDescription = "좋은 것이 다 온다. 선한 정보를 전달드리겠습니다.";

export const metadata: Metadata = {
  alternates: { canonical: siteUrl },
  openGraph: {
    url: siteUrl,
    description: siteDescription,
  },
};

export default async function HomePage() {
  const [rawPosts, categories] = await Promise.all([
    prisma.post.findMany({
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
    }),
    prisma.category.findMany({
      orderBy: { name: "asc" },
      include: { _count: { select: { posts: { where: { published: true } } } } },
    }),
  ]);

  const posts = rawPosts.map((p) => ({
    slug: p.slug,
    title: p.title,
    excerpt: p.excerpt,
    thumbSrc: p.thumbnail || extractFirstImage(p.content),
    publishedAt: p.publishedAt,
    category: p.category,
    tags: p.tags.map(({ tag }) => tag),
  }));

  const activeCategories = categories
    .filter((c) => c._count.posts > 0)
    .map((c) => ({ id: c.id, name: c.name, slug: c.slug, postCount: c._count.posts }));

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: siteName,
    url: siteUrl,
    description: siteDescription,
    potentialAction: {
      "@type": "SearchAction",
      target: `${siteUrl}/search?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };

  return (
    <>
    <Script id="json-ld-website" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
    <div className="space-y-8">
      <section>
        <h1 className="text-3xl font-bold tracking-tight mb-2">
          {process.env.NEXT_PUBLIC_SITE_NAME ?? "My Blog"}
        </h1>
        <p className="text-muted-foreground">최신 글을 확인하세요.</p>
      </section>

      <PostFilter posts={posts} categories={activeCategories} />

      {posts.length > 0 && (
        <Link
          href="/posts"
          className="inline-flex text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          모든 글 보기 →
        </Link>
      )}
    </div>
    </>
  );
}
