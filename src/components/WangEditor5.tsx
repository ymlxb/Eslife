"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";
import type { IDomEditor, IEditorConfig, IToolbarConfig } from "@wangeditor/editor";

type EditorComponentProps = {
  defaultConfig?: Partial<IEditorConfig>;
  value?: string;
  onCreated?: (editor: IDomEditor) => void;
  onChange?: (editor: IDomEditor) => void;
  mode?: "default" | "simple";
  style?: React.CSSProperties;
};

type ToolbarComponentProps = {
  editor: IDomEditor | null;
  defaultConfig?: Partial<IToolbarConfig>;
  mode?: "default" | "simple";
  style?: React.CSSProperties;
};

const Editor = dynamic<EditorComponentProps>(
  async () => {
    const mod = await import("@wangeditor/editor-for-react");
    return mod.Editor;
  },
  { ssr: false }
);

const Toolbar = dynamic<ToolbarComponentProps>(
  async () => {
    const mod = await import("@wangeditor/editor-for-react");
    return mod.Toolbar;
  },
  { ssr: false }
);

type Props = {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
};

export default function WangEditor5({ value, onChange, placeholder = "请输入内容..." }: Props) {
  const [editor, setEditor] = useState<IDomEditor | null>(null);

  useEffect(() => {
    return () => {
      editor?.destroy();
    };
  }, [editor]);

  const toolbarConfig = useMemo<Partial<IToolbarConfig>>(
    () => ({
      toolbarKeys: [
        "headerSelect",
        "bold",
        "italic",
        "underline",
        "through",
        "color",
        "bgColor",
        "|",
        "bulletedList",
        "numberedList",
        "todo",
        "|",
        "justifyLeft",
        "justifyCenter",
        "justifyRight",
        "|",
        "insertLink",
        "blockquote",
        "codeBlock",
        "|",
        "undo",
        "redo",
      ],
    }),
    []
  );

  const editorConfig = useMemo<Partial<IEditorConfig>>(
    () => ({
      placeholder,
      scroll: true,
      autoFocus: false,
    }),
    [placeholder]
  );

  return (
    <div className="overflow-hidden rounded-lg border border-zinc-300 bg-white">
      <Toolbar
        editor={editor}
        defaultConfig={toolbarConfig}
        mode="default"
        style={{ borderBottom: "1px solid #e4e4e7", padding: "2px 6px" }}
      />
      <Editor
        defaultConfig={editorConfig}
        value={value}
        onCreated={(instance) => setEditor(instance)}
        onChange={(instance) => onChange(instance.getHtml())}
        mode="default"
        style={{ minHeight: 260, maxHeight: 380, overflowY: "auto", padding: "0 4px" }}
      />
    </div>
  );
}
