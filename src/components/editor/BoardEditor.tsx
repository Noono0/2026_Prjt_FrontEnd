"use client";

import { useEffect } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import FileHandler from "@tiptap/extension-file-handler";
import { uploadBoardImage } from "@/lib/upload";

type BoardEditorProps = {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
};

async function handleInsertImages(
  files: File[],
  editor: NonNullable<ReturnType<typeof useEditor>>,
  pos?: number
) {
  const imageFiles = files.filter((file) => file.type.startsWith("image/"));

  for (const file of imageFiles) {
    const imageUrl = await uploadBoardImage(file);

    if (typeof pos === "number") {
      editor
        .chain()
        .focus()
        .insertContentAt(pos, {
          type: "image",
          attrs: { src: imageUrl, alt: file.name },
        })
        .run();
    } else {
      editor.chain().focus().setImage({ src: imageUrl, alt: file.name }).run();
    }
  }
}

export default function BoardEditor({
  value,
  onChange,
  placeholder,
}: BoardEditorProps) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit,
      Image.configure({
        inline: false,
        allowBase64: false,
        HTMLAttributes: {
          class: "max-w-full rounded-lg my-3 border border-slate-700",
        },
      }),
      FileHandler.configure({
        allowedMimeTypes: ["image/png", "image/jpeg", "image/gif", "image/webp"],
        onPaste: async (editor, files) => {
          await handleInsertImages(files, editor as never);
        },
        onDrop: async (editor, files, pos) => {
          await handleInsertImages(files, editor as never, pos);
        },
      }),
    ],
    content: value || "",
    editorProps: {
      attributes: {
        class:
          "min-h-[420px] w-full rounded-b-xl border border-t-0 border-slate-700 bg-[#081326] px-4 py-4 text-sm text-slate-100 outline-none",
      },
    },
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  useEffect(() => {
    if (!editor) return;
    if (value !== editor.getHTML()) {
      editor.commands.setContent(value || "", { emitUpdate: false });
    }
  }, [editor, value]);

  if (!editor) return null;

  return (
    <div className="overflow-hidden rounded-xl border border-slate-700 bg-[#0b1730]">
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-700 bg-[#0c1a35] p-3">
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`rounded px-3 py-1 text-sm ${
            editor.isActive("bold") ? "bg-indigo-500 text-white" : "bg-slate-800 text-slate-200"
          }`}
        >
          B
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`rounded px-3 py-1 text-sm ${
            editor.isActive("italic") ? "bg-indigo-500 text-white" : "bg-slate-800 text-slate-200"
          }`}
        >
          I
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleStrike().run()}
          className={`rounded px-3 py-1 text-sm ${
            editor.isActive("strike") ? "bg-indigo-500 text-white" : "bg-slate-800 text-slate-200"
          }`}
        >
          S
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`rounded px-3 py-1 text-sm ${
            editor.isActive("bulletList") ? "bg-indigo-500 text-white" : "bg-slate-800 text-slate-200"
          }`}
        >
          목록
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          className={`rounded px-3 py-1 text-sm ${
            editor.isActive("blockquote") ? "bg-indigo-500 text-white" : "bg-slate-800 text-slate-200"
          }`}
        >
          인용
        </button>

        <label className="cursor-pointer rounded bg-slate-800 px-3 py-1 text-sm text-slate-200">
          이미지
          <input
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={async (e) => {
              const files = Array.from(e.target.files ?? []);
              await handleInsertImages(files, editor);
              e.target.value = "";
            }}
          />
        </label>

        <button
          type="button"
          onClick={() => editor.chain().focus().undo().run()}
          className="rounded bg-slate-800 px-3 py-1 text-sm text-slate-200"
        >
          되돌리기
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().redo().run()}
          className="rounded bg-slate-800 px-3 py-1 text-sm text-slate-200"
        >
          다시하기
        </button>
      </div>

      <div className="bg-[#081326]">
        <EditorContent editor={editor} />
        {!value && placeholder ? (
          <div className="pointer-events-none -mt-[410px] px-4 py-4 text-sm text-slate-500">
            {placeholder}
          </div>
        ) : null}
      </div>
    </div>
  );
}