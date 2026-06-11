import { auth, signOut } from "@/auth";
import Link from "next/link";
import { ProviderIcon } from "@/components/blog/provider-icon";

export async function UserMenu() {
  const session = await auth();

  if (!session) {
    return (
      <Link
        href="/login"
        className="text-sm px-3 py-1.5 rounded-md border hover:bg-muted transition-colors"
      >
        로그인
      </Link>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <ProviderIcon provider={session.user.provider} size={28} />
      {(() => {
        const isRealEmail = session.user.email && !session.user.email.endsWith("@oauth.local");
        const label = isRealEmail
          ? session.user.email!.split("@")[0]
          : session.user.name;
        const title = isRealEmail ? session.user.email! : undefined;
        return (
          <span className="text-sm hidden sm:block max-w-32 truncate" title={title}>
            {label}
          </span>
        );
      })()}
      <form
        action={async () => {
          "use server";
          await signOut({ redirectTo: "/" });
        }}
      >
        <button
          type="submit"
          className="text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          로그아웃
        </button>
      </form>
    </div>
  );
}
