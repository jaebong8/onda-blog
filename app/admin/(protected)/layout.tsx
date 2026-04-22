import type { Metadata } from "next";
import { auth, signOut } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session) redirect("/admin/login");

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b bg-background">
        <div className="container mx-auto max-w-6xl flex items-center h-14 px-4 gap-6">
          <Link href="/admin" className="font-bold text-lg">
            Admin
          </Link>
          <nav className="flex items-center gap-4 text-sm">
            <Link
              href="/admin/posts"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              글
            </Link>
            <Link
              href="/admin/categories"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              카테고리
            </Link>
            <Link
              href="/admin/tags"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              태그
            </Link>
          </nav>
          <div className="ml-auto flex items-center gap-3">
            <span className="text-sm text-muted-foreground">
              {session.user?.name}
            </span>
            <form
              action={async () => {
                "use server";
                await signOut({ redirectTo: "/admin/login" });
              }}
            >
              <Button variant="outline" size="sm" type="submit">
                로그아웃
              </Button>
            </form>
          </div>
        </div>
      </header>
      <main className="flex-1 container mx-auto max-w-6xl px-4 py-8">
        {children}
      </main>
    </div>
  );
}
