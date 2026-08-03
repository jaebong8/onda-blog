import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { request } from "undici";

const TIMEOUT_MS = 15 * 60 * 1000; // 15 minutes

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

  const data = await body.json();
  return NextResponse.json(data, { status: statusCode });
}
