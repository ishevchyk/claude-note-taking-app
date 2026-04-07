import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/auth', () => ({ getSession: vi.fn() }));
vi.mock('@/lib/notes', () => ({ setNotePublic: vi.fn() }));

import { getSession } from '@/lib/auth';
import { setNotePublic } from '@/lib/notes';
import { POST } from '@/app/api/notes/[id]/share/route';

const mockNote = {
  id: 'note-1',
  userId: 'user-1',
  title: 'Test Note',
  contentJson: '{}',
  isPublic: true,
  publicSlug: 'abc-123',
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

describe('POST /api/notes/[id]/share', () => {
  it('returns 403 on wrong origin', async () => {
    const res = await POST(makeRequest({ isPublic: true }, 'https://evil.com'), { params });
    expect(res.status).toBe(403);
  });

  it('returns 403 when origin header is missing', async () => {
    const res = await POST(makeRequest({ isPublic: true }, null), { params });
    expect(res.status).toBe(403);
  });

  it('returns 401 when not authenticated', async () => {
    vi.mocked(getSession).mockResolvedValue(null);
    const res = await POST(makeRequest({ isPublic: true }), { params });
    expect(res.status).toBe(401);
  });

  it('returns 400 when isPublic is not a boolean', async () => {
    vi.mocked(getSession).mockResolvedValue({ user: { id: 'user-1' } } as any);
    const res = await POST(makeRequest({ isPublic: 'yes' }), { params });
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('Invalid input');
  });

  it('returns 400 when isPublic is missing', async () => {
    vi.mocked(getSession).mockResolvedValue({ user: { id: 'user-1' } } as any);
    const res = await POST(makeRequest({}), { params });
    expect(res.status).toBe(400);
  });

  it('returns 404 when note is not found', async () => {
    vi.mocked(getSession).mockResolvedValue({ user: { id: 'user-1' } } as any);
    vi.mocked(setNotePublic).mockReturnValue(null);
    const res = await POST(makeRequest({ isPublic: true }), { params });
    expect(res.status).toBe(404);
  });

  it('returns 200 with { id, isPublic, publicSlug } on success', async () => {
    vi.mocked(getSession).mockResolvedValue({ user: { id: 'user-1' } } as any);
    vi.mocked(setNotePublic).mockReturnValue(mockNote);
    const res = await POST(makeRequest({ isPublic: true }), { params });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({ id: 'note-1', isPublic: true, publicSlug: 'abc-123' });
    expect(body).not.toHaveProperty('contentJson');
  });

  it('passes isPublic=false to setNotePublic when disabling sharing', async () => {
    vi.mocked(getSession).mockResolvedValue({ user: { id: 'user-1' } } as any);
    vi.mocked(setNotePublic).mockReturnValue({ ...mockNote, isPublic: false, publicSlug: null });
    await POST(makeRequest({ isPublic: false }), { params });
    expect(setNotePublic).toHaveBeenCalledWith('user-1', 'note-1', false);
  });
});
