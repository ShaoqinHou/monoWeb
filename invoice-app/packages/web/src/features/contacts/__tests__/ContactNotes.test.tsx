// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ContactNotes } from '../components/ContactNotes';
import type { ContactNote } from '../hooks/useContactNotes';

const MOCK_NOTES: ContactNote[] = [
  {
    id: 'n1',
    contactId: 'c1',
    content: 'Met at industry conference',
    createdAt: '2025-06-15T10:30:00.000Z',
  },
  {
    id: 'n2',
    contactId: 'c1',
    content: 'Prefers email communication',
    createdAt: '2025-07-01T14:00:00.000Z',
  },
  {
    id: 'n3',
    contactId: 'c1',
    content: 'Interested in premium plan',
    createdAt: '2025-08-20T09:15:00.000Z',
  },
];

describe('ContactNotes', () => {
  const defaultProps = {
    notes: MOCK_NOTES,
    isLoading: false,
    onCreateNote: vi.fn(),
    onDeleteNote: vi.fn(),
  };

  it('renders notes list', () => {
    render(<ContactNotes {...defaultProps} />);
    expect(screen.getByText('Met at industry conference')).toBeInTheDocument();
    expect(screen.getByText('Prefers email communication')).toBeInTheDocument();
    expect(screen.getByText('Interested in premium plan')).toBeInTheDocument();
  });

  it('renders the Notes heading', () => {
    render(<ContactNotes {...defaultProps} />);
    expect(screen.getByText('Notes')).toBeInTheDocument();
  });

  it('renders the add note input', () => {
    render(<ContactNotes {...defaultProps} />);
    expect(screen.getByPlaceholderText('Add a note...')).toBeInTheDocument();
  });

  it('renders the Add button', () => {
    render(<ContactNotes {...defaultProps} />);
    expect(screen.getByTestId('add-note-btn')).toBeInTheDocument();
  });

  it('calls onCreateNote when add button is clicked with text', async () => {
    const onCreateNote = vi.fn();
    const user = userEvent.setup();
    render(<ContactNotes {...defaultProps} onCreateNote={onCreateNote} />);

    const input = screen.getByPlaceholderText('Add a note...');
    await user.type(input, 'New note content');
    await user.click(screen.getByTestId('add-note-btn'));

    expect(onCreateNote).toHaveBeenCalledWith('New note content');
  });

  it('clears input after adding note', async () => {
    const user = userEvent.setup();
    render(<ContactNotes {...defaultProps} />);

    const input = screen.getByPlaceholderText('Add a note...') as HTMLInputElement;
    await user.type(input, 'Note text');
    await user.click(screen.getByTestId('add-note-btn'));

    expect(input.value).toBe('');
  });

  it('does not call onCreateNote when input is empty', async () => {
    const onCreateNote = vi.fn();
    const user = userEvent.setup();
    render(<ContactNotes {...defaultProps} onCreateNote={onCreateNote} />);

    await user.click(screen.getByTestId('add-note-btn'));
    expect(onCreateNote).not.toHaveBeenCalled();
  });

  it('calls onDeleteNote when delete button is clicked', async () => {
    const onDeleteNote = vi.fn();
    const user = userEvent.setup();
    render(<ContactNotes {...defaultProps} onDeleteNote={onDeleteNote} />);

    await user.click(screen.getByTestId('delete-note-n1'));
    expect(onDeleteNote).toHaveBeenCalledWith('n1');
  });

  it('shows loading state', () => {
    render(<ContactNotes {...defaultProps} isLoading={true} notes={[]} />);
    expect(screen.getByTestId('notes-loading')).toBeInTheDocument();
    expect(screen.getByText('Loading notes...')).toBeInTheDocument();
  });

  it('shows empty state when no notes', () => {
    render(<ContactNotes {...defaultProps} notes={[]} />);
    expect(screen.getByTestId('notes-empty')).toBeInTheDocument();
    expect(screen.getByText('No notes yet.')).toBeInTheDocument();
  });

  it('renders note dates', () => {
    render(<ContactNotes {...defaultProps} />);
    // Dates are formatted so check testids for each note
    expect(screen.getByTestId('note-n1')).toBeInTheDocument();
    expect(screen.getByTestId('note-n2')).toBeInTheDocument();
    expect(screen.getByTestId('note-n3')).toBeInTheDocument();
  });

  it('disables add button when isCreating is true', () => {
    render(<ContactNotes {...defaultProps} isCreating={true} />);
    expect(screen.getByTestId('add-note-btn')).toBeDisabled();
  });
});
