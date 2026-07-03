"use client";

import { useRef, useState } from "react";
import { RichEditor } from "@/components/admin/rich-editor";
import { SubmitButton } from "@/components/admin/submit-button";

type Category = { id: string; name: string; slug: string };

type DefaultValues = {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  published: boolean;
  scheduledAt?: string;
  metaTitle: string;
  metaDescription: string;
  categoryId: string;
  thumbnail: string;
};

type Props = {
  action: (formData: FormData) => Promise<void>;
  categories: Category[];
  defaultValues?: DefaultValues;
};

export function PostForm({ action, categories, defaultValues }: Props) {
  const [title, setTitle] = useState(defaultValues?.title ?? "");
  const [published, setPublished] = useState(defaultValues?.published ?? false);
  const [activeTab, setActiveTab] = useState<"content" | "seo">("content");
  const [thumbnail, setThumbnail] = useState(defaultValues?.thumbnail ?? "");
  const [thumbUploading, setThumbUploading] = useState(false);
  const thumbInputRef = useRef<HTMLInputElement>(null);

  async function handleThumbnailUpload(file: File) {
    setThumbUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Upload failed");
      setThumbnail(json.url);
    } catch (err) {
      alert(err instanceof Error ? err.message : "업로드 실패");
    } finally {
      setThumbUploading(false);
    }
  }

  return (
    <form action={action} className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex gap-2 border-b">
            <button
              type="button"
              onClick={() => setActiveTab("content")}
              className={`px-3 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
                activeTab === "content"
                  ? "border-foreground text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              내용
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("seo")}
              className={`px-3 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
                activeTab === "seo"
                  ? "border-foreground text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              SEO
            </button>
          </div>

          {activeTab === "content" && (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">제목 *</label>
                <input
                  name="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="글 제목을 입력하세요"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium">내용 *</label>
                <RichEditor
                  name="content"
                  defaultValue={defaultValues?.content ?? ""}
                />
                <p className="text-xs text-muted-foreground">본문에 #태그명 형식으로 입력하면 자동으로 태그가 적용됩니다.</p>
              </div>
            </div>
          )}

          {activeTab === "seo" && (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">
                  Meta 제목{" "}
                  <span className="text-muted-foreground font-normal">
                    (비워두면 제목 사용)
                  </span>
                </label>
                <input
                  name="metaTitle"
                  defaultValue={defaultValues?.metaTitle}
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="검색 결과에 표시될 제목"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium">
                  Meta 설명{" "}
                  <span className="text-muted-foreground font-normal">
                    (비워두면 요약 사용)
                  </span>
                </label>
                <textarea
                  name="metaDescription"
                  defaultValue={defaultValues?.metaDescription}
                  rows={3}
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                  placeholder="검색 결과에 표시될 설명 (권장: 150자 이내)"
                />
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Thumbnail */}
          <div className="border rounded-lg p-4 space-y-3">
            <h3 className="text-sm font-semibold">썸네일</h3>
            <input type="hidden" name="thumbnail" value={thumbnail} />
            <input
              ref={thumbInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleThumbnailUpload(file);
                e.target.value = "";
              }}
            />
            {thumbnail ? (
              <div className="space-y-2">
                <img
                  src={thumbnail}
                  alt="썸네일"
                  className="w-full aspect-video object-cover rounded-md border"
                />
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => thumbInputRef.current?.click()}
                    className="flex-1 text-xs py-1.5 rounded-md border hover:bg-muted transition-colors"
                  >
                    변경
                  </button>
                  <button
                    type="button"
                    onClick={() => setThumbnail("")}
                    className="text-xs py-1.5 px-3 rounded-md border text-destructive hover:bg-destructive/10 transition-colors"
                  >
                    제거
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => thumbInputRef.current?.click()}
                disabled={thumbUploading}
                className="w-full aspect-video rounded-md border-2 border-dashed flex flex-col items-center justify-center gap-1 text-muted-foreground hover:border-foreground hover:text-foreground transition-colors disabled:opacity-50"
              >
                <span className="text-2xl">🖼</span>
                <span className="text-xs">
                  {thumbUploading ? "업로드 중..." : "썸네일 이미지 선택"}
                </span>
                <span className="text-xs opacity-60">미설정 시 본문 첫 이미지 사용</span>
              </button>
            )}
          </div>

          <div className="border rounded-lg p-4 space-y-4">
            <h3 className="text-sm font-semibold">발행 설정</h3>

            <div className="space-y-1.5">
              <label className="text-sm font-medium">상태</label>
              <select
                name="published"
                value={published ? "true" : "false"}
                onChange={(e) => setPublished(e.target.value === "true")}
                className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="false">임시저장</option>
                <option value="true">발행</option>
              </select>
            </div>

            {!published && (
              <div className="space-y-1.5">
                <label className="text-sm font-medium">
                  예약 발행{" "}
                  <span className="text-muted-foreground font-normal">(선택)</span>
                </label>
                <input
                  type="datetime-local"
                  name="scheduledAt"
                  defaultValue={defaultValues?.scheduledAt ?? ""}
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
                <p className="text-xs text-muted-foreground">설정 시 해당 시각에 자동 발행됩니다.</p>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-sm font-medium">카테고리</label>
              <select
                name="categoryId"
                defaultValue={defaultValues?.categoryId ?? ""}
                className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">없음</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex gap-2 pt-2">
              <SubmitButton />
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}
