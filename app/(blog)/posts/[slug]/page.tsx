import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import Script from "next/script";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils/date";
import { extractFirstImage } from "@/lib/utils/extract-image";
import { ViewCounter } from "@/components/blog/view-counter";

export const dynamic = "force-dynamic";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

const getPost = async (slug: string) => {
  return prisma.post.findFirst({
    where: { slug, published: true },
    include: {
      author: { select: { name: true } },
      category: { select: { name: true, slug: true } },
      tags: { select: { tag: { select: { name: true, slug: true } } } },
    },
  });
};

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPost(decodeURIComponent(slug));

  if (!post) return {};

  return {
    title: post.metaTitle ?? post.title,
    description: post.metaDescription ?? post.excerpt,
    openGraph: {
      title: post.metaTitle ?? post.title,
      description: post.metaDescription ?? post.excerpt,
      type: "article",
      url: `${siteUrl}/posts/${slug}`,
      ...(post.ogImage && { images: [{ url: post.ogImage }] }),
      publishedTime: post.publishedAt?.toISOString(),
      modifiedTime: post.updatedAt.toISOString(),
    },
    twitter: {
      card: "summary_large_image",
      title: post.metaTitle ?? post.title,
      description: post.metaDescription ?? post.excerpt,
    },
  };
}

export default async function PostPage({ params }: Props) {
  const { slug } = await params;
  const decodedSlug = decodeURIComponent(slug);
  const post = await getPost(decodedSlug);

  if (!post) notFound();

  // 이전/다음 글
  const [prevPost, nextPost] = await Promise.all([
    prisma.post.findFirst({
      where: { published: true, publishedAt: { lt: post.publishedAt ?? new Date() } },
      orderBy: { publishedAt: "desc" },
      select: { title: true, slug: true },
    }),
    prisma.post.findFirst({
      where: { published: true, publishedAt: { gt: post.publishedAt ?? new Date() } },
      orderBy: { publishedAt: "asc" },
      select: { title: true, slug: true },
    }),
  ]);

  // 관련 글 (같은 카테고리, 현재 글 제외)
  const relatedPosts = post.category
    ? await prisma.post.findMany({
        where: {
          published: true,
          categoryId: post.categoryId,
          NOT: { slug: decodedSlug },
        },
        orderBy: { publishedAt: "desc" },
        take: 3,
        select: {
          slug: true,
          title: true,
          excerpt: true,
          thumbnail: true,
          content: true,
          publishedAt: true,
        },
      })
    : [];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.excerpt,
    author: { "@type": "Person", name: post.author.name },
    datePublished: post.publishedAt?.toISOString(),
    dateModified: post.updatedAt.toISOString(),
    url: `${siteUrl}/posts/${slug}`,
  };

  return (
    <>
      <Script
        id="json-ld"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <article className="prose prose-gray dark:prose-invert max-w-none">
        <header className="not-prose mb-8 space-y-3">
          <div className="flex items-center gap-2 text-sm flex-wrap">
            {post.category && (
              <Link
                href={`/categories/${encodeURIComponent(post.category.slug)}`}
                className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium hover:bg-primary/20 transition-colors"
              >
                {post.category.name}
              </Link>
            )}
            {post.publishedAt && (
              <span className="text-muted-foreground">{formatDate(post.publishedAt)}</span>
            )}
            <span className="text-muted-foreground">by {post.author.name}</span>
            <ViewCounter slug={decodedSlug} views={post.views} />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">{post.title}</h1>
          <p className="text-lg text-muted-foreground">{post.excerpt}</p>
          {post.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {post.tags.map(({ tag }: { tag: { name: string; slug: string } }) => (
                <Link
                  key={tag.slug}
                  href={`/tags/${encodeURIComponent(tag.slug)}`}
                  className="text-xs px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors"
                >
                  #{tag.name}
                </Link>
              ))}
            </div>
          )}
        </header>

        <div
          dangerouslySetInnerHTML={{
            __html: post.content.replace(
              /<img(?![^>]*\balt=["'][^"']+["'])[^>]*(src=["'][^"']+["'])[^>]*>/gi,
              (match) => match.replace("<img", `<img alt="${post.title}"`)
            ),
          }}
          className="mt-8"
        />
      </article>

      {/* 이전/다음 글 */}
      {(prevPost || nextPost) && (
        <nav className="mt-16 border-t pt-8 grid grid-cols-2 gap-4">
          <div>
            {prevPost && (
              <Link
                href={`/posts/${encodeURIComponent(prevPost.slug)}`}
                className="group flex flex-col gap-1"
              >
                <span className="text-xs text-muted-foreground">← 이전 글</span>
                <span className="text-sm font-medium group-hover:underline underline-offset-4 line-clamp-2">
                  {prevPost.title}
                </span>
              </Link>
            )}
          </div>
          <div className="text-right">
            {nextPost && (
              <Link
                href={`/posts/${encodeURIComponent(nextPost.slug)}`}
                className="group flex flex-col gap-1 items-end"
              >
                <span className="text-xs text-muted-foreground">다음 글 →</span>
                <span className="text-sm font-medium group-hover:underline underline-offset-4 line-clamp-2">
                  {nextPost.title}
                </span>
              </Link>
            )}
          </div>
        </nav>
      )}

      {/* 관련 글 */}
      {relatedPosts.length > 0 && (
        <section className="mt-16 border-t pt-8 space-y-4">
          <h2 className="text-lg font-bold">관련 글</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {relatedPosts.map((related) => {
              const thumbSrc = related.thumbnail || extractFirstImage(related.content);
              return (
                <Link
                  key={related.slug}
                  href={`/posts/${encodeURIComponent(related.slug)}`}
                  className="group rounded-lg border bg-card overflow-hidden hover:shadow-sm transition-shadow"
                >
                  {thumbSrc && (
                    <div className="relative w-full aspect-video bg-muted">
                      <Image
                        src={thumbSrc}
                        alt={related.title}
                        fill
                        className="object-cover transition-transform group-hover:scale-105"
                        sizes="(max-width: 640px) 100vw, 33vw"
                      />
                    </div>
                  )}
                  <div className="p-3 space-y-1">
                    <p className="text-sm font-medium line-clamp-2 group-hover:underline underline-offset-4">
                      {related.title}
                    </p>
                    {related.publishedAt && (
                      <p className="text-xs text-muted-foreground">
                        {formatDate(related.publishedAt)}
                      </p>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}
    </>
  );
}
