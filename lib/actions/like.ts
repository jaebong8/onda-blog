"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function togglePostLike(postId: string): Promise<{ error?: string; liked?: boolean; count?: number }> {
  const session = await auth();
  if (!session?.user?.id) return { error: "unauthorized" };

  const existing = await prisma.postLike.findUnique({
    where: { postId_userId: { postId, userId: session.user.id } },
  });

  if (existing) {
    await prisma.postLike.delete({
      where: { postId_userId: { postId, userId: session.user.id } },
    });
  } else {
    await prisma.postLike.create({
      data: { postId, userId: session.user.id },
    });
  }

  const count = await prisma.postLike.count({ where: { postId } });
  return { liked: !existing, count };
}

export async function toggleCommentLike(commentId: string): Promise<{ error?: string; liked?: boolean; count?: number }> {
  const session = await auth();
  if (!session?.user?.id) return { error: "unauthorized" };

  const existing = await prisma.commentLike.findUnique({
    where: { commentId_userId: { commentId, userId: session.user.id } },
  });

  if (existing) {
    await prisma.commentLike.delete({
      where: { commentId_userId: { commentId, userId: session.user.id } },
    });
  } else {
    await prisma.commentLike.create({
      data: { commentId, userId: session.user.id },
    });
  }

  const count = await prisma.commentLike.count({ where: { commentId } });
  return { liked: !existing, count };
}
