import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getSession } from '@/lib/auth';
import { getNoteById } from '@/lib/notes';
import { generateHTML } from '@tiptap/html';
import StarterKit from '@tiptap/starter-kit';
import DeleteNoteButton from '@/components/DeleteNoteButton';
import ShareToggle from '@/components/ShareToggle';

export default async function NoteViewerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();
  const note = getNoteById(session!.user.id, id);
  if (!note) notFound();

  const updatedAt = new Intl.DateTimeFormat('en', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(note.updatedAt));

  const contentHtml = generateHTML(JSON.parse(note.contentJson), [
    StarterKit.configure({ heading: { levels: [1, 2, 3] } }),
  ]);

  return (
    <main className='mx-auto max-w-3xl px-6 py-12'>
      <div className='mb-2 flex items-center justify-between'>
        <Link
          href='/dashboard'
          className='text-xs text-neutral-400 dark:text-neutral-500 hover:text-foreground transition-colors'
        >
          ← My Notes
        </Link>
        <div className='flex items-center gap-2'>
          <Link
            href={`/notes/${id}/edit`}
            className='rounded-lg px-3 py-1.5 text-sm font-medium text-neutral-500 dark:text-neutral-400 hover:text-foreground transition-colors'
          >
            Edit
          </Link>
          <DeleteNoteButton noteId={id} />
        </div>
      </div>

      <h1 className='mt-4 text-4xl font-bold leading-tight tracking-tight text-foreground'>
        {note.title}
      </h1>

      <p className='mt-3 text-sm text-neutral-400 dark:text-neutral-500'>
        Last updated {updatedAt}
      </p>

      <div className='my-6'>
        <ShareToggle noteId={id} initialIsPublic={note.isPublic} initialSlug={note.publicSlug} />
      </div>

      <hr className='my-8 border-neutral-200 dark:border-neutral-800' />

      <div
        className='tiptap-content text-[1.0625rem] leading-relaxed'
        dangerouslySetInnerHTML={{ __html: contentHtml }}
      />
    </main>
  );
}
