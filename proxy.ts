import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function proxy(req: NextRequest) {
  const isLoginPage = req.nextUrl.pathname === "/admin/login";

  const token = await getToken({
    req,
    secret: process.env.AUTH_SECRET,
  });
  const isAuthenticated = !!token;

  if (!isAuthenticated && !isLoginPage) {
    return NextResponse.redirect(new URL("/admin/login", req.url));
  }

  if (isAuthenticated && isLoginPage) {
    return NextResponse.redirect(new URL("/admin", req.url));
  }
}

export const config = {
  matcher: ["/admin/:path*"],
};
