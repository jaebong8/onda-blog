"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { togglePostLike } from "@/lib/actions/like";

type Props = {
  postId: string;
  initialCount: number;
  initialLiked: boolean;
  isLoggedIn: boolean;
};

export function PostLikeButton({ postId, initialCount, initialLiked, isLoggedIn }: Props) {
  const [liked, setLiked] = useState(initialLiked);
  const [count, setCount] = useState(initialCount);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleClick() {
    if (!isLoggedIn) {
      router.push("/login");
      return;
    }

    const prevLiked = liked;
    const prevCount = count;
    setLiked(!liked);
    setCount(liked ? count - 1 : count + 1);

    startTransition(async () => {
      const result = await togglePostLike(postId);
      if (result?.error) {
        setLiked(prevLiked);
        setCount(prevCount);
        if (result.error === "unauthorized") router.push("/login");
      }
    });
  }

  return (
    <button
      onClick={handleClick}
      disabled={isPending}
      aria-label={liked ? "좋아요 취소" : "좋아요"}
      className={`flex items-center gap-2 px-5 py-2.5 rounded-full border transition-colors text-sm font-medium disabled:opacity-60 ${
        liked
          ? "bg-red-50 border-red-300 text-red-500 dark:bg-red-950/30 dark:border-red-800 dark:text-red-400"
          : "bg-background border-border text-muted-foreground hover:border-red-300 hover:text-red-500"
      }`}
    >
      <svg
        viewBox="0 0 24 24"
        className={`w-5 h-5 transition-all ${liked ? "fill-red-500 dark:fill-red-400" : "fill-none stroke-current"}`}
        strokeWidth={2}
        aria-hidden
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"
        />
      </svg>
      <span>{count > 0 ? count : "좋아요"}</span>
    </button>
  );
}
