import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { createCategory, deleteCategory } from "@/lib/actions/category";
import { DeleteButton } from "@/components/admin/delete-button";
import { SubmitButton } from "@/components/admin/submit-button";

export const dynamic = "force-dynamic";

export default async function AdminCategoriesPage() {
  const categories = await prisma.category.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { posts: true } } },
  });

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">카테고리 관리</h1>
      </div>

      {/* 추가 폼 */}
      <div className="border rounded-lg p-5 space-y-4">
        <h2 className="text-sm font-semibold">새 카테고리</h2>
        <form action={createCategory} className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">이름 *</label>
              <input
                name="name"
                required
                className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="카테고리 이름"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">슬러그 (비워두면 자동생성)</label>
              <input
                name="slug"
                className="w-full rounded-md border bg-background px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="category-slug"
              />
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">설명</label>
            <input
              name="description"
              className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="카테고리 설명 (선택)"
            />
          </div>
          <SubmitButton label="추가" />
        </form>
      </div>

      {/* 목록 */}
      <div className="border rounded-lg divide-y">
        {categories.length === 0 ? (
          <div className="px-4 py-10 text-center text-muted-foreground text-sm">
            카테고리가 없습니다.
          </div>
        ) : (
          categories.map((cat) => (
            <div key={cat.id} className="flex items-center justify-between px-4 py-3 gap-4">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{cat.name}</span>
                  <span className="text-xs text-muted-foreground font-mono">{cat.slug}</span>
                  <span className="text-xs text-muted-foreground">글 {cat._count.posts}개</span>
                </div>
                {cat.description && (
                  <p className="text-xs text-muted-foreground mt-0.5">{cat.description}</p>
                )}
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <Link
                  href={`/admin/categories/${cat.id}/edit`}
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  편집
                </Link>
                <DeleteButton action={deleteCategory.bind(null, cat.id)} />
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
