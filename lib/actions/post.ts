"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { generateSlug } from "@/lib/utils/slug";
import { extractFirstImage } from "@/lib/utils/extract-image";
import { extractHashtags } from "@/lib/utils/extract-hashtags";

function extractExcerpt(html: string, maxLength = 200): string {
  const text = html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  return text.length <= maxLength ? text : text.slice(0, maxLength).replace(/\s+\S*$/, "") + "…";
}

export async function requireAuth() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  if ((session.user as { role?: string }).role !== "ADMIN") throw new Error("Forbidden");
  return session.user.id;
}

async function upsertHashtagTags(content: string) {
  const names = extractHashtags(content);
  if (names.length === 0) return [];
  return Promise.all(
    names.map((name) =>
      prisma.tag.upsert({
        where: { name },
        create: { name, slug: generateSlug(name) },
        update: {},
        select: { id: true, slug: true },
      })
    )
  );
}

export async function createPost(formData: FormData) {
  const authorId = await requireAuth();

  const title = formData.get("title") as string;
  const slug = generateSlug(title);
  const content = formData.get("content") as string;
  const excerpt = extractExcerpt(content);
  const published = formData.get("published") === "true";
  const metaTitle = (formData.get("metaTitle") as string) || null;
  const metaDescription = (formData.get("metaDescription") as string) || null;
  const categoryId = (formData.get("categoryId") as string) || null;
  const thumbnail =
    (formData.get("thumbnail") as string) || extractFirstImage(content) || null;

  const tags = await upsertHashtagTags(content);

  await prisma.post.create({
    data: {
      title,
      slug,
      excerpt,
      content,
      published,
      publishedAt: published ? new Date() : null,
      metaTitle,
      metaDescription,
      thumbnail,
      authorId,
      categoryId,
      tags: {
        create: tags.map((t) => ({ tagId: t.id })),
      },
    },
  });

  if (categoryId) {
    const cat = await prisma.category.findUnique({ where: { id: categoryId }, select: { slug: true } });
    if (cat) revalidatePath(`/categories/${encodeURIComponent(cat.slug)}`);
  }
  for (const tag of tags) revalidatePath(`/tags/${encodeURIComponent(tag.slug)}`);

  revalidatePath("/");
  revalidatePath("/posts");
  revalidatePath("/sitemap.xml");
  revalidatePath("/admin/posts");
  redirect("/admin/posts");
}

export async function updatePost(id: string, formData: FormData) {
  await requireAuth();

  const title = formData.get("title") as string;
  const content = formData.get("content") as string;
  const excerpt = extractExcerpt(content);
  const published = formData.get("published") === "true";
  const metaTitle = (formData.get("metaTitle") as string) || null;
  const metaDescription = (formData.get("metaDescription") as string) || null;
  const categoryId = (formData.get("categoryId") as string) || null;
  const thumbnail =
    (formData.get("thumbnail") as string) || extractFirstImage(content) || null;

  const [existing, tags] = await Promise.all([
    prisma.post.findUnique({
      where: { id },
      include: {
        category: { select: { slug: true } },
        tags: { select: { tag: { select: { slug: true } } } },
      },
    }),
    upsertHashtagTags(content),
  ]);

  const slug = existing?.slug ?? generateSlug(title);

  await prisma.$transaction([
    prisma.tagsOnPosts.deleteMany({ where: { postId: id } }),
    prisma.post.update({
      where: { id },
      data: {
        title,
        excerpt,
        content,
        published,
        publishedAt:
          published && !existing?.publishedAt ? new Date() : existing?.publishedAt ?? null,
        metaTitle,
        metaDescription,
        thumbnail,
        categoryId,
        ...(tags.length > 0 && {
          tags: {
            create: tags.map((t) => ({ tagId: t.id })),
          },
        }),
      },
    }),
  ]);

  if (existing?.category) revalidatePath(`/categories/${encodeURIComponent(existing.category.slug)}`);
  for (const t of existing?.tags ?? []) revalidatePath(`/tags/${encodeURIComponent(t.tag.slug)}`);
  if (categoryId && categoryId !== existing?.categoryId) {
    const newCat = await prisma.category.findUnique({ where: { id: categoryId }, select: { slug: true } });
    if (newCat) revalidatePath(`/categories/${encodeURIComponent(newCat.slug)}`);
  }
  for (const tag of tags) revalidatePath(`/tags/${encodeURIComponent(tag.slug)}`);

  revalidatePath("/");
  revalidatePath("/posts");
  revalidatePath(`/posts/${encodeURIComponent(slug)}`);
  revalidatePath("/sitemap.xml");
  revalidatePath("/admin/posts");
  revalidatePath(`/admin/posts/${id}/edit`);
  redirect("/admin/posts");
}

export async function deletePosts(ids: string[]) {
  await requireAuth();
  if (ids.length === 0) return;

  const posts = await prisma.post.findMany({
    where: { id: { in: ids } },
    include: {
      category: { select: { slug: true } },
      tags: { select: { tag: { select: { slug: true } } } },
    },
  });

  await prisma.post.deleteMany({ where: { id: { in: ids } } });

  for (const post of posts) {
    if (post.category) revalidatePath(`/categories/${encodeURIComponent(post.category.slug)}`);
    for (const t of post.tags) revalidatePath(`/tags/${encodeURIComponent(t.tag.slug)}`);
    revalidatePath(`/posts/${encodeURIComponent(post.slug)}`);
  }
  revalidatePath("/");
  revalidatePath("/posts");
  revalidatePath("/sitemap.xml");
  revalidatePath("/admin/posts");
}

export async function deletePost(id: string) {
  await requireAuth();

  const post = await prisma.post.findUnique({
    where: { id },
    include: {
      category: { select: { slug: true } },
      tags: { select: { tag: { select: { slug: true } } } },
    },
  });

  await prisma.post.delete({ where: { id } });

  if (post?.category) revalidatePath(`/categories/${encodeURIComponent(post.category.slug)}`);
  for (const t of post?.tags ?? []) revalidatePath(`/tags/${encodeURIComponent(t.tag.slug)}`);
  if (post?.slug) revalidatePath(`/posts/${encodeURIComponent(post.slug)}`);
  revalidatePath("/");
  revalidatePath("/posts");
  revalidatePath("/sitemap.xml");
  revalidatePath("/admin/posts");
}
