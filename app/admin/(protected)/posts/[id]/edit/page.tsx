import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { PostForm } from "@/components/admin/post-form";
import { updatePost } from "@/lib/actions/post";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export default async function EditPostPage({ params }: Props) {
  const { id } = await params;

  const [post, categories] = await Promise.all([
    prisma.post.findUnique({ where: { id } }),
    prisma.category.findMany({ orderBy: { name: "asc" } }),
  ]);

  if (!post) notFound();

  const action = updatePost.bind(null, id);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">글 편집</h1>
      <PostForm
        action={action}
        categories={categories}
        defaultValues={{
          title: post.title,
          slug: post.slug,
          excerpt: post.excerpt,
          content: post.content,
          published: post.published,
          metaTitle: post.metaTitle ?? "",
          metaDescription: post.metaDescription ?? "",
          categoryId: post.categoryId ?? "",
          thumbnail: post.thumbnail ?? "",
        }}
      />
    </div>
  );
}
