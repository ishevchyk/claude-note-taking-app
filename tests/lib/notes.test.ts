import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockRun, mockGet, mockQuery } = vi.hoisted(() => ({
  mockRun: vi.fn(),
  mockGet: vi.fn(),
  mockQuery: vi.fn(),
}));

vi.mock('@/lib/db', () => ({
  run: mockRun,
  get: mockGet,
  query: mockQuery,
}));

import {
  createNote,
  getNotesByUser,
  getNoteById,
  updateNote,
  deleteNote,
  setNotePublic,
  getNoteByPublicSlug,
} from '@/lib/notes';

const fakeRow = {
  id: 'note-1',
  user_id: 'user-1',
  title: 'Test Note',
  content_json: '{"type":"doc","content":[]}',
  is_public: 0,
  public_slug: null,
  created_at: '2025-01-01 10:00:00',
  updated_at: '2025-01-01 10:00:00',
};

beforeEach(() => {
  vi.clearAllMocks();
});

// ─── toNote mapping ──────────────────────────────────────────────────────────

describe('toNote mapping', () => {
  it('maps snake_case row to camelCase Note', () => {
    mockQuery.mockReturnValue([fakeRow]);
    const notes = getNotesByUser('user-1');
    expect(notes[0]).toMatchObject({
      id: 'note-1',
      userId: 'user-1',
      title: 'Test Note',
      contentJson: '{"type":"doc","content":[]}',
      isPublic: false,
      publicSlug: null,
    });
  });

  it('converts is_public: 1 to isPublic: true', () => {
    mockQuery.mockReturnValue([{ ...fakeRow, is_public: 1, public_slug: 'abc-slug' }]);
    const notes = getNotesByUser('user-1');
    expect(notes[0].isPublic).toBe(true);
    expect(notes[0].publicSlug).toBe('abc-slug');
  });
});

// ─── createNote ──────────────────────────────────────────────────────────────

describe('createNote', () => {
  it('defaults title to "Untitled note" when title is empty string', async () => {
    mockGet.mockReturnValue({ ...fakeRow, title: 'Untitled note' });
    await createNote('user-1', { title: '' });
    const insertCall = mockRun.mock.calls[0];
    expect(insertCall[1]).toContain('Untitled note');
  });

  it('defaults title to "Untitled note" when title is only whitespace', async () => {
    mockGet.mockReturnValue({ ...fakeRow, title: 'Untitled note' });
    await createNote('user-1', { title: '   ' });
    const insertCall = mockRun.mock.calls[0];
    expect(insertCall[1]).toContain('Untitled note');
  });

  it('uses provided title (trimmed)', async () => {
    mockGet.mockReturnValue({ ...fakeRow, title: 'My Note' });
    await createNote('user-1', { title: '  My Note  ' });
    const insertCall = mockRun.mock.calls[0];
    expect(insertCall[1]).toContain('My Note');
  });

  it('defaults contentJson to empty TipTap doc when not provided', async () => {
    mockGet.mockReturnValue(fakeRow);
    await createNote('user-1', {});
    const insertCall = mockRun.mock.calls[0];
    expect(insertCall[1]).toContain('{"type":"doc","content":[]}');
  });

  it('uses provided contentJson', async () => {
    const content = '{"type":"doc","content":[{"type":"paragraph"}]}';
    mockGet.mockReturnValue({ ...fakeRow, content_json: content });
    await createNote('user-1', { contentJson: content });
    const insertCall = mockRun.mock.calls[0];
    expect(insertCall[1]).toContain(content);
  });

  it('throws if get() returns undefined after insert', async () => {
    mockGet.mockReturnValue(undefined);
    await expect(createNote('user-1', { title: 'Test' })).rejects.toThrow('not found after insert');
  });

  it('returns the created note', async () => {
    mockGet.mockReturnValue(fakeRow);
    const note = await createNote('user-1', { title: 'Test Note' });
    expect(note.id).toBe('note-1');
    expect(note.userId).toBe('user-1');
  });
});

// ─── getNotesByUser ──────────────────────────────────────────────────────────

describe('getNotesByUser', () => {
  it('passes userId to query', () => {
    mockQuery.mockReturnValue([]);
    getNotesByUser('user-42');
    expect(mockQuery.mock.calls[0][1]).toContain('user-42');
  });

  it('returns empty array when no notes', () => {
    mockQuery.mockReturnValue([]);
    expect(getNotesByUser('user-1')).toEqual([]);
  });

  it('maps all rows to Note objects', () => {
    mockQuery.mockReturnValue([fakeRow, { ...fakeRow, id: 'note-2' }]);
    const notes = getNotesByUser('user-1');
    expect(notes).toHaveLength(2);
    expect(notes[1].id).toBe('note-2');
  });

  it('query includes ORDER BY updated_at DESC', () => {
    mockQuery.mockReturnValue([]);
    getNotesByUser('user-1');
    expect(mockQuery.mock.calls[0][0]).toMatch(/ORDER BY updated_at DESC/i);
  });
});

// ─── getNoteById ─────────────────────────────────────────────────────────────

describe('getNoteById', () => {
  it('returns note when found', () => {
    mockGet.mockReturnValue(fakeRow);
    const note = getNoteById('user-1', 'note-1');
    expect(note).not.toBeNull();
    expect(note!.id).toBe('note-1');
  });

  it('returns null when not found', () => {
    mockGet.mockReturnValue(undefined);
    expect(getNoteById('user-1', 'missing')).toBeNull();
  });

  it('passes both noteId and userId to query', () => {
    mockGet.mockReturnValue(fakeRow);
    getNoteById('user-1', 'note-1');
    expect(mockGet.mock.calls[0][1]).toContain('note-1');
    expect(mockGet.mock.calls[0][1]).toContain('user-1');
  });
});

// ─── updateNote ──────────────────────────────────────────────────────────────

describe('updateNote', () => {
  it('returns existing note without calling run() when data is empty', () => {
    mockGet.mockReturnValue(fakeRow);
    const note = updateNote('user-1', 'note-1', {});
    expect(mockRun).not.toHaveBeenCalled();
    expect(note!.id).toBe('note-1');
  });

  it('includes title = ? in SET when title is provided', () => {
    mockGet.mockReturnValue(fakeRow);
    updateNote('user-1', 'note-1', { title: 'New Title' });
    const sql = mockRun.mock.calls[0][0] as string;
    expect(sql).toMatch(/title = \?/);
    expect(sql).not.toMatch(/content_json/);
  });

  it('includes content_json = ? in SET when contentJson is provided', () => {
    mockGet.mockReturnValue(fakeRow);
    updateNote('user-1', 'note-1', { contentJson: '{}' });
    const sql = mockRun.mock.calls[0][0] as string;
    expect(sql).toMatch(/content_json = \?/);
    expect(sql).not.toMatch(/title = \?/);
  });

  it('includes both fields when both are provided', () => {
    mockGet.mockReturnValue(fakeRow);
    updateNote('user-1', 'note-1', { title: 'T', contentJson: '{}' });
    const sql = mockRun.mock.calls[0][0] as string;
    expect(sql).toMatch(/title = \?/);
    expect(sql).toMatch(/content_json = \?/);
  });

  it("always appends updated_at = datetime('now')", () => {
    mockGet.mockReturnValue(fakeRow);
    updateNote('user-1', 'note-1', { title: 'T' });
    const sql = mockRun.mock.calls[0][0] as string;
    expect(sql).toMatch(/updated_at = datetime\('now'\)/);
  });

  it('trims whitespace and falls back to "Untitled note" for blank title', () => {
    mockGet.mockReturnValue(fakeRow);
    updateNote('user-1', 'note-1', { title: '   ' });
    const params = mockRun.mock.calls[0][1] as string[];
    expect(params[0]).toBe('Untitled note');
  });
});

// ─── deleteNote ──────────────────────────────────────────────────────────────

describe('deleteNote', () => {
  it('returns false when note does not exist', () => {
    mockGet.mockReturnValue(undefined);
    expect(deleteNote('user-1', 'missing')).toBe(false);
    expect(mockRun).not.toHaveBeenCalled();
  });

  it('calls run() with DELETE SQL and returns true when note exists', () => {
    mockGet.mockReturnValue(fakeRow);
    const result = deleteNote('user-1', 'note-1');
    expect(result).toBe(true);
    expect(mockRun.mock.calls[0][0]).toMatch(/DELETE FROM notes/i);
  });
});

// ─── setNotePublic ───────────────────────────────────────────────────────────

describe('setNotePublic', () => {
  it('returns null when note does not exist', () => {
    mockGet.mockReturnValue(undefined);
    expect(setNotePublic('user-1', 'missing', true)).toBeNull();
  });

  it('generates a new UUID slug when note has no existing slug', () => {
    mockGet
      .mockReturnValueOnce({ ...fakeRow, public_slug: null }) // first call: getNoteById
      .mockReturnValueOnce({ ...fakeRow, is_public: 1, public_slug: 'generated-slug' }); // second: after update
    setNotePublic('user-1', 'note-1', true);
    const params = mockRun.mock.calls[0][1] as string[];
    // slug is the first param in the UPDATE; should be a UUID-like string
    expect(params[0]).toMatch(/^[0-9a-f-]{36}$/);
  });

  it('reuses existing slug when making note public again', () => {
    const existingSlug = 'existing-slug-uuid';
    mockGet
      .mockReturnValueOnce({ ...fakeRow, public_slug: existingSlug })
      .mockReturnValueOnce({ ...fakeRow, is_public: 1, public_slug: existingSlug });
    setNotePublic('user-1', 'note-1', true);
    const params = mockRun.mock.calls[0][1] as string[];
    expect(params[0]).toBe(existingSlug);
  });

  it('sets is_public=0 and public_slug=NULL when making private', () => {
    mockGet
      .mockReturnValueOnce({ ...fakeRow, is_public: 1, public_slug: 'some-slug' })
      .mockReturnValueOnce({ ...fakeRow, is_public: 0, public_slug: null });
    setNotePublic('user-1', 'note-1', false);
    const sql = mockRun.mock.calls[0][0] as string;
    expect(sql).toMatch(/is_public = 0/);
    expect(sql).toMatch(/public_slug = NULL/);
  });
});

// ─── getNoteByPublicSlug ─────────────────────────────────────────────────────

describe('getNoteByPublicSlug', () => {
  it('returns note when found with matching public slug', () => {
    mockGet.mockReturnValue({ ...fakeRow, is_public: 1, public_slug: 'my-slug' });
    const note = getNoteByPublicSlug('my-slug');
    expect(note).not.toBeNull();
  });

  it('returns null when get returns undefined', () => {
    mockGet.mockReturnValue(undefined);
    expect(getNoteByPublicSlug('no-such-slug')).toBeNull();
  });

  it('query filters by is_public = 1', () => {
    mockGet.mockReturnValue(undefined);
    getNoteByPublicSlug('my-slug');
    const sql = mockGet.mock.calls[0][0] as string;
    expect(sql).toMatch(/is_public = 1/);
  });
});
