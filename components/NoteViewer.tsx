'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';

export default function NoteViewer({ contentJson }: { contentJson: string }) {
  const editor = useEditor({
    extensions: [StarterKit.configure({ heading: { levels: [1, 2, 3] } })],
    content: JSON.parse(contentJson),
    editable: false,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: 'tiptap-content focus:outline-none',
      },
    },
  });

  return <EditorContent editor={editor} />;
}
