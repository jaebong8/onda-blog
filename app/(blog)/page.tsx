import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
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
  const [rawPosts, categories, popularPosts] = await Promise.all([
    prisma.post.findMany({
      where: { published: true },
      orderBy: { publishedAt: "desc" },
      take: 12,
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
    }).catch(() => []),
    prisma.category.findMany({
      orderBy: { name: "asc" },
      include: { _count: { select: { posts: { where: { published: true } } } } },
    }).catch(() => []),
    prisma.post.findMany({
      where: { published: true, views: { gt: 0 } },
      orderBy: { views: "desc" },
      take: 5,
      select: { slug: true, title: true, views: true, category: { select: { name: true } } },
    }).catch(() => []),
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
      <section className="rounded-2xl border bg-linear-to-br from-primary/10 to-transparent p-6 sm:p-8 space-y-3">
        <div className="flex items-center gap-3">
          <Image
            src="/favicon2.png"
            alt={siteName}
            width={40}
            height={40}
            priority
            className="rounded-full"
          />
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            {process.env.NEXT_PUBLIC_SITE_NAME ?? "My Blog"}
          </h1>
        </div>
        <p className="text-muted-foreground">{siteDescription}</p>
        <div className="flex flex-wrap gap-2 pt-1">
          <Link href="/calculators" className="flex items-center gap-1.5 text-sm px-4 py-2 rounded-full bg-primary/10 text-primary font-medium hover:bg-primary/20 transition-colors">
            🧮 부동산 계산기
          </Link>
          <Link href="/apt" className="flex items-center gap-1.5 text-sm px-4 py-2 rounded-full bg-primary/10 text-primary font-medium hover:bg-primary/20 transition-colors">
            🏢 아파트 실거래가
          </Link>
        </div>
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

      {/* 인기글 */}
      {popularPosts.length > 0 && (
        <section className="border-t pt-8 space-y-4">
          <h2 className="text-lg font-bold">인기글</h2>
          <ol className="space-y-3">
            {popularPosts.map((post, idx) => (
              <li key={post.slug} className="flex items-start gap-3">
                <span className={`shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                  idx === 0 ? "bg-primary text-primary-foreground" :
                  idx === 1 ? "bg-primary/60 text-primary-foreground" :
                  idx === 2 ? "bg-primary/30 text-primary-foreground" :
                  "bg-muted text-muted-foreground"
                }`}>
                  {idx + 1}
                </span>
                <div className="min-w-0">
                  <Link
                    href={`/posts/${encodeURIComponent(post.slug)}`}
                    className="text-sm font-medium hover:underline underline-offset-4 line-clamp-2"
                  >
                    {post.title}
                  </Link>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {post.category?.name && <span>{post.category.name} · </span>}
                    조회 {post.views.toLocaleString()}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </section>
      )}
    </div>
    </>
  );
}
