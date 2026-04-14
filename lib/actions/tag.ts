"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { generateSlug } from "@/lib/utils/slug";
import { revalidatePath } from "next/cache";

async function requireAuth() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
}

export async function createTag(formData: FormData) {
  await requireAuth();
  const name = (formData.get("name") as string).trim();
  const slug = (formData.get("slug") as string).trim() || generateSlug(name);

  await prisma.tag.create({ data: { name, slug } });
  revalidatePath("/admin/tags");
}

export async function deleteTag(id: string) {
  await requireAuth();
  await prisma.tag.delete({ where: { id } });
  revalidatePath("/admin/tags");
}
