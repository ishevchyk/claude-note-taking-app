import Link from 'next/link';
import { getSession } from '@/lib/auth';
import { getNotesByUser, type Note } from '@/lib/notes';
import { relativeTime } from '@/lib/utils';

function NoteCard({ note }: { note: Note }) {
  return (
    <Link
      href={`/notes/${note.id}`}
      className='group block rounded-xl border border-neutral-200 dark:border-neutral-800 bg-background px-5 py-4 hover:border-neutral-400 dark:hover:border-neutral-600 hover:shadow-sm transition-all'
    >
      <p className='font-semibold text-foreground truncate group-hover:text-neutral-700 dark:group-hover:text-neutral-200'>
        {note.title}
      </p>
      <p className='mt-1 text-xs text-neutral-400 dark:text-neutral-500'>
        Updated {relativeTime(note.updatedAt)}
      </p>
    </Link>
  );
}

export default async function DashboardPage() {
  const session = await getSession();
  const notes = getNotesByUser(session!.user.id);

  return (
    <main className='mx-auto max-w-3xl px-6 py-8'>
      <div className='flex items-center justify-between mb-8'>
        <h1 className='text-2xl font-bold'>My Notes</h1>
        <Link
          href='/notes/new'
          className='rounded-lg bg-neutral-900 dark:bg-neutral-100 px-4 py-2 text-sm font-medium text-neutral-50 dark:text-neutral-900 hover:opacity-90 transition-opacity'
        >
          New Note
        </Link>
      </div>

      {notes.length === 0 ? (
        <div className='rounded-xl border border-dashed border-neutral-300 dark:border-neutral-700 px-8 py-16 text-center'>
          <p className='text-neutral-500 dark:text-neutral-400'>
            You have no notes yet.{' '}
            <Link
              href='/notes/new'
              className='font-medium text-foreground underline underline-offset-2 hover:opacity-70'
            >
              Create your first one.
            </Link>
          </p>
        </div>
      ) : (
        <div className='flex flex-col gap-3'>
          {notes.map((note) => (
            <NoteCard key={note.id} note={note} />
          ))}
        </div>
      )}
    </main>
  );
}
