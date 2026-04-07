'use client';

import { useEditor, EditorContent, useEditorState } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Button from '@/components/Button';

type ToolbarButtonProps = {
  active?: boolean;
  onClick: () => void;
  title: string;
  children: React.ReactNode;
};

function ToolbarButton({ active, onClick, title, children }: ToolbarButtonProps) {
  return (
    <button
      type='button'
      title={title}
      onClick={onClick}
      className={`rounded px-2 py-1 text-sm font-medium transition-colors ${
        active
          ? 'bg-foreground text-background'
          : 'text-neutral-500 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:text-foreground'
      }`}
    >
      {children}
    </button>
  );
}

type Props = {
  note?: { id: string; title: string; contentJson: string };
};

export default function NoteEditor({ note }: Props) {
  const router = useRouter();
  const isEditing = !!note;
  const [title, setTitle] = useState(note?.title ?? '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
    ],
    content: note ? JSON.parse(note.contentJson) : undefined,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: 'tiptap-content focus:outline-none min-h-48 p-4 text-foreground',
      },
    },
  });

  const editorState = useEditorState({
    editor,
    selector: (ctx) => ({
      isBold: ctx.editor?.isActive('bold') ?? false,
      isItalic: ctx.editor?.isActive('italic') ?? false,
      isH1: ctx.editor?.isActive('heading', { level: 1 }) ?? false,
      isH2: ctx.editor?.isActive('heading', { level: 2 }) ?? false,
      isH3: ctx.editor?.isActive('heading', { level: 3 }) ?? false,
      isBulletList: ctx.editor?.isActive('bulletList') ?? false,
      isCode: ctx.editor?.isActive('code') ?? false,
      isCodeBlock: ctx.editor?.isActive('codeBlock') ?? false,
    }),
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!editor) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const url = isEditing ? `/api/notes/${note.id}` : '/api/notes';
      const method = isEditing ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim() || 'Untitled note',
          contentJson: JSON.stringify(editor.getJSON()),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? `Failed to ${isEditing ? 'update' : 'create'} note`);
      }

      const saved = await res.json();
      router.push(`/notes/${saved.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className='space-y-0'>
      {/* Title field */}
      <div className='border border-neutral-200 dark:border-neutral-800 rounded-t-xl px-4 py-3 bg-neutral-50 dark:bg-neutral-900'>
        <label className='block text-xs font-semibold uppercase tracking-widest text-neutral-400 dark:text-neutral-500 mb-1'>
          Title
        </label>
        <input
          type='text'
          placeholder='Untitled note'
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className='w-full bg-transparent text-2xl font-bold text-foreground placeholder:text-neutral-300 dark:placeholder:text-neutral-700 focus:outline-none'
        />
      </div>

      {/* Content field */}
      <div className='border-x border-neutral-200 dark:border-neutral-800'>
        <div className='border-b border-neutral-200 dark:border-neutral-800 px-4 py-2 bg-neutral-50 dark:bg-neutral-900 flex items-center justify-between'>
          <span className='text-xs font-semibold uppercase tracking-widest text-neutral-400 dark:text-neutral-500'>
            Content
          </span>
          {/* Toolbar */}
          <div className='flex flex-wrap gap-0.5'>
            <ToolbarButton
              title='Bold'
              active={editorState?.isBold}
              onClick={() => editor?.chain().focus().toggleBold().run()}
            >
              <strong>B</strong>
            </ToolbarButton>
            <ToolbarButton
              title='Italic'
              active={editorState?.isItalic}
              onClick={() => editor?.chain().focus().toggleItalic().run()}
            >
              <em>I</em>
            </ToolbarButton>
            <span className='w-px bg-neutral-200 dark:bg-neutral-700 mx-1' />
            <ToolbarButton
              title='Heading 1'
              active={editorState?.isH1}
              onClick={() => editor?.chain().focus().toggleHeading({ level: 1 }).run()}
            >
              H1
            </ToolbarButton>
            <ToolbarButton
              title='Heading 2'
              active={editorState?.isH2}
              onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}
            >
              H2
            </ToolbarButton>
            <ToolbarButton
              title='Heading 3'
              active={editorState?.isH3}
              onClick={() => editor?.chain().focus().toggleHeading({ level: 3 }).run()}
            >
              H3
            </ToolbarButton>
            <span className='w-px bg-neutral-200 dark:bg-neutral-700 mx-1' />
            <ToolbarButton
              title='Bullet list'
              active={editorState?.isBulletList}
              onClick={() => editor?.chain().focus().toggleBulletList().run()}
            >
              ≡
            </ToolbarButton>
            <ToolbarButton
              title='Inline code'
              active={editorState?.isCode}
              onClick={() => editor?.chain().focus().toggleCode().run()}
            >
              {'<>'}
            </ToolbarButton>
            <ToolbarButton
              title='Code block'
              active={editorState?.isCodeBlock}
              onClick={() => editor?.chain().focus().toggleCodeBlock().run()}
            >
              {'{}'}
            </ToolbarButton>
            <ToolbarButton
              title='Horizontal rule'
              onClick={() => editor?.chain().focus().setHorizontalRule().run()}
            >
              —
            </ToolbarButton>
          </div>
        </div>
        <div className='bg-background'>
          <EditorContent editor={editor} />
        </div>
      </div>

      {/* Footer / submit */}
      <div className='border border-neutral-200 dark:border-neutral-800 rounded-b-xl px-4 py-3 bg-neutral-50 dark:bg-neutral-900 flex items-center justify-between'>
        {error ? (
          <p className='text-sm text-red-500'>{error}</p>
        ) : (
          <span className='text-xs text-neutral-400 dark:text-neutral-500'>
            {isEditing ? 'Press Save to update your note' : 'Press Create to save your note'}
          </span>
        )}
        <Button type='submit' disabled={isSubmitting}>
          {isEditing
            ? isSubmitting
              ? 'Saving…'
              : 'Save Changes'
            : isSubmitting
              ? 'Creating…'
              : 'Create Note'}
        </Button>
      </div>
    </form>
  );
}
