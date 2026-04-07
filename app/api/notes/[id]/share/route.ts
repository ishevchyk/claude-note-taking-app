import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { setNotePublic } from '@/lib/notes';
import { z } from 'zod';

const allowedOrigin = (process.env.BETTER_AUTH_URL ?? 'http://localhost:3000').replace(/\/$/, '');

function checkOrigin(request: Request) {
  const origin = request.headers.get('origin');
  return origin === allowedOrigin;
}

const shareSchema = z.object({
  isPublic: z.boolean(),
});

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!checkOrigin(request)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();
  const parsed = shareSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
  }

  const note = setNotePublic(session.user.id, id, parsed.data.isPublic);
  if (!note) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  return NextResponse.json({ id: note.id, isPublic: note.isPublic, publicSlug: note.publicSlug });
}
