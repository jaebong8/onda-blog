import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { CITY_NAMES, REGIONS, extractCity } from "@/lib/apt-cities";

export const revalidate = 3600;

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  title: "도시별 아파트 실거래가 · 전월세 TOP10",
  description: "서울, 부산, 인천 등 전국 주요 도시의 아파트 매매 실거래가와 전월세 TOP10을 월별로 확인하세요.",
  alternates: { canonical: `${siteUrl}/apt` },
  openGraph: {
    title: "도시별 아파트 실거래가 · 전월세 TOP10",
    description: "전국 주요 도시 아파트 매매 실거래가와 전월세 TOP10 월별 데이터",
    url: `${siteUrl}/apt`,
  },
};

export default async function AptHubPage() {
  const posts = await prisma.post.findMany({
    where: { published: true, slug: { startsWith: "apt-top10-" } },
    select: { slug: true },
  });

  const citiesWithData = new Set(
    posts.map((p) => extractCity(p.slug)).filter(Boolean) as string[]
  );

  return (
    <div className="space-y-10">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">도시별 아파트 실거래가 · 전월세</h1>
        <p className="text-muted-foreground">
          매월 국토교통부 실거래가 기준으로 발행됩니다. 도시를 선택하면 월별 TOP10 데이터를 확인할 수 있습니다.
        </p>
      </header>

      <div className="space-y-8">
        {REGIONS.map((region) => {
          const activeCities = region.cities.filter((c) => citiesWithData.has(c));
          if (activeCities.length === 0) return null;
          return (
            <section key={region.name}>
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                {region.name}
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {activeCities.map((city) => (
                  <Link
                    key={city}
                    href={`/apt/${city}`}
                    className="rounded-lg border bg-card px-4 py-3 hover:shadow-sm hover:bg-accent transition-all"
                  >
                    <span className="font-medium">{CITY_NAMES[city]}</span>
                    <span className="block text-xs text-muted-foreground mt-0.5">매매 · 전월세</span>
                  </Link>
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
