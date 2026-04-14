"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { ThemeToggle } from "@/components/theme-toggle";

const siteName = process.env.NEXT_PUBLIC_SITE_NAME ?? "My Blog";

export function Header() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(searchParams.get("q") ?? "");

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const q = query.trim();
    router.push(q ? `/search?q=${encodeURIComponent(q)}` : "/search");
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
      <div className="container mx-auto flex h-14 max-w-4xl items-center px-4 gap-4">
        <Link href="/" className="flex items-center font-bold text-lg shrink-0">
          {siteName}
        </Link>

        <form onSubmit={handleSearch} className="flex-1 max-w-xs">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="검색..."
            className="w-full rounded-md border bg-muted/50 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </form>

        <nav className="flex items-center gap-4 text-sm ml-auto">
          <Link
            href="/posts"
            className="text-muted-foreground transition-colors hover:text-foreground"
          >
            Posts
          </Link>
          <ThemeToggle />
        </nav>
      </div>
    </header>
  );
}
