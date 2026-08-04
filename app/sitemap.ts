import { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";
import { extractCity } from "@/lib/apt-cities";

export const revalidate = 3600;

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  let posts: { slug: string; updatedAt: Date }[] = [];
  let categories: { slug: string }[] = [];
  let tags: { slug: string }[] = [];

  let aptCities: string[] = [];

  try {
    [posts, categories, tags] = await Promise.all([
      prisma.post.findMany({
        where: { published: true },
        select: { slug: true, updatedAt: true },
        orderBy: { publishedAt: "desc" },
      }),
      prisma.category.findMany({ select: { slug: true } }),
      prisma.tag.findMany({ select: { slug: true } }),
    ]);

    const aptPosts = posts.filter((p) => p.slug.startsWith("apt-top10-"));
    aptCities = [...new Set(aptPosts.map((p) => extractCity(p.slug)).filter(Boolean) as string[])];
  } catch {
    // DB not available during build — return static routes only
  }

  const postEntries: MetadataRoute.Sitemap = posts.map((post: { slug: string; updatedAt: Date }) => ({
    url: `${siteUrl}/posts/${encodeURIComponent(post.slug)}`,
    lastModified: post.updatedAt,
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  const categoryEntries: MetadataRoute.Sitemap = categories.map((cat: { slug: string }) => ({
    url: `${siteUrl}/categories/${encodeURIComponent(cat.slug)}`,
    changeFrequency: "weekly",
    priority: 0.6,
  }));

  const tagEntries: MetadataRoute.Sitemap = tags.map((tag: { slug: string }) => ({
    url: `${siteUrl}/tags/${encodeURIComponent(tag.slug)}`,
    changeFrequency: "weekly",
    priority: 0.5,
  }));

  const calcEntries: MetadataRoute.Sitemap = [
    { url: `${siteUrl}/calculators`, changeFrequency: "monthly", priority: 0.9 },
    { url: `${siteUrl}/calculators/cheongyak`, changeFrequency: "yearly", priority: 0.8 },
    { url: `${siteUrl}/calculators/jungae`, changeFrequency: "yearly", priority: 0.8 },
    { url: `${siteUrl}/calculators/chwideukse`, changeFrequency: "yearly", priority: 0.8 },
    { url: `${siteUrl}/calculators/mortgage`, changeFrequency: "yearly", priority: 0.8 },
    { url: `${siteUrl}/calculators/yangdo`, changeFrequency: "yearly", priority: 0.8 },
    { url: `${siteUrl}/calculators/jeungye`, changeFrequency: "yearly", priority: 0.8 },
    { url: `${siteUrl}/calculators/unemployment`, changeFrequency: "yearly", priority: 0.8 },
  ];

  const aptHubEntries: MetadataRoute.Sitemap = [
    { url: `${siteUrl}/apt`, changeFrequency: "monthly", priority: 0.8 },
    ...aptCities.map((city) => ({
      url: `${siteUrl}/apt/${city}`,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
  ];

  return [
    {
      url: siteUrl,
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${siteUrl}/posts`,
      changeFrequency: "daily",
      priority: 0.9,
    },
    ...calcEntries,
    ...aptHubEntries,
    ...postEntries,
    ...categoryEntries,
    ...tagEntries,
  ];
}
