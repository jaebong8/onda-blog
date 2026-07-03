import { Suspense } from "react";
import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";
import { SearchBar } from "./search-bar";
import { UserMenu } from "./user-menu";

const siteName = process.env.NEXT_PUBLIC_SITE_NAME ?? "My Blog";

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
      <div className="container mx-auto flex h-14 max-w-4xl items-center px-4 gap-4">
        <Link href="/" className="flex items-center font-bold text-lg shrink-0">
          {siteName}
        </Link>

        <Suspense fallback={<div className="flex-1 max-w-xs h-8 bg-muted rounded-md animate-pulse" />}>
          <SearchBar />
        </Suspense>

        <nav className="flex items-center gap-3 text-sm ml-auto">
          <Link
            href="/apt"
            className="text-muted-foreground transition-colors hover:text-foreground"
          >
            아파트
          </Link>
          <Link
            href="/posts"
            className="text-muted-foreground transition-colors hover:text-foreground"
          >
            Posts
          </Link>
          <ThemeToggle />
          <Suspense fallback={<div className="w-16 h-8 bg-muted rounded-md animate-pulse" />}>
            <UserMenu />
          </Suspense>
        </nav>
      </div>
    </header>
  );
}
