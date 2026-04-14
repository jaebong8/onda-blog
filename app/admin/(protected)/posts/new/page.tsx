import { prisma } from "@/lib/prisma";
import { PostForm } from "@/components/admin/post-form";
import { createPost } from "@/lib/actions/post";

export const dynamic = "force-dynamic";

export default async function NewPostPage() {
  const [categories, tags] = await Promise.all([
    prisma.category.findMany({ orderBy: { name: "asc" } }),
    prisma.tag.findMany({ orderBy: { name: "asc" } }),
  ]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">새 글 작성</h1>
      <PostForm action={createPost} categories={categories} tags={tags} />
    </div>
  );
}
