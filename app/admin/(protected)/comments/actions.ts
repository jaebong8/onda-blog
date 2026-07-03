"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";

export async function deleteComment(id: string) {
  await prisma.comment.deleteMany({ where: { parentId: id } });
  await prisma.comment.delete({ where: { id } });
  revalidatePath("/admin/comments");
}

export async function replyToComment(parentId: string, postId: string, content: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const trimmed = content.trim();
  if (!trimmed) throw new Error("내용을 입력해주세요.");

  await prisma.comment.create({
    data: {
      content: trimmed,
      postId,
      authorId: session.user.id,
      parentId,
    },
  });

  revalidatePath("/admin/comments");
}
