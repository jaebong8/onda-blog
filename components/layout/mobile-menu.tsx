"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { SearchBar } from "./search-bar";
import { Suspense } from "react";

const NAV_LINKS = [
  { href: "/calculators", label: "계산기" },
  { href: "/apt", label: "아파트" },
  { href: "/posts", label: "Posts" },
];

export function MobileMenu() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // 페이지 이동 시 닫기
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <div className="relative sm:hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="p-2 rounded-md hover:bg-muted transition-colors"
        aria-label={open ? "메뉴 닫기" : "메뉴 열기"}
        aria-expanded={open}
      >
        {open ? (
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="4" y1="4" x2="16" y2="16" />
            <line x1="16" y1="4" x2="4" y2="16" />
          </svg>
        ) : (
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="3" y1="6" x2="17" y2="6" />
            <line x1="3" y1="10" x2="17" y2="10" />
            <line x1="3" y1="14" x2="17" y2="14" />
          </svg>
        )}
      </button>

      {open && (
        <>
          {/* 배경 오버레이 */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setOpen(false)}
          />
          {/* 드롭다운 패널 */}
          <div className="fixed left-0 right-0 top-14 z-50 border-b bg-background shadow-md px-4 py-4 space-y-4">
            <Suspense fallback={null}>
              <SearchBar />
            </Suspense>
            <nav className="flex flex-col">
              {NAV_LINKS.map(({ href, label }) => (
                <Link
                  key={href}
                  href={href}
                  className="px-2 py-2.5 text-sm font-medium rounded-md hover:bg-muted transition-colors"
                  onClick={() => setOpen(false)}
                >
                  {label}
                </Link>
              ))}
            </nav>
          </div>
        </>
      )}
    </div>
  );
}
