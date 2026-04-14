"use server";

import { prisma } from "@/lib/prisma";

export async function incrementViews(slug: string) {
  await prisma.post.updateMany({
    where: { slug, published: true },
    data: { views: { increment: 1 } },
  });
}
