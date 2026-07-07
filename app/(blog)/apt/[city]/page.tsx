import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils/date";
import { CITY_NAMES, extractCity } from "@/lib/apt-cities";

export const revalidate = 3600;

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

type Props = { params: Promise<{ city: string }> };

export async function generateStaticParams() {
  try {
    const posts = await prisma.post.findMany({
      where: { published: true, slug: { startsWith: "apt-top10-" } },
      select: { slug: true },
    });
    const cities = [...new Set(posts.map((p) => extractCity(p.slug)).filter(Boolean) as string[])];
    return cities.map((city) => ({ city }));
  } catch {
    return [];
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { city } = await params;
  const cityName = CITY_NAMES[city];
  if (!cityName) return {};
  return {
    title: `${cityName} 아파트 실거래가 · 전월세 TOP10 월별 모음`,
    description: `${cityName} 아파트 매매 실거래가 TOP10과 전월세 TOP10을 월별로 정리했습니다. 국토교통부 실거래가 기준.`,
    alternates: { canonical: `${siteUrl}/apt/${city}` },
    openGraph: {
      title: `${cityName} 아파트 실거래가 · 전월세 TOP10`,
      description: `${cityName} 아파트 매매 실거래가 TOP10과 전월세 TOP10 월별 모음`,
      url: `${siteUrl}/apt/${city}`,
    },
  };
}

export default async function CityAptPage({ params }: Props) {
  const { city } = await params;
  const cityName = CITY_NAMES[city];
  if (!cityName) notFound();

  let salePosts: { slug: string; title: string; publishedAt: Date | null }[] = [];
  let rentPosts: { slug: string; title: string; publishedAt: Date | null }[] = [];
  try {
    [salePosts, rentPosts] = await Promise.all([
      prisma.post.findMany({
        where: { published: true, slug: { startsWith: `apt-top10-${city}-` } },
        orderBy: { publishedAt: "desc" },
        select: { slug: true, title: true, publishedAt: true },
      }),
      prisma.post.findMany({
        where: { published: true, slug: { startsWith: `apt-rent-top10-${city}-` } },
        orderBy: { publishedAt: "desc" },
        select: { slug: true, title: true, publishedAt: true },
      }),
    ]);
  } catch {}

  if (salePosts.length === 0 && rentPosts.length === 0) notFound();

  return (
    <div className="space-y-10">
      <header className="space-y-2">
        <nav className="text-sm text-muted-foreground">
          <Link href="/apt" className="hover:underline underline-offset-4">도시별 아파트</Link>
          <span className="mx-1.5">→</span>
          <span>{cityName}</span>
        </nav>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{cityName} 아파트 실거래가 · 전월세 TOP10</h1>
        <p className="text-muted-foreground">국토교통부 실거래가 기준. 매월 최신 데이터로 업데이트됩니다.</p>
      </header>

      {salePosts.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-xl font-semibold">매매 실거래가 TOP10</h2>
          <ul className="divide-y border rounded-lg overflow-hidden">
            {salePosts.map((post) => (
              <li key={post.slug}>
                <Link
                  href={`/posts/${encodeURIComponent(post.slug)}`}
                  className="flex items-center justify-between px-4 py-3 bg-card hover:bg-accent transition-colors"
                >
                  <span className="font-medium text-sm">{post.title}</span>
                  {post.publishedAt && (
                    <span className="text-xs text-muted-foreground shrink-0 ml-4">
                      {formatDate(post.publishedAt)}
                    </span>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {rentPosts.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-xl font-semibold">전월세 TOP10</h2>
          <ul className="divide-y border rounded-lg overflow-hidden">
            {rentPosts.map((post) => (
              <li key={post.slug}>
                <Link
                  href={`/posts/${encodeURIComponent(post.slug)}`}
                  className="flex items-center justify-between px-4 py-3 bg-card hover:bg-accent transition-colors"
                >
                  <span className="font-medium text-sm">{post.title}</span>
                  {post.publishedAt && (
                    <span className="text-xs text-muted-foreground shrink-0 ml-4">
                      {formatDate(post.publishedAt)}
                    </span>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
