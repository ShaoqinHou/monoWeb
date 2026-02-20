import { useParams, useNavigate } from '@tanstack/react-router';
import { PageContainer } from '../../../components/layout/PageContainer';
import { Button } from '../../../components/ui/Button';
import { Card, CardContent } from '../../../components/ui/Card';
import { Badge, type BadgeVariant } from '../../../components/ui/Badge';
import { CreditNoteForm, type CreditNoteFormData } from '../../../features/invoices/components/CreditNoteForm';
import {
  useCreditNote,
  useCreateCreditNote,
  useTransitionCreditNote,
} from '../../../features/invoices/hooks/useCreditNotes';
import type { CreditNoteStatus } from '../../../features/invoices/hooks/useCreditNotes';
import { Pencil } from 'lucide-react';

const STATUS_CONFIG: Record<CreditNoteStatus, { label: string; variant: BadgeVariant }> = {
  draft: { label: 'Draft', variant: 'default' },
  submitted: { label: 'Submitted', variant: 'info' },
  approved: { label: 'Approved', variant: 'warning' },
  applied: { label: 'Applied', variant: 'success' },
  voided: { label: 'Voided', variant: 'error' },
};

/* ════════════════════════════════════════════
   CreditNoteDetailPage — View a single credit note
   ════════════════════════════════════════════ */
export function CreditNoteDetailPage() {
  const { creditNoteId } = useParams({ from: '/sales/credit-notes/$creditNoteId' });
  const navigate = useNavigate();
  const { data: creditNote, isLoading } = useCreditNote(creditNoteId);
  const transitionMutation = useTransitionCreditNote();

  const handleTransition = (newStatus: CreditNoteStatus) => {
    transitionMutation.mutate({ id: creditNoteId, status: newStatus });
  };

  const handleEdit = () => {
    navigate({ to: '/sales/credit-notes/$creditNoteId/edit', params: { creditNoteId } });
  };

  if (isLoading) {
    return (
      <PageContainer
        title="Credit Note"
        breadcrumbs={[{ label: 'Credit Notes', href: '/sales/credit-notes' }]}
      >
        <div className="py-12 text-center text-gray-500" data-testid="credit-note-detail-loading">
          Loading credit note...
        </div>
      </PageContainer>
    );
  }

  if (!creditNote) {
    return (
      <PageContainer
        title="Credit Note"
        breadcrumbs={[{ label: 'Credit Notes', href: '/sales/credit-notes' }]}
      >
        <div className="py-12 text-center text-gray-500" data-testid="credit-note-not-found">
          Credit note not found
        </div>
      </PageContainer>
    );
  }

  const config = STATUS_CONFIG[creditNote.status] ?? STATUS_CONFIG.draft;
  const canEdit = creditNote.status === 'draft';

  return (
    <PageContainer
      title={creditNote.creditNoteNumber ?? 'Credit Note'}
      breadcrumbs={[
        { label: 'Credit Notes', href: '/sales/credit-notes' },
        { label: creditNote.creditNoteNumber ?? creditNoteId },
      ]}
    >
      <div className="space-y-6" data-testid="credit-note-detail">
        {/* Header row: status badge + actions */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Badge variant={config.variant} data-testid="credit-note-status-badge">
              {config.label}
            </Badge>
            {canEdit && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleEdit}
                data-testid="edit-credit-note-button"
              >
                <Pencil className="h-4 w-4 mr-1" />
                Edit
              </Button>
            )}
          </div>
          <div className="flex items-center gap-2" data-testid="credit-note-actions">
            {creditNote.status === 'draft' && (
              <Button
                variant="primary"
                onClick={() => handleTransition('submitted')}
                disabled={transitionMutation.isPending}
                loading={transitionMutation.isPending}
                data-testid="action-submit"
              >
                Submit for Approval
              </Button>
            )}
            {creditNote.status === 'submitted' && (
              <Button
                variant="primary"
                onClick={() => handleTransition('approved')}
                disabled={transitionMutation.isPending}
                loading={transitionMutation.isPending}
                data-testid="action-approve"
              >
                Approve
              </Button>
            )}
            {creditNote.status === 'approved' && (
              <Button
                variant="primary"
                onClick={() => handleTransition('applied')}
                disabled={transitionMutation.isPending}
                loading={transitionMutation.isPending}
                data-testid="action-apply"
              >
                Apply
              </Button>
            )}
            {(creditNote.status === 'draft' || creditNote.status === 'submitted') && (
              <Button
                variant="destructive"
                onClick={() => handleTransition('voided')}
                disabled={transitionMutation.isPending}
                data-testid="action-void"
              >
                Void
              </Button>
            )}
          </div>
        </div>

        {/* Credit note preview card */}
        <Card>
          <CardContent className="space-y-6 p-8">
            {/* From / To row */}
            <div className="grid grid-cols-2 gap-8">
              <div>
                <p className="text-xs font-semibold uppercase text-gray-500 mb-1">From</p>
                <p className="font-medium text-gray-900">My Organisation</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase text-gray-500 mb-1">To</p>
                <p className="font-medium text-gray-900" data-testid="detail-contact">
                  {creditNote.contactName}
                </p>
              </div>
            </div>

            {/* Credit note metadata */}
            <div className="grid grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-gray-500">Credit Note Number</p>
                <p className="font-medium" data-testid="detail-number">
                  {creditNote.creditNoteNumber}
                </p>
              </div>
              <div>
                <p className="text-gray-500">Type</p>
                <p className="font-medium capitalize">{creditNote.type}</p>
              </div>
              <div>
                <p className="text-gray-500">Date</p>
                <p className="font-medium">{creditNote.date}</p>
              </div>
              <div>
                <p className="text-gray-500">Remaining Credit</p>
                <p className="font-medium" data-testid="detail-remaining">
                  {creditNote.remainingCredit.toFixed(2)}
                </p>
              </div>
            </div>

            {/* Totals */}
            <div className="flex justify-end">
              <div className="w-72 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal</span>
                  <span data-testid="detail-subtotal">{creditNote.subTotal.toFixed(2)}</span>
                </div>
                {creditNote.totalTax > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tax</span>
                    <span data-testid="detail-tax">{creditNote.totalTax.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between border-t border-gray-200 pt-2 font-semibold">
                  <span>Total</span>
                  <span data-testid="detail-total">{creditNote.total.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}

/* ════════════════════════════════════════════
   CreditNoteEditPage — Edit an existing credit note
   ════════════════════════════════════════════ */
export function CreditNoteEditPage() {
  const { creditNoteId } = useParams({ from: '/sales/credit-notes/$creditNoteId/edit' });
  const navigate = useNavigate();
  const { data: creditNote, isLoading } = useCreditNote(creditNoteId);
  const createMutation = useCreateCreditNote();

  const handleSaveDraft = (data: CreditNoteFormData) => {
    // No dedicated update mutation exists; re-create with same data
    createMutation.mutate(
      {
        type: data.type,
        contactId: data.contactId,
        date: data.date,
        subTotal: data.subTotal || undefined,
        totalTax: data.totalTax || undefined,
        total: data.total || undefined,
        linkedInvoiceId: data.linkedInvoiceId || undefined,
        linkedBillId: data.linkedBillId || undefined,
      },
      {
        onSuccess: () => {
          navigate({ to: '/sales/credit-notes/$creditNoteId', params: { creditNoteId } });
        },
      },
    );
  };

  const handleSubmit = (data: CreditNoteFormData) => {
    handleSaveDraft(data);
  };

  if (isLoading) {
    return (
      <PageContainer
        title="Edit Credit Note"
        breadcrumbs={[
          { label: 'Credit Notes', href: '/sales/credit-notes' },
          { label: 'Edit' },
        ]}
      >
        <div className="py-12 text-center text-gray-500" data-testid="credit-note-edit-loading">
          Loading credit note...
        </div>
      </PageContainer>
    );
  }

  if (!creditNote) {
    return (
      <PageContainer
        title="Edit Credit Note"
        breadcrumbs={[
          { label: 'Credit Notes', href: '/sales/credit-notes' },
          { label: 'Edit' },
        ]}
      >
        <div className="py-12 text-center text-gray-500" data-testid="credit-note-not-found">
          Credit note not found
        </div>
      </PageContainer>
    );
  }

  const initialData: Partial<CreditNoteFormData> = {
    type: creditNote.type,
    contactId: creditNote.contactId,
    contactName: creditNote.contactName,
    date: creditNote.date,
    subTotal: creditNote.subTotal,
    totalTax: creditNote.totalTax,
    total: creditNote.total,
    linkedInvoiceId: creditNote.linkedInvoiceId ?? '',
    linkedBillId: creditNote.linkedBillId ?? '',
  };

  return (
    <PageContainer
      title="Edit Credit Note"
      breadcrumbs={[
        { label: 'Credit Notes', href: '/sales/credit-notes' },
        { label: creditNote.creditNoteNumber ?? creditNoteId },
        { label: 'Edit' },
      ]}
    >
      <CreditNoteForm
        initialData={initialData}
        creditNoteNumber={creditNote.creditNoteNumber}
        onSaveDraft={handleSaveDraft}
        onSubmit={handleSubmit}
        isSaving={createMutation.isPending}
      />
    </PageContainer>
  );
}

/* ════════════════════════════════════════════
   CreditNoteCreatePage — New credit note
   ════════════════════════════════════════════ */
export function CreditNoteCreatePage() {
  const navigate = useNavigate();
  const createMutation = useCreateCreditNote();

  const handleSaveDraft = (data: CreditNoteFormData) => {
    createMutation.mutate(
      {
        type: data.type,
        contactId: data.contactId,
        date: data.date,
        subTotal: data.subTotal || undefined,
        totalTax: data.totalTax || undefined,
        total: data.total || undefined,
        linkedInvoiceId: data.linkedInvoiceId || undefined,
        linkedBillId: data.linkedBillId || undefined,
      },
      {
        onSuccess: () => {
          navigate({ to: '/sales/credit-notes' });
        },
      },
    );
  };

  const handleSubmit = (data: CreditNoteFormData) => {
    handleSaveDraft(data);
  };

  return (
    <PageContainer
      title="New Credit Note"
      breadcrumbs={[
        { label: 'Credit Notes', href: '/sales/credit-notes' },
        { label: 'New Credit Note' },
      ]}
    >
      <CreditNoteForm
        onSaveDraft={handleSaveDraft}
        onSubmit={handleSubmit}
        isSaving={createMutation.isPending}
      />
    </PageContainer>
  );
}
