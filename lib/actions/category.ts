"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { generateSlug } from "@/lib/utils/slug";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

async function requireAuth() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
}

export async function createCategory(formData: FormData) {
  await requireAuth();
  const name = (formData.get("name") as string).trim();
  const slug = (formData.get("slug") as string).trim() || generateSlug(name);
  const description = (formData.get("description") as string).trim() || null;

  await prisma.category.create({ data: { name, slug, description } });
  revalidatePath("/admin/categories");
  revalidatePath("/");
  revalidatePath(`/categories/${encodeURIComponent(slug)}`);
}

export async function updateCategory(id: string, formData: FormData) {
  await requireAuth();
  const name = (formData.get("name") as string).trim();
  const slug = (formData.get("slug") as string).trim() || generateSlug(name);
  const description = (formData.get("description") as string).trim() || null;

  const existing = await prisma.category.findUnique({ where: { id }, select: { slug: true } });
  await prisma.category.update({ where: { id }, data: { name, slug, description } });

  revalidatePath("/admin/categories");
  revalidatePath("/");
  if (existing) revalidatePath(`/categories/${encodeURIComponent(existing.slug)}`);
  revalidatePath(`/categories/${encodeURIComponent(slug)}`);
  redirect("/admin/categories");
}

export async function deleteCategory(id: string) {
  await requireAuth();
  const existing = await prisma.category.findUnique({ where: { id }, select: { slug: true } });
  await prisma.category.delete({ where: { id } });

  revalidatePath("/admin/categories");
  revalidatePath("/");
  if (existing) revalidatePath(`/categories/${encodeURIComponent(existing.slug)}`);
}
