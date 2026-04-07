import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/auth', () => ({ getSession: vi.fn() }));
vi.mock('@/lib/notes', () => ({ createNote: vi.fn() }));

import { getSession } from '@/lib/auth';
import { createNote } from '@/lib/notes';
import { POST } from '@/app/api/notes/route';

const mockNote = {
  id: 'note-1',
  userId: 'user-1',
  title: 'My Note',
  contentJson: '{}',
  isPublic: false,
  publicSlug: null,
  createdAt: '2025-01-01 10:00:00',
  updatedAt: '2025-01-01 10:00:00',
};

// Vitest's node environment uses undici which treats 'origin' as a forbidden header
// and silently drops it. We use a duck-typed minimal request object instead.
function makeRequest(body: unknown, origin: string | null = 'http://localhost:3000'): Request {
  const headerMap: Record<string, string> = { 'content-type': 'application/json' };
  if (origin !== null) headerMap['origin'] = origin;
  return {
    headers: { get: (name: string) => headerMap[name.toLowerCase()] ?? null },
    json: async () => body,
  } as unknown as Request;
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('POST /api/notes', () => {
  it('returns 403 when origin header is missing', async () => {
    const res = await POST(makeRequest({}, null));
    expect(res.status).toBe(403);
  });

  it('returns 403 when origin does not match', async () => {
    const res = await POST(makeRequest({}, 'https://evil.com'));
    expect(res.status).toBe(403);
  });

  it('returns 401 when session is null', async () => {
    vi.mocked(getSession).mockResolvedValue(null);
    const res = await POST(makeRequest({ title: 'Test' }));
    expect(res.status).toBe(401);
  });

  it('returns 400 when contentJson exceeds 500KB', async () => {
    vi.mocked(getSession).mockResolvedValue({ user: { id: 'user-1' } } as any);
    const res = await POST(makeRequest({ contentJson: 'x'.repeat(500_001) }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('Invalid input');
  });

  it('returns 201 with note on valid request', async () => {
    vi.mocked(getSession).mockResolvedValue({ user: { id: 'user-1' } } as any);
    vi.mocked(createNote).mockResolvedValue(mockNote);
    const res = await POST(makeRequest({ title: 'My Note' }));
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.id).toBe('note-1');
    expect(body.title).toBe('My Note');
  });

  it('passes userId from session to createNote', async () => {
    vi.mocked(getSession).mockResolvedValue({ user: { id: 'user-42' } } as any);
    vi.mocked(createNote).mockResolvedValue(mockNote);
    await POST(makeRequest({ title: 'T' }));
    expect(createNote).toHaveBeenCalledWith('user-42', expect.any(Object));
  });

  it('passes parsed data to createNote', async () => {
    vi.mocked(getSession).mockResolvedValue({ user: { id: 'user-1' } } as any);
    vi.mocked(createNote).mockResolvedValue(mockNote);
    await POST(makeRequest({ title: 'Hello', contentJson: '{"type":"doc"}' }));
    expect(createNote).toHaveBeenCalledWith(
      'user-1',
      expect.objectContaining({ title: 'Hello', contentJson: '{"type":"doc"}' }),
    );
  });
});
