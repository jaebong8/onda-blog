"use client";

import { useState, useCallback, useRef } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Image } from "@tiptap/extension-image";
import { Link } from "@tiptap/extension-link";
import { Placeholder } from "@tiptap/extension-placeholder";
import type { Editor } from "@tiptap/react";

type Props = {
  name: string;
  defaultValue?: string;
};

function ToolbarButton({
  onClick,
  active,
  disabled,
  title,
  children,
}: {
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`h-8 min-w-8 px-1.5 rounded text-sm flex items-center justify-center transition-colors disabled:opacity-30 ${
        active
          ? "bg-foreground text-background"
          : "hover:bg-muted text-foreground"
      }`}
    >
      {children}
    </button>
  );
}

function Divider() {
  return <div className="w-px h-5 bg-border mx-0.5 self-center" />;
}

function Toolbar({
  editor,
  onImageClick,
}: {
  editor: Editor | null;
  onImageClick: () => void;
}) {
  if (!editor) return null;

  const addLink = () => {
    const prev = editor.getAttributes("link").href as string | undefined;
    const url = window.prompt("URL", prev ?? "https://");
    if (url === null) return;
    if (url === "") {
      editor.chain().focus().unsetLink().run();
    } else {
      editor.chain().focus().setLink({ href: url }).run();
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-0.5 p-2 border-b bg-muted/30">
      {/* History */}
      <ToolbarButton
        onClick={() => editor.chain().focus().undo().run()}
        disabled={!editor.can().undo()}
        title="실행 취소"
      >
        ↩
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().redo().run()}
        disabled={!editor.can().redo()}
        title="다시 실행"
      >
        ↪
      </ToolbarButton>

      <Divider />

      {/* Headings */}
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        active={editor.isActive("heading", { level: 1 })}
        title="제목 1"
      >
        H1
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        active={editor.isActive("heading", { level: 2 })}
        title="제목 2"
      >
        H2
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        active={editor.isActive("heading", { level: 3 })}
        title="제목 3"
      >
        H3
      </ToolbarButton>

      <Divider />

      {/* Inline */}
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBold().run()}
        active={editor.isActive("bold")}
        title="굵게"
      >
        <strong>B</strong>
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleItalic().run()}
        active={editor.isActive("italic")}
        title="기울임"
      >
        <em>I</em>
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleStrike().run()}
        active={editor.isActive("strike")}
        title="취소선"
      >
        <s>S</s>
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleCode().run()}
        active={editor.isActive("code")}
        title="인라인 코드"
      >
        {"<>"}
      </ToolbarButton>

      <Divider />

      {/* Blocks */}
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        active={editor.isActive("bulletList")}
        title="글머리 기호 목록"
      >
        ≡
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        active={editor.isActive("orderedList")}
        title="번호 목록"
      >
        1≡
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        active={editor.isActive("blockquote")}
        title="인용"
      >
        ❝
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleCodeBlock().run()}
        active={editor.isActive("codeBlock")}
        title="코드 블록"
      >
        {"{ }"}
      </ToolbarButton>

      <Divider />

      {/* Link & Image */}
      <ToolbarButton
        onClick={addLink}
        active={editor.isActive("link")}
        title="링크"
      >
        🔗
      </ToolbarButton>
      <ToolbarButton onClick={onImageClick} title="이미지 업로드">
        🖼
      </ToolbarButton>

      <Divider />

      {/* Clear */}
      <ToolbarButton
        onClick={() => editor.chain().focus().clearNodes().unsetAllMarks().run()}
        title="서식 지우기"
      >
        ✕
      </ToolbarButton>
    </div>
  );
}

export function RichEditor({ name, defaultValue = "" }: Props) {
  const [content, setContent] = useState(defaultValue);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Image.configure({
        HTMLAttributes: { class: "max-w-full rounded-lg my-4" },
      }),
      Link.configure({ openOnClick: false }),
      Placeholder.configure({ placeholder: "내용을 입력하세요..." }),
    ],
    content: defaultValue,
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      setContent(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class:
          "prose prose-gray dark:prose-invert max-w-none min-h-[400px] px-4 py-3 focus:outline-none",
      },
    },
  });

  const uploadImage = useCallback(
    async (file: File) => {
      setUploading(true);
      try {
        const fd = new FormData();
        fd.append("file", file);
        const res = await fetch("/api/upload", { method: "POST", body: fd });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error ?? "Upload failed");
        const alt = file.name.replace(/\.[^.]+$/, "");
        if (editor) {
          editor.chain().focus().setImage({ src: json.url, alt }).run();
        }
      } catch (err) {
        alert(err instanceof Error ? err.message : "이미지 업로드 실패");
      } finally {
        setUploading(false);
      }
    },
    [editor]
  );

  return (
    <div className="border rounded-md overflow-hidden">
      <input type="hidden" name={name} value={content} />
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) uploadImage(file);
          e.target.value = "";
        }}
      />
      <Toolbar
        editor={editor}
        onImageClick={() => fileInputRef.current?.click()}
      />
      {uploading && (
        <div className="px-4 py-2 text-xs text-muted-foreground bg-muted/30">
          이미지 업로드 중...
        </div>
      )}
      <EditorContent editor={editor} />
    </div>
  );
}
