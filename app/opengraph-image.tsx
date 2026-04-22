import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

export const alt = process.env.NEXT_PUBLIC_SITE_NAME ?? "My Blog";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  const fontBold = await readFile(
    join(process.cwd(), "node_modules/pretendard/dist/public/static/alternative/Pretendard-Bold.ttf")
  );
  const fontRegular = await readFile(
    join(process.cwd(), "node_modules/pretendard/dist/public/static/alternative/Pretendard-Regular.ttf")
  );

  const siteName = process.env.NEXT_PUBLIC_SITE_NAME ?? "My Blog";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)",
          padding: "80px",
          fontFamily: "Pretendard",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "28px",
          }}
        >
          <div
            style={{
              fontSize: 80,
              fontWeight: 700,
              color: "#f8fafc",
              textAlign: "center",
              lineHeight: 1.2,
            }}
          >
            {siteName}
          </div>
          <div
            style={{
              fontSize: 36,
              fontWeight: 400,
              color: "#94a3b8",
              textAlign: "center",
            }}
          >
            좋은 것이 다 온다. 선한 정보를 전달드립니다.
          </div>
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
