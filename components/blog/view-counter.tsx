"use client";

import { useEffect } from "react";
import { incrementViews } from "@/lib/actions/view";

export function ViewCounter({ slug, views }: { slug: string; views: number }) {
  useEffect(() => {
    incrementViews(slug);
  }, [slug]);

  return (
    <span className="text-muted-foreground">조회 {(views ?? 0).toLocaleString()}</span>
  );
}
