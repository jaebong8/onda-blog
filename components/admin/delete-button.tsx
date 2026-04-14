"use client";

export function DeleteButton({
  action,
  label = "삭제",
}: {
  action: () => Promise<void>;
  label?: string;
}) {
  async function handleClick() {
    if (!confirm("정말 삭제하시겠습니까?")) return;
    await action();
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className="text-xs text-destructive hover:text-destructive/80 transition-colors"
    >
      {label}
    </button>
  );
}
