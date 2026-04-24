import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { createNote } from '@/lib/notes';
import { z } from 'zod';

const createNoteSchema = z.object({
  title: z.string().optional(),
  contentJson: z.string().max(500_000).optional(),
});

export async function POST(request: Request) {
  const origin = request.headers.get('origin');
  console.log(origin)
  const allowedOrigin = (process.env.BETTER_AUTH_URL ?? 'http://localhost:3000').replace(/\/$/, '');
  if (!origin || origin !== allowedOrigin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const parsed = createNoteSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
  }

  const note = await createNote(session.user.id, parsed.data);
  return NextResponse.json(note, { status: 201 });
}
