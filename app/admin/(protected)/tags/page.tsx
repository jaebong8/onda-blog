import { prisma } from "@/lib/prisma";
import { createTag, deleteTag } from "@/lib/actions/tag";
import { DeleteButton } from "@/components/admin/delete-button";
import { SubmitButton } from "@/components/admin/submit-button";

export const dynamic = "force-dynamic";

export default async function AdminTagsPage() {
  const tags = await prisma.tag.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { posts: true } } },
  });

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold">태그 관리</h1>

      {/* 추가 폼 */}
      <div className="border rounded-lg p-5 space-y-4">
        <h2 className="text-sm font-semibold">새 태그</h2>
        <form action={createTag} className="flex gap-3 items-end">
          <div className="flex-1 space-y-1">
            <label className="text-xs font-medium text-muted-foreground">이름 *</label>
            <input
              name="name"
              required
              className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="태그 이름"
            />
          </div>
          <div className="flex-1 space-y-1">
            <label className="text-xs font-medium text-muted-foreground">슬러그 (비워두면 자동생성)</label>
            <input
              name="slug"
              className="w-full rounded-md border bg-background px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="tag-slug"
            />
          </div>
          <SubmitButton label="추가" />
        </form>
      </div>

      {/* 태그 목록 */}
      <div className="border rounded-lg divide-y">
        {tags.length === 0 ? (
          <div className="px-4 py-10 text-center text-muted-foreground text-sm">
            태그가 없습니다.
          </div>
        ) : (
          tags.map((tag) => (
            <div key={tag.id} className="flex items-center justify-between px-4 py-3">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">#{tag.name}</span>
                <span className="text-xs text-muted-foreground font-mono">{tag.slug}</span>
                <span className="text-xs text-muted-foreground">글 {tag._count.posts}개</span>
              </div>
              <DeleteButton action={deleteTag.bind(null, tag.id)} />
            </div>
          ))
        )}
      </div>
    </div>
  );
}
