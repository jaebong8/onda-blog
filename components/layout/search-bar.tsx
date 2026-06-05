"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

export function SearchBar() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(searchParams.get("q") ?? "");

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const q = query.trim();
    router.push(q ? `/search?q=${encodeURIComponent(q)}` : "/search");
  }

  return (
    <form onSubmit={handleSearch} className="flex-1 max-w-xs">
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="검색..."
        className="w-full rounded-md border bg-muted/50 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
      />
    </form>
  );
}
