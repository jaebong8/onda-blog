const siteName = process.env.NEXT_PUBLIC_SITE_NAME ?? "온다의 블로그";

export function Footer() {
  return (
    <footer className="border-t py-8 mt-auto">
      <div className="container mx-auto max-w-4xl px-4 text-center text-sm text-muted-foreground">
        © {new Date().getFullYear()} {siteName}
      </div>
    </footer>
  );
}
