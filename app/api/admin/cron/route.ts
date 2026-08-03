import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { request } from "undici";

const TIMEOUT_MS = 15 * 60 * 1000; // 15 minutes
const PROD_URL = process.env.SITE_URL ?? "https://onda-blog.com";

// 로컬에서 실행하면 revalidatePath()가 dev 서버 캐시만 지운다.
// 글은 프로덕션 DB에 들어가므로 프로덕션 ISR 캐시도 따로 무효화해야 한다.
async function revalidateProduction(): Promise<string> {
  const secret = process.env.CRON_SECRET;
  if (!secret) return "CRON_SECRET 없음 — 건너뜀";
  try {
    const res = await fetch(`${PROD_URL}/api/revalidate`, {
      method: "POST",
      headers: { Authorization: `Bearer ${secret}` },
    });
    return res.ok ? "ok" : `HTTP ${res.status}`;
  } catch (e) {
    return `실패: ${String(e)}`;
  }
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session || session.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { type } = await req.json() as { type: string };
  if (type !== "apt-price" && type !== "apt-rent") {
    return NextResponse.json({ error: "Invalid type" }, { status: 400 });
  }

  const origin = new URL(req.url).origin;
  const { statusCode, body } = await request(`${origin}/api/cron/${type}`, {
    method: "GET",
    headers: { Authorization: `Bearer ${process.env.CRON_SECRET}` },
    headersTimeout: TIMEOUT_MS,
    bodyTimeout: TIMEOUT_MS,
  });

  const data = await body.json() as Record<string, unknown>;

  // 로컬 dev 서버에서 돌린 경우에만 프로덕션 캐시를 따로 무효화한다.
  const isLocal = new URL(PROD_URL).origin !== origin;
  const revalidated = statusCode === 200 && isLocal ? await revalidateProduction() : undefined;

  return NextResponse.json({ ...data, ...(revalidated && { revalidated }) }, { status: statusCode });
}
