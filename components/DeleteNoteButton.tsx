'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Button from '@/components/Button';

export default function DeleteNoteButton({ noteId }: { noteId: string }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete() {
    setIsDeleting(true);
    setError(null);
    try {
      const res = await fetch(`/api/notes/${noteId}`, { method: 'DELETE' });
      if (!res.ok && res.status !== 204) {
        const data = await res.json();
        throw new Error(data.error ?? 'Failed to delete note');
      }
      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
      setIsDeleting(false);
      setConfirming(false);
    }
  }

  if (confirming) {
    return (
      <div className='flex items-center gap-2'>
        {error && <span className='text-sm text-red-500'>{error}</span>}
        <span className='text-sm text-neutral-500 dark:text-neutral-400'>Delete this note?</span>
        <Button
          variant='ghost'
          size='sm'
          onClick={() => setConfirming(false)}
          disabled={isDeleting}
        >
          Cancel
        </Button>
        <Button
          size='sm'
          onClick={handleDelete}
          disabled={isDeleting}
          className='bg-red-600 hover:bg-red-700 text-white'
        >
          {isDeleting ? 'Deleting…' : 'Delete'}
        </Button>
      </div>
    );
  }

  return (
    <Button variant='ghost' size='sm' onClick={() => setConfirming(true)}>
      Delete
    </Button>
  );
}
