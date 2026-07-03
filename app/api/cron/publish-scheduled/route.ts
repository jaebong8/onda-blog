import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const auth = request.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();

  const posts = await prisma.post.findMany({
    where: {
      published: false,
      scheduledAt: { lte: now },
    },
    select: { id: true, title: true },
  });

  if (posts.length === 0) {
    return NextResponse.json({ published: 0 });
  }

  await prisma.post.updateMany({
    where: { id: { in: posts.map((p) => p.id) } },
    data: { published: true, publishedAt: now, scheduledAt: null },
  });

  return NextResponse.json({
    published: posts.length,
    titles: posts.map((p) => p.title),
  });
}
