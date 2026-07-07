import type { Metadata } from "next";
import Link from "next/link";
import Script from "next/script";
import { prisma } from "@/lib/prisma";
import { CITY_NAMES, REGIONS, extractCity } from "@/lib/apt-cities";

const REGION_STYLE: Record<string, { icon: string; iconBg: string; accent: string }> = {
  "수도권":    { icon: "🏙️", iconBg: "bg-blue-50 dark:bg-blue-950",    accent: "text-blue-600 dark:text-blue-400" },
  "광역시":    { icon: "🌆", iconBg: "bg-emerald-50 dark:bg-emerald-950", accent: "text-emerald-600 dark:text-emerald-400" },
  "충청·세종": { icon: "🌾", iconBg: "bg-amber-50 dark:bg-amber-950",   accent: "text-amber-600 dark:text-amber-400" },
  "전라":      { icon: "🌊", iconBg: "bg-violet-50 dark:bg-violet-950",  accent: "text-violet-600 dark:text-violet-400" },
  "경상":      { icon: "⛰️", iconBg: "bg-orange-50 dark:bg-orange-950",  accent: "text-orange-600 dark:text-orange-400" },
  "강원":      { icon: "🏔️", iconBg: "bg-cyan-50 dark:bg-cyan-950",    accent: "text-cyan-600 dark:text-cyan-400" },
  "제주":      { icon: "🌺", iconBg: "bg-pink-50 dark:bg-pink-950",     accent: "text-pink-600 dark:text-pink-400" },
};

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
  let posts: { slug: string }[] = [];
  try {
    posts = await prisma.post.findMany({
      where: { published: true, slug: { startsWith: "apt-top10-" } },
      select: { slug: true },
    });
  } catch {}

  const citiesWithData = new Set(
    posts.map((p) => extractCity(p.slug)).filter(Boolean) as string[]
  );

  const orderedCities = REGIONS.flatMap((r) => r.cities.filter((c) => citiesWithData.has(c)));
  const itemListLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "도시별 아파트 실거래가 · 전월세 TOP10",
    url: `${siteUrl}/apt`,
    itemListElement: orderedCities.map((city, i) => ({
      "@type": "ListItem",
      position: i + 1,
      url: `${siteUrl}/apt/${city}`,
      name: `${CITY_NAMES[city]} 아파트 실거래가`,
    })),
  };

  return (
    <div className="space-y-10">
      <Script id="itemlist-ld-apt" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListLd) }} />
      <header className="space-y-2">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">도시별 아파트 실거래가 · 전월세</h1>
        <p className="text-muted-foreground">
          매월 국토교통부 실거래가 기준으로 발행됩니다. 도시를 선택하면 월별 TOP10 데이터를 확인할 수 있습니다.
        </p>
      </header>

      <div className="space-y-8">
        {REGIONS.map((region) => {
          const activeCities = region.cities.filter((c) => citiesWithData.has(c));
          if (activeCities.length === 0) return null;
          const style = REGION_STYLE[region.name] ?? { icon: "🏠", iconBg: "bg-muted", accent: "text-muted-foreground" };
          return (
            <section key={region.name}>
              <div className="flex items-center gap-2 mb-4">
                <span className={`w-8 h-8 rounded-lg flex items-center justify-center text-base ${style.iconBg}`}>
                  {style.icon}
                </span>
                <h2 className={`text-sm font-semibold ${style.accent}`}>{region.name}</h2>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {activeCities.map((city) => (
                  <Link
                    key={city}
                    href={`/apt/${city}`}
                    className="rounded-xl border bg-card p-4 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group flex flex-col gap-2"
                  >
                    <span className={`w-8 h-8 rounded-lg flex items-center justify-center text-base ${style.iconBg}`}>
                      {style.icon}
                    </span>
                    <div>
                      <p className="font-medium text-sm group-hover:text-primary transition-colors">{CITY_NAMES[city]}</p>
                      <p className={`text-xs mt-0.5 font-medium ${style.accent}`}>매매 · 전월세 →</p>
                    </div>
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
