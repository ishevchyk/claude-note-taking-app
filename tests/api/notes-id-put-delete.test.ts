import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/auth', () => ({ getSession: vi.fn() }));
vi.mock('@/lib/notes', () => ({ updateNote: vi.fn(), deleteNote: vi.fn() }));

import { getSession } from '@/lib/auth';
import { updateNote, deleteNote } from '@/lib/notes';
import { PUT, DELETE } from '@/app/api/notes/[id]/route';

const mockNote = {
  id: 'note-1',
  userId: 'user-1',
  title: 'Updated Note',
  contentJson: '{}',
  isPublic: false,
  publicSlug: null,
  createdAt: '2025-01-01 10:00:00',
  updatedAt: '2025-01-01 11:00:00',
};

// Vitest's node environment (undici) drops 'origin' as a forbidden header.
// Use a duck-typed minimal request object instead.
function makeRequest(body: unknown, origin: string | null = 'http://localhost:3000'): Request {
  const headerMap: Record<string, string> = { 'content-type': 'application/json' };
  if (origin !== null) headerMap['origin'] = origin;
  return {
    headers: { get: (name: string) => headerMap[name.toLowerCase()] ?? null },
    json: async () => body,
  } as unknown as Request;
}

const params = Promise.resolve({ id: 'note-1' });

beforeEach(() => {
  vi.clearAllMocks();
});

// ─── PUT /api/notes/[id] ─────────────────────────────────────────────────────

describe('PUT /api/notes/[id]', () => {
  it('returns 403 on wrong origin', async () => {
    const res = await PUT(makeRequest({}, 'https://evil.com'), { params });
    expect(res.status).toBe(403);
  });

  it('returns 403 when origin header is missing', async () => {
    const res = await PUT(makeRequest({}, null), { params });
    expect(res.status).toBe(403);
  });

  it('returns 401 when not authenticated', async () => {
    vi.mocked(getSession).mockResolvedValue(null);
    const res = await PUT(makeRequest({}), { params });
    expect(res.status).toBe(401);
  });

  it('returns 400 on invalid input (contentJson too large)', async () => {
    vi.mocked(getSession).mockResolvedValue({ user: { id: 'user-1' } } as any);
    const res = await PUT(makeRequest({ contentJson: 'x'.repeat(500_001) }), { params });
    expect(res.status).toBe(400);
  });

  it('returns 404 when note is not found', async () => {
    vi.mocked(getSession).mockResolvedValue({ user: { id: 'user-1' } } as any);
    vi.mocked(updateNote).mockReturnValue(null);
    const res = await PUT(makeRequest({ title: 'New' }), { params });
    expect(res.status).toBe(404);
  });

  it('returns 200 with updated note on success', async () => {
    vi.mocked(getSession).mockResolvedValue({ user: { id: 'user-1' } } as any);
    vi.mocked(updateNote).mockReturnValue(mockNote);
    const res = await PUT(makeRequest({ title: 'Updated Note' }), { params });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.title).toBe('Updated Note');
  });
});

// ─── DELETE /api/notes/[id] ──────────────────────────────────────────────────

describe('DELETE /api/notes/[id]', () => {
  it('returns 403 on wrong origin', async () => {
    const res = await DELETE(makeRequest({}, 'https://evil.com'), { params });
    expect(res.status).toBe(403);
  });

  it('returns 403 when origin header is missing', async () => {
    const res = await DELETE(makeRequest({}, null), { params });
    expect(res.status).toBe(403);
  });

  it('returns 401 when not authenticated', async () => {
    vi.mocked(getSession).mockResolvedValue(null);
    const res = await DELETE(makeRequest({}), { params });
    expect(res.status).toBe(401);
  });

  it('returns 404 when note is not found', async () => {
    vi.mocked(getSession).mockResolvedValue({ user: { id: 'user-1' } } as any);
    vi.mocked(deleteNote).mockReturnValue(false);
    const res = await DELETE(makeRequest({}), { params });
    expect(res.status).toBe(404);
  });

  it('returns 204 with no body on success', async () => {
    vi.mocked(getSession).mockResolvedValue({ user: { id: 'user-1' } } as any);
    vi.mocked(deleteNote).mockReturnValue(true);
    const res = await DELETE(makeRequest({}), { params });
    expect(res.status).toBe(204);
    expect(await res.text()).toBe('');
  });
});
