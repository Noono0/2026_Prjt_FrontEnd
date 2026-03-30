"use client";

import { SimpleEditor } from "@/components/tiptap-templates/simple/simple-editor";

type BoardEditorProps = {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  disabled?: boolean;
};

/**
 * 게시판용: Tiptap 공식 Simple Editor 템플릿을 사용합니다.
 * (데모용 다크 토글은 숨기고, 앱 테마와 맞춥니다.)
 */
export default function BoardEditor({
  value,
  onChange,
  placeholder: _placeholder,
  disabled = false,
}: BoardEditorProps) {
  void _placeholder; // Simple Editor는 placeholder UI가 별도; 필요 시 확장
  return (
    <div className="board-simple-editor-root">
      <SimpleEditor
        value={value}
        onChange={onChange}
        disabled={disabled}
        showThemeToggle={false}
      />
    </div>
  );
}
