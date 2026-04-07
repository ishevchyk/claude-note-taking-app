import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { updateNote, deleteNote } from '@/lib/notes';
import { z } from 'zod';

const allowedOrigin = (process.env.BETTER_AUTH_URL ?? 'http://localhost:3000').replace(/\/$/, '');

function checkOrigin(request: Request) {
  const origin = request.headers.get('origin');
  return origin === allowedOrigin;
}

const updateNoteSchema = z.object({
  title: z.string().optional(),
  contentJson: z.string().max(500_000).optional(),
});

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!checkOrigin(request)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();
  const parsed = updateNoteSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
  }

  const note = updateNote(session.user.id, id, parsed.data);
  if (!note) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  return NextResponse.json(note);
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!checkOrigin(request)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const deleted = deleteNote(session.user.id, id);
  if (!deleted) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  return new NextResponse(null, { status: 204 });
}
