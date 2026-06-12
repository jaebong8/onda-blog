import { auth } from "@/auth";
import { NextResponse } from "next/server";

export const proxy = auth((req) => {
  const { pathname } = req.nextUrl;
  const isLoginPage = pathname === "/admin/login";
  const session = req.auth;

  // 비로그인 → 어드민 로그인 페이지
  if (!session && !isLoginPage) {
    return NextResponse.redirect(new URL("/admin/login", req.url));
  }

  // 로그인했지만 ADMIN 아님 → 홈
  if (session && session.user?.role !== "ADMIN" && !isLoginPage) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  // ADMIN이 로그인 페이지 접근 → 어드민 홈
  if (session && session.user?.role === "ADMIN" && isLoginPage) {
    return NextResponse.redirect(new URL("/admin", req.url));
  }
});

export const config = {
  matcher: ["/admin/:path*"],
};
