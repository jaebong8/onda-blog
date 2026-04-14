import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { updateCategory } from "@/lib/actions/category";
import { SubmitButton } from "@/components/admin/submit-button";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export default async function EditCategoryPage({ params }: Props) {
  const { id } = await params;
  const category = await prisma.category.findUnique({ where: { id } });
  if (!category) notFound();

  const action = updateCategory.bind(null, id);

  return (
    <div className="max-w-lg space-y-6">
      <h1 className="text-2xl font-bold">카테고리 편집</h1>

      <form action={action} className="border rounded-lg p-5 space-y-4">
        <div className="space-y-1.5">
          <label className="text-sm font-medium">이름 *</label>
          <input
            name="name"
            required
            defaultValue={category.name}
            className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium">슬러그 *</label>
          <input
            name="slug"
            required
            defaultValue={category.slug}
            className="w-full rounded-md border bg-background px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium">설명</label>
          <input
            name="description"
            defaultValue={category.description ?? ""}
            className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            placeholder="카테고리 설명 (선택)"
          />
        </div>
        <SubmitButton label="저장" />
      </form>
    </div>
  );
}
