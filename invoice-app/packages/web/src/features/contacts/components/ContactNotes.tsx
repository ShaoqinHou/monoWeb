import { useState } from 'react';
import { Trash2, MessageSquarePlus } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import type { ContactNote } from '../hooks/useContactNotes';

interface ContactNotesProps {
  notes: ContactNote[];
  isLoading: boolean;
  onCreateNote: (content: string) => void;
  onDeleteNote: (noteId: string) => void;
  isCreating?: boolean;
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-NZ', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function ContactNotes({
  notes,
  isLoading,
  onCreateNote,
  onDeleteNote,
  isCreating,
}: ContactNotesProps) {
  const [newNote, setNewNote] = useState('');

  const handleCreate = () => {
    if (newNote.trim()) {
      onCreateNote(newNote.trim());
      setNewNote('');
    }
  };

  return (
    <div className="space-y-4" data-testid="contact-notes-panel">
      <h3 className="text-lg font-semibold text-gray-900">Notes</h3>

      {/* Add Note */}
      <div className="flex items-end gap-2">
        <div className="flex-1">
          <Input
            placeholder="Add a note..."
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            data-testid="new-note-input"
          />
        </div>
        <Button
          variant="primary"
          size="md"
          onClick={handleCreate}
          disabled={!newNote.trim() || isCreating}
          data-testid="add-note-btn"
        >
          <MessageSquarePlus className="h-4 w-4 mr-1" />
          Add
        </Button>
      </div>

      {/* Notes List */}
      {isLoading ? (
        <div className="py-8 text-center text-[#6b7280]" data-testid="notes-loading">
          Loading notes...
        </div>
      ) : notes.length === 0 ? (
        <div className="py-8 text-center text-[#6b7280]" data-testid="notes-empty">
          No notes yet.
        </div>
      ) : (
        <div className="space-y-3" data-testid="notes-list">
          {notes.map((note) => (
            <div
              key={note.id}
              className="flex items-start justify-between rounded-lg border border-gray-200 bg-white p-4"
              data-testid={`note-${note.id}`}
            >
              <div className="flex-1">
                <p className="text-sm text-[#1a1a2e]">{note.content}</p>
                <p className="mt-1 text-xs text-[#6b7280]">{formatDate(note.createdAt)}</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDeleteNote(note.id)}
                data-testid={`delete-note-${note.id}`}
              >
                <Trash2 className="h-4 w-4 text-[#ef4444]" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
