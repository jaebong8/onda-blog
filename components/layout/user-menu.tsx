import { auth, signOut } from "@/auth";
import Link from "next/link";
import Image from "next/image";

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
      {session.user.image ? (
        <Image
          src={session.user.image}
          alt={session.user.name ?? ""}
          width={28}
          height={28}
          className="rounded-full"
        />
      ) : (
        <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center text-xs font-medium text-primary">
          {session.user.name?.[0]?.toUpperCase() ?? "U"}
        </div>
      )}
      <span className="text-sm hidden sm:block max-w-[80px] truncate">
        {session.user.name}
      </span>
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
