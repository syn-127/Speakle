import { useEditor, EditorContent, BubbleMenu } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import Placeholder from '@tiptap/extension-placeholder';
import CharacterCount from '@tiptap/extension-character-count';
import TextAlign from '@tiptap/extension-text-align';
import { EditorToolbar } from './EditorToolbar';
import { cn } from '@/lib/utils';
import { useEffect } from 'react';

interface TipTapEditorProps {
  content: string;
  onChange: (json: string, html: string) => void;
  placeholder?: string;
  className?: string;
}

export function TipTapEditor({ content, onChange, placeholder, className }: TipTapEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        codeBlock: false,
      }),
      Underline,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: { class: 'text-primary underline' },
      }),
      Image.configure({
        HTMLAttributes: { class: 'rounded-lg max-w-full' },
      }),
      Placeholder.configure({
        placeholder: placeholder ?? 'Start writing your post... (type / for commands)',
      }),
      CharacterCount,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
    ],
    content: content ? JSON.parse(content) as object : undefined,
    onUpdate: ({ editor }) => {
      onChange(JSON.stringify(editor.getJSON()), editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'prose prose-slate max-w-none focus:outline-none min-h-[400px] p-6',
      },
    },
  });

  useEffect(() => {
    if (!editor) return;
    const parsed = content ? JSON.parse(content) as object : null;
    if (parsed && JSON.stringify(editor.getJSON()) !== content) {
      editor.commands.setContent(parsed, false);
    }
  }, [content]);

  const wordCount = editor?.storage.characterCount?.words() ?? 0;

  return (
    <div className={cn('relative flex flex-col rounded-lg border bg-background', className)}>
      <EditorToolbar editor={editor} />

      {editor && (
        <BubbleMenu
          editor={editor}
          tippyOptions={{ duration: 100 }}
          className="flex items-center gap-1 rounded-lg border bg-background shadow-lg p-1"
        >
          <button
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={cn('rounded px-2 py-1 text-sm font-medium', editor.isActive('bold') && 'bg-accent')}
          >
            B
          </button>
          <button
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={cn('rounded px-2 py-1 text-sm italic', editor.isActive('italic') && 'bg-accent')}
          >
            I
          </button>
          <button
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            className={cn('rounded px-2 py-1 text-sm underline', editor.isActive('underline') && 'bg-accent')}
          >
            U
          </button>
          <button
            onClick={() => {
              const url = window.prompt('URL:');
              if (url) editor.chain().focus().setLink({ href: url }).run();
            }}
            className={cn('rounded px-2 py-1 text-sm', editor.isActive('link') && 'bg-accent')}
          >
            Link
          </button>
        </BubbleMenu>
      )}

      <EditorContent editor={editor} className="flex-1 overflow-y-auto" />

      <div className="flex items-center justify-end border-t bg-muted/30 px-4 py-1.5 text-xs text-muted-foreground">
        {wordCount} words · {editor?.storage.characterCount?.characters() ?? 0} characters
      </div>
    </div>
  );
}
