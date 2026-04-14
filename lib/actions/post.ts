"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { generateSlug } from "@/lib/utils/slug";
import { extractFirstImage } from "@/lib/utils/extract-image";

function extractExcerpt(html: string, maxLength = 200): string {
  const text = html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  return text.length <= maxLength ? text : text.slice(0, maxLength).replace(/\s+\S*$/, "") + "…";
}
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

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

  const post = await prisma.post.create({
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

  revalidatePath("/");
  revalidatePath("/posts");
  revalidatePath("/admin/posts");
  redirect("/admin/posts");
}

export async function updatePost(id: string, formData: FormData) {
  await requireAuth();

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

  const existing = await prisma.post.findUnique({ where: { id } });

  await prisma.post.update({
    where: { id },
    data: {
      title,
      slug,
      excerpt,
      content,
      published,
      publishedAt:
        published && !existing?.publishedAt ? new Date() : existing?.publishedAt ?? null,
      metaTitle,
      metaDescription,
      thumbnail,
      categoryId,
      tags: {
        deleteMany: {},
        create: tagIds.map((tagId) => ({ tagId })),
      },
    },
  });

  revalidatePath("/");
  revalidatePath("/posts");
  revalidatePath(`/posts/${slug}`);
  revalidatePath("/admin/posts");
  revalidatePath(`/admin/posts/${id}/edit`);
  redirect("/admin/posts");
}

export async function deletePost(id: string) {
  await requireAuth();
  await prisma.post.delete({ where: { id } });
  revalidatePath("/admin/posts");
}
