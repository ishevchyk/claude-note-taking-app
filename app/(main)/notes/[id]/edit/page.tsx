import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getSession } from '@/lib/auth';
import { getNoteById } from '@/lib/notes';
import NoteEditor from '@/components/NoteEditor';

export default async function EditNotePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();
  const note = getNoteById(session!.user.id, id);
  if (!note) notFound();

  return (
    <main className='mx-auto max-w-3xl px-6 py-8'>
      <div className='mb-6 flex items-center justify-between'>
        <h1 className='text-2xl font-bold'>Edit Note</h1>
        <Link
          href={`/notes/${id}`}
          className='text-sm text-neutral-400 dark:text-neutral-500 hover:text-foreground transition-colors'
        >
          Cancel
        </Link>
      </div>
      <NoteEditor note={note} />
    </main>
  );
}
