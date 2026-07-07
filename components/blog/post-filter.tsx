import Link from "next/link";
import Image from "next/image";
import { formatDate } from "@/lib/utils/date";

const CATEGORY_PALETTES = [
  "bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400",
  "bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400",
  "bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400",
  "bg-violet-50 dark:bg-violet-950 text-violet-600 dark:text-violet-400",
  "bg-rose-50 dark:bg-rose-950 text-rose-600 dark:text-rose-400",
  "bg-cyan-50 dark:bg-cyan-950 text-cyan-600 dark:text-cyan-400",
];

function categoryColor(name: string): string {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) | 0;
  return CATEGORY_PALETTES[Math.abs(h) % CATEGORY_PALETTES.length];
}

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
  return (
    <div className="space-y-12">
      {/* 카테고리 목록 */}
      {categories.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            카테고리
          </h2>
          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => (
              <Link
                key={cat.id}
                href={`/categories/${cat.slug}`}
                className="px-3 py-1.5 rounded-full border text-sm transition-colors hover:bg-muted"
              >
                {cat.name}
                <span className="ml-1.5 text-xs opacity-70">{cat.postCount}</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* 글 목록 */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
          최신 글
        </h2>
        <div className="space-y-8">
          {posts.length === 0 ? (
            <p className="text-muted-foreground">글이 없습니다.</p>
          ) : (
            posts.map((post) => (
              <article key={post.slug} className="group rounded-xl border bg-card p-4 sm:p-5 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
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
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${categoryColor(post.category.name)}`}>
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
