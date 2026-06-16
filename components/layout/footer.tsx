import Link from "next/link";

const siteName = process.env.NEXT_PUBLIC_SITE_NAME ?? "온다의 블로그";

export function Footer() {
  return (
    <footer className="border-t py-8 mt-auto">
      <div className="container mx-auto max-w-4xl px-4 flex flex-col items-center gap-2 text-sm text-muted-foreground">
        <span>
          © {new Date().getFullYear()} {siteName}
        </span>
        <Link href="/rss.xml" className="hover:text-foreground transition-colors">
          RSS 피드
        </Link>
      </div>
    </footer>
  );
}
