import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

const mockPush = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}));

import DeleteNoteButton from '@/components/DeleteNoteButton';

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubGlobal('fetch', vi.fn());
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('DeleteNoteButton', () => {
  it('renders "Delete" button initially', () => {
    render(<DeleteNoteButton noteId='note-1' />);
    expect(screen.getByRole('button', { name: 'Delete' })).toBeInTheDocument();
  });

  it('shows confirmation UI after Delete is clicked', async () => {
    render(<DeleteNoteButton noteId='note-1' />);
    await userEvent.click(screen.getByRole('button', { name: 'Delete' }));
    expect(screen.getByText('Delete this note?')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
  });

  it('returns to initial state when Cancel is clicked', async () => {
    render(<DeleteNoteButton noteId='note-1' />);
    await userEvent.click(screen.getByRole('button', { name: 'Delete' }));
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(screen.queryByText('Delete this note?')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Delete' })).toBeInTheDocument();
  });

  it('calls DELETE on /api/notes/[noteId] with correct URL', async () => {
    vi.mocked(fetch).mockResolvedValue(new Response(null, { status: 204 }));
    render(<DeleteNoteButton noteId='note-abc' />);
    await userEvent.click(screen.getByRole('button', { name: 'Delete' }));
    await userEvent.click(screen.getByRole('button', { name: 'Delete' }));
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('/api/notes/note-abc', { method: 'DELETE' });
    });
  });

  it('redirects to /dashboard after successful deletion', async () => {
    vi.mocked(fetch).mockResolvedValue(new Response(null, { status: 204 }));
    render(<DeleteNoteButton noteId='note-1' />);
    await userEvent.click(screen.getByRole('button', { name: 'Delete' }));
    await userEvent.click(screen.getByRole('button', { name: 'Delete' }));
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/dashboard');
    });
  });

  it('returns to initial "Delete" state when server returns an error', async () => {
    // Component sets confirming=false in catch, so error message is not rendered.
    // The user sees the original Delete button again.
    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify({ error: 'Not found' }), { status: 404 }),
    );
    render(<DeleteNoteButton noteId='note-1' />);
    await userEvent.click(screen.getByRole('button', { name: 'Delete' }));
    await userEvent.click(screen.getByRole('button', { name: 'Delete' }));
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Delete' })).toBeInTheDocument();
      expect(screen.queryByText('Delete this note?')).not.toBeInTheDocument();
    });
    expect(mockPush).not.toHaveBeenCalled();
  });

  it('returns to initial state on network failure', async () => {
    vi.mocked(fetch).mockRejectedValue(new Error('Network error'));
    render(<DeleteNoteButton noteId='note-1' />);
    await userEvent.click(screen.getByRole('button', { name: 'Delete' }));
    await userEvent.click(screen.getByRole('button', { name: 'Delete' }));
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Delete' })).toBeInTheDocument();
    });
    expect(mockPush).not.toHaveBeenCalled();
  });

  it('disables buttons while deletion is in progress', async () => {
    let resolve: (v: any) => void;
    vi.mocked(fetch).mockReturnValue(new Promise((r) => (resolve = r)));
    render(<DeleteNoteButton noteId='note-1' />);
    await userEvent.click(screen.getByRole('button', { name: 'Delete' }));
    await userEvent.click(screen.getByRole('button', { name: 'Delete' }));
    expect(await screen.findByText('Deleting\u2026')).toBeInTheDocument();
    const buttons = screen.getAllByRole('button');
    buttons.forEach((btn) => expect(btn).toBeDisabled());
    resolve!(new Response(null, { status: 204 }));
  });
});
