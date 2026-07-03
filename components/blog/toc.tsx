"use client";

import { useState, useEffect } from "react";
import type { TocHeading } from "@/lib/utils/toc";

export function TableOfContents({ headings }: { headings: TocHeading[] }) {
  const [open, setOpen] = useState(true);
  const [activeId, setActiveId] = useState<string>("");

  useEffect(() => {
    const els = headings
      .map(({ id }) => document.getElementById(id))
      .filter(Boolean) as HTMLElement[];

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setActiveId(entry.target.id);
        }
      },
      { rootMargin: "0px 0px -70% 0px", threshold: 0 }
    );

    els.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [headings]);

  if (headings.length < 2) return null;

  return (
    <nav className="not-prose my-8 rounded-lg border bg-muted/40 px-5 py-4 text-sm">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between font-semibold"
      >
        <span>목차</span>
        <span className="text-muted-foreground text-xs">{open ? "▲" : "▼"}</span>
      </button>

      {open && (
        <ol className="mt-3 space-y-1.5">
          {headings.map(({ id, text, level }) => (
            <li key={id} className={level === 3 ? "pl-4" : ""}>
              <a
                href={`#${id}`}
                onClick={(e) => {
                  e.preventDefault();
                  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
                }}
                className={`transition-colors hover:text-foreground ${
                  activeId === id
                    ? "text-foreground font-medium"
                    : "text-muted-foreground"
                }`}
              >
                {text}
              </a>
            </li>
          ))}
        </ol>
      )}
    </nav>
  );
}
