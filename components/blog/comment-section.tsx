"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createComment, deleteComment } from "@/lib/actions/comment";
import { toggleCommentLike } from "@/lib/actions/like";
import { formatDate } from "@/lib/utils/date";
import { ProviderIcon } from "@/components/blog/provider-icon";

type Author = { id: string; name: string; email: string | null; image: string | null; provider: string | null };

function displayName(email: string | null | undefined, name: string) {
  if (email && !email.endsWith("@oauth.local")) return email;
  return name;
}

type Reply = {
  id: string;
  content: string;
  createdAt: Date;
  author: Author;
  likeCount: number;
  liked: boolean;
};

type Comment = {
  id: string;
  content: string;
  createdAt: Date;
  author: Author;
  likeCount: number;
  liked: boolean;
  replies: Reply[];
};

type CurrentUser = { id: string; name: string; image?: string | null; role?: string } | null;

type Props = {
  postId: string;
  comments: Comment[];
  currentUser: CurrentUser;
};

function Avatar({ user }: { user: { name: string; provider: string | null } }) {
  return <ProviderIcon provider={user.provider} size={32} />;
}

function LikeButton({
  commentId,
  initialCount,
  initialLiked,
  isLoggedIn,
}: {
  commentId: string;
  initialCount: number;
  initialLiked: boolean;
  isLoggedIn: boolean;
}) {
  const [liked, setLiked] = useState(initialLiked);
  const [count, setCount] = useState(initialCount);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleClick() {
    if (!isLoggedIn) { router.push("/login"); return; }
    const prev = { liked, count };
    setLiked(!liked);
    setCount(liked ? count - 1 : count + 1);
    startTransition(async () => {
      const result = await toggleCommentLike(commentId);
      if (result?.error) {
        setLiked(prev.liked);
        setCount(prev.count);
        if (result.error === "unauthorized") router.push("/login");
      }
    });
  }

  return (
    <button
      onClick={handleClick}
      disabled={isPending}
      className={`flex items-center gap-1 text-xs transition-colors disabled:opacity-50 ${
        liked ? "text-red-500 dark:text-red-400" : "text-muted-foreground hover:text-red-500"
      }`}
    >
      <svg
        viewBox="0 0 24 24"
        className={`w-3.5 h-3.5 ${liked ? "fill-current" : "fill-none stroke-current"}`}
        strokeWidth={2}
        aria-hidden
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
      </svg>
      {count > 0 && <span>{count}</span>}
    </button>
  );
}

function CommentForm({
  postId,
  parentId,
  onSuccess,
  onCancel,
  placeholder = "댓글을 입력하세요...",
  isLoggedIn,
}: {
  postId: string;
  parentId?: string;
  onSuccess: () => void;
  onCancel?: () => void;
  placeholder?: string;
  isLoggedIn: boolean;
}) {
  const [content, setContent] = useState("");
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isLoggedIn) { router.push("/login"); return; }
    if (!content.trim()) return;
    startTransition(async () => {
      const result = await createComment(postId, content, parentId);
      if (!result.error) {
        setContent("");
        onSuccess();
        router.refresh();
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder={placeholder}
        rows={3}
        maxLength={1000}
        className="w-full rounded-lg border bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
      />
      <div className="flex justify-end gap-2">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-3 py-1.5 text-xs rounded-md border hover:bg-muted transition-colors"
          >
            취소
          </button>
        )}
        <button
          type="submit"
          disabled={isPending || !content.trim()}
          className="px-3 py-1.5 text-xs rounded-md bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
        >
          {isPending ? "등록 중..." : "등록"}
        </button>
      </div>
    </form>
  );
}

function CommentItem({
  comment,
  postId,
  currentUser,
  isReply = false,
}: {
  comment: Comment | Reply;
  postId: string;
  currentUser: CurrentUser;
  isReply?: boolean;
}) {
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const canDelete =
    currentUser &&
    (currentUser.id === comment.author.id || currentUser.role === "ADMIN");

  function handleDelete() {
    if (!confirm("댓글을 삭제하시겠습니까?")) return;
    startTransition(async () => {
      await deleteComment(comment.id);
      router.refresh();
    });
  }

  return (
    <div className="flex gap-3">
      <Avatar user={comment.author} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-sm font-medium">{displayName(comment.author.email, comment.author.name)}</span>
          <span className="text-xs text-muted-foreground">{formatDate(comment.createdAt)}</span>
        </div>
        <p className="text-sm text-foreground/90 whitespace-pre-wrap break-words">{comment.content}</p>
        <div className="flex items-center gap-3 mt-1.5">
          <LikeButton
            commentId={comment.id}
            initialCount={comment.likeCount}
            initialLiked={comment.liked}
            isLoggedIn={!!currentUser}
          />
          {!isReply && (
            <button
              onClick={() => setShowReplyForm(!showReplyForm)}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              답글
            </button>
          )}
          {canDelete && (
            <button
              onClick={handleDelete}
              disabled={isPending}
              className="text-xs text-muted-foreground hover:text-destructive transition-colors"
            >
              삭제
            </button>
          )}
        </div>
        {showReplyForm && (
          <div className="mt-3">
            <CommentForm
              postId={postId}
              parentId={comment.id}
              placeholder="답글을 입력하세요..."
              isLoggedIn={!!currentUser}
              onSuccess={() => setShowReplyForm(false)}
              onCancel={() => setShowReplyForm(false)}
            />
          </div>
        )}
      </div>
    </div>
  );
}

export function CommentSection({ postId, comments, currentUser }: Props) {
  const router = useRouter();

  const totalCount = comments.reduce((acc, c) => acc + 1 + c.replies.length, 0);

  return (
    <section className="mt-16 border-t pt-8 space-y-6">
      <h2 className="text-lg font-bold">댓글 {totalCount > 0 ? totalCount : ""}</h2>

      {currentUser ? (
        <CommentForm
          postId={postId}
          isLoggedIn={true}
          onSuccess={() => router.refresh()}
          placeholder="댓글을 남겨보세요..."
        />
      ) : (
        <div className="rounded-lg border bg-muted/30 px-4 py-3 text-sm text-muted-foreground text-center">
          댓글을 작성하려면{" "}
          <a href="/login" className="text-primary hover:underline font-medium">
            로그인
          </a>
          이 필요합니다.
        </div>
      )}

      {comments.length > 0 && (
        <div className="space-y-6">
          {comments.map((comment) => (
            <div key={comment.id} className="space-y-3">
              <CommentItem
                comment={comment}
                postId={postId}
                currentUser={currentUser}
              />
              {comment.replies.length > 0 && (
                <div className="ml-6 border-l-2 border-muted pl-4 space-y-3">
                  {comment.replies.map((reply) => (
                    <CommentItem
                      key={reply.id}
                      comment={reply}
                      postId={postId}
                      currentUser={currentUser}
                      isReply
                    />
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
