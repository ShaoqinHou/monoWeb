import { useNavigate } from '@tanstack/react-router';
import { PageContainer } from '../../../components/layout/PageContainer';
import { Button } from '../../../components/ui/Button';
import { CreditNoteList } from '../../../features/invoices/components/CreditNoteList';
import { useCreditNotes } from '../../../features/invoices/hooks/useCreditNotes';
import { Plus } from 'lucide-react';

export function CreditNotesPage() {
  const { data: creditNotes = [], isLoading } = useCreditNotes();
  const navigate = useNavigate();

  const handleCreditNoteClick = (id: string) => {
    navigate({ to: '/sales/credit-notes/$creditNoteId', params: { creditNoteId: id } });
  };

  const handleNewCreditNote = () => {
    navigate({ to: '/sales/credit-notes/new' });
  };

  return (
    <PageContainer
      title="Credit Notes"
      breadcrumbs={[{ label: 'Sales', href: '/sales' }, { label: 'Credit Notes' }]}
      actions={
        <Button onClick={handleNewCreditNote} data-testid="new-credit-note-button">
          <Plus className="h-4 w-4 mr-1" />
          New Credit Note
        </Button>
      }
    >
      <CreditNoteList
        creditNotes={creditNotes}
        onCreditNoteClick={handleCreditNoteClick}
        isLoading={isLoading}
      />
    </PageContainer>
  );
}
