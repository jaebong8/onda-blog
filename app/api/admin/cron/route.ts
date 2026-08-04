import { NextResponse } from "next/server";
import { auth } from "@/auth";

const PROD_URL = process.env.SITE_URL ?? "https://onda-blog.com";

/**
 * 어드민 화면에서 cron을 수동 실행하기 위한 프록시.
 *
 * 34개 시도를 한 번에 처리하면 5분 넘게 걸려 fetch 기본 헤더 타임아웃에 걸린다.
 * 그래서 클라이언트가 시도별로 나눠 호출하고, 이 핸들러는 한 번에 한 시도만
 * 처리한다. 호출당 6~8초라 타임아웃 여지가 없고 진행 상황도 보인다.
 * GitHub Actions 워크플로도 같은 방식으로 쪼개 호출한다.
 */
export async function POST(req: Request) {
  const session = await auth();
  if (!session || session.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { type, sido, revalidate } = (await req.json()) as {
    type?: string;
    sido?: string;
    revalidate?: boolean;
  };

  const origin = new URL(req.url).origin;
  const isLocal = new URL(PROD_URL).origin !== origin;

  // 전 시도 처리가 끝난 뒤 마지막에 한 번만 호출된다.
  // 로컬에서 실행하면 revalidatePath()가 dev 서버 캐시만 지우므로,
  // 프로덕션 ISR 캐시는 따로 무효화해야 한다.
  if (revalidate) {
    if (!isLocal) return NextResponse.json({ ok: true, revalidated: "skipped" });
    return NextResponse.json({ ok: true, revalidated: await revalidateProduction() });
  }

  if (type !== "apt-price" && type !== "apt-rent") {
    return NextResponse.json({ error: "Invalid type" }, { status: 400 });
  }

  const url = new URL(`${origin}/api/cron/${type}`);
  if (sido) url.searchParams.set("sido", sido);

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${process.env.CRON_SECRET}` },
  });

  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}

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
