"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { formatDate } from "@/lib/utils/date";

type Category = {
  id: string;
  name: string;
  slug: string;
  postCount: number;
};

type Post = {
  slug: string;
  title: string;
  excerpt: string;
  thumbSrc: string | null;
  publishedAt: Date | null;
  category: { name: string; slug: string } | null;
  tags: { name: string; slug: string }[];
};

type Props = {
  posts: Post[];
  categories: Category[];
};

export function PostFilter({ posts, categories }: Props) {
  const [selected, setSelected] = useState<string | null>(null);

  const filtered = selected
    ? posts.filter((p) => p.category?.slug === selected)
    : posts;

  return (
    <div className="space-y-12">
      {/* 카테고리 필터 */}
      {categories.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            카테고리
          </h2>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelected(null)}
              className={`px-3 py-1.5 rounded-full border text-sm transition-colors ${
                selected === null
                  ? "bg-foreground text-background border-foreground"
                  : "hover:bg-muted"
              }`}
            >
              전체
              <span className="ml-1.5 text-xs opacity-70">{posts.length}</span>
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelected(selected === cat.slug ? null : cat.slug)}
                className={`px-3 py-1.5 rounded-full border text-sm transition-colors ${
                  selected === cat.slug
                    ? "bg-foreground text-background border-foreground"
                    : "hover:bg-muted"
                }`}
              >
                {cat.name}
                <span className="ml-1.5 text-xs opacity-70">{cat.postCount}</span>
              </button>
            ))}
          </div>
        </section>
      )}

      {/* 글 목록 */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
          {selected
            ? categories.find((c) => c.slug === selected)?.name
            : "최신 글"}
        </h2>
        <div className="space-y-8">
          {filtered.length === 0 ? (
            <p className="text-muted-foreground">글이 없습니다.</p>
          ) : (
            filtered.map((post) => (
              <article key={post.slug} className="group rounded-xl border bg-card p-4 sm:p-5 hover:shadow-sm transition-shadow">
                <Link href={`/posts/${post.slug}`} className="flex gap-4 sm:gap-6">
                  {post.thumbSrc && (
                    <div className="relative shrink-0 w-24 h-24 sm:w-36 sm:h-28 rounded-lg overflow-hidden bg-muted">
                      <Image
                        src={post.thumbSrc}
                        alt={post.title}
                        fill
                        className="object-cover transition-transform group-hover:scale-105"
                        sizes="(max-width: 640px) 96px, 144px"
                      />
                    </div>
                  )}
                  <div className="flex-1 min-w-0 space-y-1.5">
                    <div className="flex items-center gap-2 text-sm">
                      {post.category && (
                        <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium">
                          {post.category.name}
                        </span>
                      )}
                      {post.publishedAt && (
                        <span className="text-muted-foreground">{formatDate(post.publishedAt)}</span>
                      )}
                    </div>
                    <h2 className="text-xl font-semibold leading-snug group-hover:underline underline-offset-4">
                      {post.title}
                    </h2>
                    <p className="text-muted-foreground line-clamp-2 text-sm">
                      {post.excerpt}
                    </p>
                    {post.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-0.5">
                        {post.tags.map((tag) => (
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
            ))
          )}
        </div>
      </section>
    </div>
  );
}
