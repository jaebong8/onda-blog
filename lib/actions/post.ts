"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { generateSlug } from "@/lib/utils/slug";
import { extractFirstImage } from "@/lib/utils/extract-image";

function extractExcerpt(html: string, maxLength = 200): string {
  const text = html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  return text.length <= maxLength ? text : text.slice(0, maxLength).replace(/\s+\S*$/, "") + "…";
}

async function requireAuth() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  return session.user.id;
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
  const tagIds = formData.getAll("tagIds") as string[];
  const thumbnail =
    (formData.get("thumbnail") as string) || extractFirstImage(content) || null;

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
        create: tagIds.map((tagId) => ({ tagId })),
      },
    },
  });

  // 관련 카테고리·태그 캐시 즉시 갱신
  if (categoryId || tagIds.length > 0) {
    const [cat, tags] = await Promise.all([
      categoryId ? prisma.category.findUnique({ where: { id: categoryId }, select: { slug: true } }) : null,
      tagIds.length > 0 ? prisma.tag.findMany({ where: { id: { in: tagIds } }, select: { slug: true } }) : [],
    ]);
    if (cat) revalidatePath(`/categories/${cat.slug}`);
    for (const tag of tags) revalidatePath(`/tags/${tag.slug}`);
  }

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
  const tagIds = formData.getAll("tagIds") as string[];
  const thumbnail =
    (formData.get("thumbnail") as string) || extractFirstImage(content) || null;

  const existing = await prisma.post.findUnique({
    where: { id },
    include: {
      category: { select: { slug: true } },
      tags: { select: { tag: { select: { slug: true } } } },
    },
  });

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
        ...(tagIds.length > 0 && {
          tags: {
            create: tagIds.map((tagId) => ({ tagId })),
          },
        }),
      },
    }),
  ]);

  // 기존 카테고리·태그 캐시 갱신
  if (existing?.category) revalidatePath(`/categories/${existing.category.slug}`);
  for (const t of existing?.tags ?? []) revalidatePath(`/tags/${t.tag.slug}`);
  // 새 카테고리·태그 캐시 갱신 (변경된 경우)
  if (categoryId && categoryId !== existing?.categoryId) {
    const newCat = await prisma.category.findUnique({ where: { id: categoryId }, select: { slug: true } });
    if (newCat) revalidatePath(`/categories/${newCat.slug}`);
  }

  revalidatePath("/");
  revalidatePath("/posts");
  revalidatePath(`/posts/${slug}`);
  revalidatePath("/sitemap.xml");
  revalidatePath("/admin/posts");
  revalidatePath(`/admin/posts/${id}/edit`);
  redirect("/admin/posts");
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

  if (post?.category) revalidatePath(`/categories/${post.category.slug}`);
  for (const t of post?.tags ?? []) revalidatePath(`/tags/${t.tag.slug}`);
  if (post?.slug) revalidatePath(`/posts/${post.slug}`);
  revalidatePath("/");
  revalidatePath("/posts");
  revalidatePath("/sitemap.xml");
  revalidatePath("/admin/posts");
}
