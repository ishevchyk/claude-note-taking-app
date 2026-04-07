import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import ShareToggle from '@/components/ShareToggle';

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubGlobal('fetch', vi.fn());
  Object.defineProperty(window, 'location', {
    value: { origin: 'http://localhost:3000' },
    writable: true,
  });
  Object.defineProperty(navigator, 'clipboard', {
    value: { writeText: vi.fn().mockResolvedValue(undefined) },
    writable: true,
  });
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('ShareToggle', () => {
  it('renders "Public sharing" label', () => {
    render(<ShareToggle noteId='note-1' initialIsPublic={false} initialSlug={null} />);
    expect(screen.getByText('Public sharing')).toBeInTheDocument();
  });

  it('renders toggle with role="switch"', () => {
    render(<ShareToggle noteId='note-1' initialIsPublic={false} initialSlug={null} />);
    expect(screen.getByRole('switch')).toBeInTheDocument();
  });

  it('sets aria-checked=false when not public', () => {
    render(<ShareToggle noteId='note-1' initialIsPublic={false} initialSlug={null} />);
    expect(screen.getByRole('switch')).toHaveAttribute('aria-checked', 'false');
  });

  it('sets aria-checked=true when public', () => {
    render(<ShareToggle noteId='note-1' initialIsPublic={true} initialSlug='abc-123' />);
    expect(screen.getByRole('switch')).toHaveAttribute('aria-checked', 'true');
  });

  it('shows "Sharing is off" when not public', () => {
    render(<ShareToggle noteId='note-1' initialIsPublic={false} initialSlug={null} />);
    expect(screen.getByText('Sharing is off')).toBeInTheDocument();
  });

  it('shows public URL when public and slug is provided', async () => {
    render(<ShareToggle noteId='note-1' initialIsPublic={true} initialSlug='my-slug' />);
    // origin is set via useEffect
    await waitFor(() => {
      expect(screen.getByRole('link')).toHaveAttribute('href', 'http://localhost:3000/p/my-slug');
    });
  });

  it('shows Copy button when public URL is available', async () => {
    render(<ShareToggle noteId='note-1' initialIsPublic={true} initialSlug='my-slug' />);
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Copy' })).toBeInTheDocument();
    });
  });

  it('calls fetch POST to share endpoint on toggle click', async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify({ isPublic: true, publicSlug: 'new-slug' }), { status: 200 }),
    );
    render(<ShareToggle noteId='note-1' initialIsPublic={false} initialSlug={null} />);
    await userEvent.click(screen.getByRole('switch'));
    expect(fetch).toHaveBeenCalledWith(
      '/api/notes/note-1/share',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ isPublic: true }),
      }),
    );
  });

  it('flips aria-checked after successful toggle', async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify({ isPublic: true, publicSlug: 'new-slug' }), { status: 200 }),
    );
    render(<ShareToggle noteId='note-1' initialIsPublic={false} initialSlug={null} />);
    await userEvent.click(screen.getByRole('switch'));
    await waitFor(() => {
      expect(screen.getByRole('switch')).toHaveAttribute('aria-checked', 'true');
    });
  });

  it('calls clipboard.writeText with the public URL on Copy click', async () => {
    render(<ShareToggle noteId='note-1' initialIsPublic={true} initialSlug='my-slug' />);
    await waitFor(() => screen.getByRole('button', { name: 'Copy' }));
    await userEvent.click(screen.getByRole('button', { name: 'Copy' }));
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('http://localhost:3000/p/my-slug');
  });

  it('shows "Copied!" after copy and reverts after timeout', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    render(<ShareToggle noteId='note-1' initialIsPublic={true} initialSlug='my-slug' />);
    await waitFor(() => screen.getByRole('button', { name: 'Copy' }));
    await userEvent.click(screen.getByRole('button', { name: 'Copy' }));
    expect(await screen.findByText('Copied!')).toBeInTheDocument();
    act(() => vi.advanceTimersByTime(2100));
    await waitFor(() => {
      expect(screen.getByText('Copy')).toBeInTheDocument();
    });
    vi.useRealTimers();
  });

  it('disables toggle while loading', async () => {
    let resolve: (v: any) => void;
    vi.mocked(fetch).mockReturnValue(new Promise((r) => (resolve = r)));
    render(<ShareToggle noteId='note-1' initialIsPublic={false} initialSlug={null} />);
    await userEvent.click(screen.getByRole('switch'));
    expect(screen.getByRole('switch')).toBeDisabled();
    resolve!(new Response(JSON.stringify({ isPublic: true, publicSlug: 'slug' }), { status: 200 }));
  });
});
