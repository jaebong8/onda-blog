import { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";

export const revalidate = 3600;

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  let posts: { slug: string; updatedAt: Date }[] = [];
  let categories: { slug: string }[] = [];
  let tags: { slug: string }[] = [];

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
  } catch {
    // DB not available during build — return static routes only
  }

  const postEntries: MetadataRoute.Sitemap = posts.map((post: { slug: string; updatedAt: Date }) => ({
    url: `${siteUrl}/posts/${post.slug}`,
    lastModified: post.updatedAt,
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  const categoryEntries: MetadataRoute.Sitemap = categories.map((cat: { slug: string }) => ({
    url: `${siteUrl}/categories/${cat.slug}`,
    changeFrequency: "weekly",
    priority: 0.6,
  }));

  const tagEntries: MetadataRoute.Sitemap = tags.map((tag: { slug: string }) => ({
    url: `${siteUrl}/tags/${tag.slug}`,
    changeFrequency: "weekly",
    priority: 0.5,
  }));

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
    ...postEntries,
    ...categoryEntries,
    ...tagEntries,
  ];
}
