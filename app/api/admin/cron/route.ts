import { NextResponse } from "next/server";
import { auth } from "@/auth";

export async function POST(request: Request) {
  const session = await auth();
  if (!session || session.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { type } = await request.json() as { type: string };
  if (type !== "apt-price" && type !== "apt-rent") {
    return NextResponse.json({ error: "Invalid type" }, { status: 400 });
  }

  const origin = new URL(request.url).origin;
  const res = await fetch(`${origin}/api/cron/${type}`, {
    headers: { Authorization: `Bearer ${process.env.CRON_SECRET}` },
  });

  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
