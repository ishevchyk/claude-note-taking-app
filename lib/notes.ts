import { run, get, query } from '@/lib/db';
import { randomUUID } from 'crypto';

export type Note = {
  id: string;
  userId: string;
  title: string;
  contentJson: string;
  isPublic: boolean;
  publicSlug: string | null;
  createdAt: string;
  updatedAt: string;
};

type NoteRow = {
  id: string;
  user_id: string;
  title: string;
  content_json: string;
  is_public: number;
  public_slug: string | null;
  created_at: string;
  updated_at: string;
};

function toNote(row: NoteRow): Note {
  return {
    id: row.id,
    userId: row.user_id,
    title: row.title,
    contentJson: row.content_json,
    isPublic: row.is_public === 1,
    publicSlug: row.public_slug,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

const EMPTY_DOC = JSON.stringify({ type: 'doc', content: [] });

export async function createNote(
  userId: string,
  data: { title?: string; contentJson?: string },
): Promise<Note> {
  const id = randomUUID();
  const title = data.title?.trim() || 'Untitled note';
  const contentJson = data.contentJson || EMPTY_DOC;

  run(`INSERT INTO notes (id, user_id, title, content_json) VALUES (?, ?, ?, ?)`, [
    id,
    userId,
    title,
    contentJson,
  ]);

  const row = get<NoteRow>(`SELECT * FROM notes WHERE id = ?`, [id]);
  if (!row) throw new Error(`Note ${id} not found after insert`);
  return toNote(row);
}

export function getNotesByUser(userId: string): Note[] {
  const rows = query<NoteRow>(`SELECT * FROM notes WHERE user_id = ? ORDER BY updated_at DESC`, [
    userId,
  ]);
  return rows.map(toNote);
}

export function getNoteById(userId: string, noteId: string): Note | null {
  const row = get<NoteRow>(`SELECT * FROM notes WHERE id = ? AND user_id = ?`, [noteId, userId]);
  return row ? toNote(row) : null;
}

export function updateNote(
  userId: string,
  noteId: string,
  data: { title?: string; contentJson?: string },
): Note | null {
  const sets: string[] = [];
  const values: string[] = [];

  if (data.title !== undefined) {
    sets.push('title = ?');
    values.push(data.title.trim() || 'Untitled note');
  }
  if (data.contentJson !== undefined) {
    sets.push('content_json = ?');
    values.push(data.contentJson);
  }
  if (sets.length === 0) return getNoteById(userId, noteId);

  sets.push("updated_at = datetime('now')");
  values.push(noteId, userId);

  run(`UPDATE notes SET ${sets.join(', ')} WHERE id = ? AND user_id = ?`, values);

  return getNoteById(userId, noteId);
}

export function deleteNote(userId: string, noteId: string): boolean {
  const note = getNoteById(userId, noteId);
  if (!note) return false;
  run(`DELETE FROM notes WHERE id = ? AND user_id = ?`, [noteId, userId]);
  return true;
}

export function setNotePublic(userId: string, noteId: string, isPublic: boolean): Note | null {
  const note = getNoteById(userId, noteId);
  if (!note) return null;

  if (isPublic) {
    const slug = note.publicSlug ?? randomUUID();
    run(
      `UPDATE notes SET is_public = 1, public_slug = ?, updated_at = datetime('now') WHERE id = ? AND user_id = ?`,
      [slug, noteId, userId],
    );
  } else {
    run(
      `UPDATE notes SET is_public = 0, public_slug = NULL, updated_at = datetime('now') WHERE id = ? AND user_id = ?`,
      [noteId, userId],
    );
  }

  return getNoteById(userId, noteId);
}

export function getNoteByPublicSlug(slug: string): Note | null {
  const row = get<NoteRow>(`SELECT * FROM notes WHERE public_slug = ? AND is_public = 1`, [slug]);
  return row ? toNote(row) : null;
}
