import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { prisma } from "@/lib/prisma";

export const revalidate = 3600;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

type Props = { params: Promise<{ slug: string }> };

export default async function Image({ params }: Props) {
  const { slug } = await params;

  const post = await prisma.post.findFirst({
    where: { slug: decodeURIComponent(slug), published: true },
    select: {
      title: true,
      excerpt: true,
      category: { select: { name: true } },
    },
  });

  const [fontBold, fontRegular] = await Promise.all([
    readFile(join(process.cwd(), "node_modules/pretendard/dist/public/static/alternative/Pretendard-Bold.ttf")),
    readFile(join(process.cwd(), "node_modules/pretendard/dist/public/static/alternative/Pretendard-Regular.ttf")),
  ]);

  const siteName = process.env.NEXT_PUBLIC_SITE_NAME ?? "My Blog";
  const title = post?.title ?? siteName;
  const excerpt = post?.excerpt ?? "";
  const category = post?.category?.name;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)",
          padding: "72px 80px",
          fontFamily: "Pretendard",
        }}
      >
        {/* 상단: 카테고리 */}
        <div style={{ display: "flex", alignItems: "center" }}>
          {category && (
            <div
              style={{
                fontSize: 26,
                fontWeight: 700,
                color: "#818cf8",
                background: "rgba(129,140,248,0.15)",
                padding: "8px 20px",
                borderRadius: "100px",
              }}
            >
              {category}
            </div>
          )}
        </div>

        {/* 중앙: 제목 + 요약 */}
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          <div
            style={{
              fontSize: title.length > 20 ? 58 : 68,
              fontWeight: 700,
              color: "#f8fafc",
              lineHeight: 1.25,
              display: "-webkit-box",
              WebkitLineClamp: 3,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {title}
          </div>
          {excerpt && (
            <div
              style={{
                fontSize: 30,
                fontWeight: 400,
                color: "#94a3b8",
                lineHeight: 1.5,
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
              }}
            >
              {excerpt}
            </div>
          )}
        </div>

        {/* 하단: 사이트명 */}
        <div style={{ fontSize: 28, fontWeight: 700, color: "#475569" }}>
          {siteName}
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: "Pretendard", data: fontBold, weight: 700, style: "normal" },
        { name: "Pretendard", data: fontRegular, weight: 400, style: "normal" },
      ],
    }
  );
}
