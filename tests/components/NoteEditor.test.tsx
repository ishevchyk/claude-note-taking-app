import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';

const mockPush = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}));

vi.mock('@tiptap/react', () => ({
  useEditor: vi.fn(() => null),
  EditorContent: () => <div data-testid='editor-content' />,
  useEditorState: vi.fn(() => ({})),
}));

vi.mock('@tiptap/starter-kit', () => ({
  default: { configure: vi.fn(() => ({})) },
}));

import NoteEditor from '@/components/NoteEditor';

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubGlobal('fetch', vi.fn());
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('NoteEditor (create mode)', () => {
  it('renders title input', () => {
    render(<NoteEditor />);
    expect(screen.getByPlaceholderText('Untitled note')).toBeInTheDocument();
  });

  it('renders "Create Note" submit button', () => {
    render(<NoteEditor />);
    expect(screen.getByRole('button', { name: 'Create Note' })).toBeInTheDocument();
  });

  it('shows hint text for create mode', () => {
    render(<NoteEditor />);
    expect(screen.getByText('Press Create to save your note')).toBeInTheDocument();
  });

  it('title input starts empty', () => {
    render(<NoteEditor />);
    expect(screen.getByPlaceholderText('Untitled note')).toHaveValue('');
  });
});

describe('NoteEditor (edit mode)', () => {
  const note = {
    id: 'note-1',
    title: 'Existing Title',
    contentJson: '{"type":"doc","content":[]}',
  };

  it('renders "Save Changes" submit button', () => {
    render(<NoteEditor note={note} />);
    expect(screen.getByRole('button', { name: 'Save Changes' })).toBeInTheDocument();
  });

  it('pre-fills title input with note title', () => {
    render(<NoteEditor note={note} />);
    expect(screen.getByPlaceholderText('Untitled note')).toHaveValue('Existing Title');
  });

  it('shows hint text for edit mode', () => {
    render(<NoteEditor note={note} />);
    expect(screen.getByText('Press Save to update your note')).toBeInTheDocument();
  });
});
