import { notFound } from 'next/navigation';
import { getNoteByPublicSlug } from '@/lib/notes';
import { generateHTML } from '@tiptap/html';
import StarterKit from '@tiptap/starter-kit';

export default async function PublicNotePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const note = getNoteByPublicSlug(slug);
  if (!note) notFound();

  const contentHtml = generateHTML(JSON.parse(note.contentJson), [
    StarterKit.configure({ heading: { levels: [1, 2, 3] } }),
  ]);

  return (
    <main className='mx-auto max-w-3xl px-6 py-12'>
      <h1 className='text-4xl font-bold leading-tight tracking-tight text-foreground'>
        {note.title}
      </h1>

      <hr className='my-8 border-neutral-200 dark:border-neutral-800' />

      <div
        className='tiptap-content text-[1.0625rem] leading-relaxed'
        dangerouslySetInnerHTML={{ __html: contentHtml }}
      />
    </main>
  );
}
