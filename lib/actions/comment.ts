"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function createComment(
  postId: string,
  content: string,
  parentId?: string
): Promise<{ error?: string }> {
  const session = await auth();
  if (!session?.user?.id) return { error: "unauthorized" };

  const trimmed = content.trim();
  if (!trimmed) return { error: "empty" };
  if (trimmed.length > 1000) return { error: "too_long" };

  await prisma.comment.create({
    data: {
      content: trimmed,
      postId,
      authorId: session.user.id,
      parentId: parentId ?? null,
    },
  });

  return {};
}

export async function deleteComment(commentId: string): Promise<{ error?: string }> {
  const session = await auth();
  if (!session?.user?.id) return { error: "unauthorized" };

  const comment = await prisma.comment.findUnique({
    where: { id: commentId },
    select: { authorId: true },
  });

  if (!comment) return { error: "not_found" };
  if (comment.authorId !== session.user.id && (session.user as { role?: string }).role !== "ADMIN") {
    return { error: "forbidden" };
  }

  // Delete replies first, then the comment
  await prisma.$transaction([
    prisma.commentLike.deleteMany({ where: { comment: { parentId: commentId } } }),
    prisma.comment.deleteMany({ where: { parentId: commentId } }),
    prisma.commentLike.deleteMany({ where: { commentId } }),
    prisma.comment.delete({ where: { id: commentId } }),
  ]);

  return {};
}
