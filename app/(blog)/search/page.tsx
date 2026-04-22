import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils/date";
import { extractFirstImage } from "@/lib/utils/extract-image";

export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<{ q?: string }> };

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const { q } = await searchParams;
  return {
    title: q ? `"${q}" 검색 결과` : "검색",
    robots: { index: false, follow: false },
  };
}

export default async function SearchPage({ searchParams }: Props) {
  const { q } = await searchParams;
  const query = q?.trim() ?? "";

  const posts = query
    ? await prisma.post.findMany({
        where: {
          published: true,
          OR: [
            { title: { contains: query, mode: "insensitive" } },
            { excerpt: { contains: query, mode: "insensitive" } },
            { content: { contains: query, mode: "insensitive" } },
          ],
        },
        orderBy: { publishedAt: "desc" },
        select: {
          slug: true,
          title: true,
          excerpt: true,
          content: true,
          thumbnail: true,
          publishedAt: true,
          category: { select: { name: true, slug: true } },
        },
      })
    : [];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">검색</h1>
        {query && (
          <p className="text-muted-foreground mt-1">
            <span className="font-medium text-foreground">"{query}"</span> 검색 결과{" "}
            {posts.length}건
          </p>
        )}
      </div>

      {/* 검색 폼 */}
      <form method="get" action="/search" className="flex gap-2">
        <input
          name="q"
          defaultValue={query}
          autoFocus
          placeholder="제목, 내용으로 검색..."
          className="flex-1 rounded-md border bg-background px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />
        <button
          type="submit"
          className="rounded-md bg-primary text-primary-foreground px-4 py-2 text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          검색
        </button>
      </form>

      {/* 결과 */}
      {query && (
        <div className="space-y-6">
          {posts.length === 0 ? (
            <p className="text-muted-foreground">검색 결과가 없습니다.</p>
          ) : (
            posts.map((post) => {
              const thumbSrc = post.thumbnail || extractFirstImage(post.content);
              return (
                <article key={post.slug} className="group">
                  <Link href={`/posts/${post.slug}`} className="flex gap-4 sm:gap-6">
                    {thumbSrc && (
                      <div className="relative shrink-0 w-20 h-20 sm:w-28 sm:h-24 rounded-lg overflow-hidden bg-muted">
                        <Image
                          src={thumbSrc}
                          alt={post.title}
                          fill
                          className="object-cover transition-transform group-hover:scale-105"
                          sizes="(max-width: 640px) 80px, 112px"
                        />
                      </div>
                    )}
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        {post.category && <span>{post.category.name}</span>}
                        {post.publishedAt && <span>{formatDate(post.publishedAt)}</span>}
                      </div>
                      <h2 className="text-lg font-semibold group-hover:underline underline-offset-4 leading-snug">
                        {highlight(post.title, query)}
                      </h2>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {highlight(post.excerpt, query)}
                      </p>
                    </div>
                  </Link>
                </article>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}

function highlight(text: string, query: string) {
  if (!query) return text;
  const parts = text.split(new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi"));
  return (
    <>
      {parts.map((part, i) =>
        part.toLowerCase() === query.toLowerCase() ? (
          <mark key={i} className="bg-yellow-200 dark:bg-yellow-800 rounded px-0.5">
            {part}
          </mark>
        ) : (
          part
        )
      )}
    </>
  );
}
