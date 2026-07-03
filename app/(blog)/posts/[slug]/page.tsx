import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import Script from "next/script";
import { cache } from "react";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { formatDate } from "@/lib/utils/date";
import { extractFirstImage } from "@/lib/utils/extract-image";
import { ViewCounter } from "@/components/blog/view-counter";
import { ShareButtons } from "@/components/blog/share-buttons";
import { PostLikeButton } from "@/components/blog/post-like-button";
import { CommentSection } from "@/components/blog/comment-section";
import { TableOfContents } from "@/components/blog/toc";
import { extractHeadings, injectHeadingIds } from "@/lib/utils/toc";
import { CITY_NAMES, extractCity } from "@/lib/apt-cities";

export const revalidate = 3600;

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export async function generateStaticParams() {
  try {
    const posts = await prisma.post.findMany({
      where: { published: true },
      select: { slug: true },
    });
    return posts.map((post) => ({ slug: post.slug }));
  } catch {
    return [];
  }
}

const getPost = cache(async (slug: string) => {
  return prisma.post.findFirst({
    where: { slug, published: true },
    include: {
      author: { select: { name: true } },
      category: { select: { name: true, slug: true } },
      tags: { select: { tag: { select: { name: true, slug: true } } } },
    },
  });
});

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPost(decodeURIComponent(slug));

  if (!post) return {};

  return {
    title: post.metaTitle ?? post.title,
    description: post.metaDescription ?? post.excerpt,
    alternates: {
      canonical: `${siteUrl}/posts/${slug}`,
    },
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

  const [post, session] = await Promise.all([
    getPost(decodedSlug),
    auth(),
  ]);

  if (!post) notFound();

  const [prevPost, nextPost, likeData, comments] = await Promise.all([
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
    prisma.postLike.findMany({
      where: { postId: post.id },
      select: { userId: true },
    }),
    prisma.comment.findMany({
      where: { postId: post.id, parentId: null },
      orderBy: { createdAt: "desc" },
      include: {
        author: { select: { id: true, name: true, email: true, image: true, provider: true } },
        likes: { select: { userId: true } },
        replies: {
          orderBy: { createdAt: "asc" },
          include: {
            author: { select: { id: true, name: true, email: true, image: true, provider: true } },
            likes: { select: { userId: true } },
          },
        },
      },
    }),
  ]);

  const relatedPosts = post.category
    ? await prisma.post.findMany({
        where: { published: true, categoryId: post.categoryId, NOT: { slug: decodedSlug } },
        orderBy: { publishedAt: "desc" },
        take: 3,
        select: { slug: true, title: true, excerpt: true, thumbnail: true, content: true, publishedAt: true },
      })
    : [];

  const tocHeadings = extractHeadings(post.content);
  const contentWithIds = injectHeadingIds(post.content, tocHeadings);

  const userId = session?.user?.id ?? null;
  const likeCount = likeData.length;
  const userLiked = userId ? likeData.some((l) => l.userId === userId) : false;

  const mappedComments = comments.map((c) => ({
    id: c.id,
    content: c.content,
    createdAt: c.createdAt,
    author: { ...c.author, email: c.author.email ?? null },
    likeCount: c.likes.length,
    liked: userId ? c.likes.some((l) => l.userId === userId) : false,
    replies: c.replies.map((r) => ({
      id: r.id,
      content: r.content,
      createdAt: r.createdAt,
      author: { ...r.author, email: r.author.email ?? null },
      likeCount: r.likes.length,
      liked: userId ? r.likes.some((l) => l.userId === userId) : false,
    })),
  }));

  const aptCity = extractCity(decodedSlug);
  const aptCityName = aptCity ? CITY_NAMES[aptCity] : null;

  const canonicalUrl = `${siteUrl}/posts/${slug}`;
  const siteName = process.env.NEXT_PUBLIC_SITE_NAME ?? "My Blog";

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    mainEntityOfPage: { "@type": "WebPage", "@id": canonicalUrl },
    headline: post.title,
    description: post.metaDescription ?? post.excerpt,
    ...(post.ogImage || post.thumbnail
      ? { image: { "@type": "ImageObject", url: post.ogImage ?? post.thumbnail } }
      : {}),
    author: { "@type": "Person", name: post.author.name },
    publisher: { "@type": "Organization", name: siteName },
    datePublished: post.publishedAt?.toISOString(),
    dateModified: post.updatedAt.toISOString(),
    url: canonicalUrl,
    ...(post.category && { articleSection: post.category.name }),
    ...(post.tags.length > 0 && {
      keywords: post.tags.map(({ tag }: { tag: { name: string; slug: string } }) => tag.name).join(", "),
    }),
  };

  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "홈", item: siteUrl },
      ...(post.category
        ? [{ "@type": "ListItem", position: 2, name: post.category.name, item: `${siteUrl}/categories/${post.category.slug}` }]
        : []),
      { "@type": "ListItem", position: post.category ? 3 : 2, name: post.title, item: canonicalUrl },
    ],
  };

  return (
    <>
      <Script id="json-ld" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <Script id="json-ld-breadcrumb" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />

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

        <TableOfContents headings={tocHeadings} />

        <div
          dangerouslySetInnerHTML={{
            __html: contentWithIds
              .replace(
                /<img(?![^>]*\balt=["'][^"']+["'])[^>]*(src=["'][^"']+["'])[^>]*>/gi,
                (match) => match.replace("<img", `<img alt="${post.title}"`)
              )
              .replace(
                /#([가-힣a-zA-Z0-9_]+)(?![^<]*?>)/g,
                (_, tag) =>
                  `<a href="/tags/${encodeURIComponent(tag)}" class="text-primary font-medium hover:underline underline-offset-2">#${tag}</a>`
              )
              .replace(/<table/gi, '<div class="table-wrapper"><table')
              .replace(/<\/table>/gi, "</table></div>"),
          }}
          className="mt-8"
        />
      </article>

      {/* 도시별 허브 링크 */}
      {aptCity && aptCityName && (
        <div className="mt-10 rounded-lg border bg-muted/40 px-5 py-4 flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium">{aptCityName} 아파트 데이터 월별 모아보기</p>
            <p className="text-xs text-muted-foreground mt-0.5">매매 실거래가 · 전월세 TOP10 전체 목록</p>
          </div>
          <Link
            href={`/apt/${aptCity}`}
            className="shrink-0 text-sm font-medium text-primary hover:underline underline-offset-4"
          >
            {aptCityName} 모음 →
          </Link>
        </div>
      )}

      {/* 좋아요 */}
      <div className="mt-10 flex justify-center">
        <PostLikeButton
          postId={post.id}
          initialCount={likeCount}
          initialLiked={userLiked}
          isLoggedIn={!!userId}
        />
      </div>

      {/* 공유 */}
      <div className="mt-6 pt-8 border-t">
        <ShareButtons
          url={`${siteUrl}/posts/${slug}`}
          title={post.title}
          description={post.metaDescription ?? post.excerpt ?? undefined}
          image={post.ogImage ?? post.thumbnail ?? `${siteUrl}/opengraph-image`}
        />
      </div>

      {/* 이전/다음 글 */}
      {(prevPost || nextPost) && (
        <nav className="mt-16 border-t pt-8 grid grid-cols-2 gap-4">
          <div>
            {prevPost && (
              <Link href={`/posts/${encodeURIComponent(prevPost.slug)}`} className="group flex flex-col gap-1">
                <span className="text-xs text-muted-foreground">← 이전 글</span>
                <span className="text-sm font-medium group-hover:underline underline-offset-4 line-clamp-2">{prevPost.title}</span>
              </Link>
            )}
          </div>
          <div className="text-right">
            {nextPost && (
              <Link href={`/posts/${encodeURIComponent(nextPost.slug)}`} className="group flex flex-col gap-1 items-end">
                <span className="text-xs text-muted-foreground">다음 글 →</span>
                <span className="text-sm font-medium group-hover:underline underline-offset-4 line-clamp-2">{nextPost.title}</span>
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
                      <Image src={thumbSrc} alt={related.title} fill className="object-cover transition-transform group-hover:scale-105" sizes="(max-width: 640px) 100vw, 33vw" />
                    </div>
                  )}
                  <div className="p-3 space-y-1">
                    <p className="text-sm font-medium line-clamp-2 group-hover:underline underline-offset-4">{related.title}</p>
                    {related.publishedAt && <p className="text-xs text-muted-foreground">{formatDate(related.publishedAt)}</p>}
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* 댓글 */}
      <CommentSection
        postId={post.id}
        comments={mappedComments}
        currentUser={session?.user ? { id: session.user.id, name: session.user.name ?? "", image: session.user.image, role: session.user.role } : null}
      />
    </>
  );
}
