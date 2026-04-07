import NoteEditor from '@/components/NoteEditor';

export default function NewNotePage() {
  return (
    <main className='mx-auto max-w-3xl px-6 py-8'>
      <h1 className='mb-6 text-2xl font-bold'>New Note</h1>
      <NoteEditor />
    </main>
  );
}
