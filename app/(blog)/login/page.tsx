import { signIn } from "@/auth";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "로그인",
  robots: { index: false, follow: false },
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  const session = await auth();
  if (session) redirect("/");

  const { callbackUrl } = await searchParams;
  const redirectTo = callbackUrl ?? "/";

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh]">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold">로그인</h1>
          <p className="text-sm text-muted-foreground">소셜 계정으로 로그인하세요</p>
        </div>

        <div className="space-y-3">
          <form
            action={async () => {
              "use server";
              await signIn("google", { redirectTo });
            }}
          >
            <button
              type="submit"
              className="w-full flex items-center justify-center gap-3 px-4 py-2.5 rounded-lg border bg-background hover:bg-muted transition-colors text-sm font-medium"
            >
              <svg viewBox="0 0 24 24" className="w-5 h-5" aria-hidden>
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
              Google로 로그인
            </button>
          </form>

          <form
            action={async () => {
              "use server";
              await signIn("kakao", { redirectTo });
            }}
          >
            <button
              type="submit"
              className="w-full flex items-center justify-center gap-3 px-4 py-2.5 rounded-lg bg-[#FEE500] hover:bg-[#F5DC00] transition-colors text-sm font-medium text-[#3C1E1E]"
            >
              <svg viewBox="0 0 24 24" className="w-5 h-5" aria-hidden fill="#3C1E1E">
                <path d="M12 3C6.477 3 2 6.477 2 10.8c0 2.7 1.68 5.07 4.2 6.48L5.1 21l4.56-2.94c.75.12 1.54.18 2.34.18 5.523 0 10-3.477 10-7.8S17.523 3 12 3z" />
              </svg>
              카카오로 로그인
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
