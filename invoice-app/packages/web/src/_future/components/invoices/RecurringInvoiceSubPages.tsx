import { useParams, useNavigate } from '@tanstack/react-router';
import { PageContainer } from '../../../components/layout/PageContainer';
import {
  useRecurringInvoice,
  useCreateRecurringInvoice,
  useUpdateRecurringInvoice,
  useGenerateRecurringInvoice,
} from '../../../features/invoices/hooks/useRecurringInvoices';
import type { RecurringStatus } from '../../../features/invoices/hooks/useRecurringInvoices';
import { RecurringInvoiceForm } from '../../../features/invoices/components/RecurringInvoiceForm';
import type { RecurringInvoiceFormData } from '../../../features/invoices/components/RecurringInvoiceForm';
import { RecurringInvoiceDetail } from '../../../features/invoices/components/RecurringInvoiceDetail';

/* ════════════════════════════════════════════
   RecurringInvoiceDetailPage — View a single recurring invoice
   ════════════════════════════════════════════ */
export function RecurringInvoiceDetailPage() {
  const { recurringId } = useParams({ from: '/sales/recurring-invoices/$recurringId' });
  const navigate = useNavigate();
  const { data: invoice, isLoading } = useRecurringInvoice(recurringId);
  const updateMutation = useUpdateRecurringInvoice();
  const generateMutation = useGenerateRecurringInvoice();

  const handleEdit = () => {
    navigate({
      to: '/sales/recurring-invoices/$recurringId/edit',
      params: { recurringId },
    });
  };

  const handlePauseResume = (newStatus: RecurringStatus) => {
    updateMutation.mutate({
      id: recurringId,
      data: { status: newStatus },
    });
  };

  const handleGenerate = () => {
    generateMutation.mutate(recurringId);
  };

  if (isLoading) {
    return (
      <PageContainer
        title="Recurring Invoice"
        breadcrumbs={[{ label: 'Recurring Invoices', href: '/sales/recurring-invoices' }]}
      >
        <div className="py-12 text-center text-gray-500" data-testid="recurring-detail-loading">
          Loading recurring invoice...
        </div>
      </PageContainer>
    );
  }

  if (!invoice) {
    return (
      <PageContainer
        title="Recurring Invoice"
        breadcrumbs={[{ label: 'Recurring Invoices', href: '/sales/recurring-invoices' }]}
      >
        <div className="py-12 text-center text-gray-500" data-testid="recurring-not-found">
          Recurring invoice not found
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer
      title={invoice.templateName}
      breadcrumbs={[
        { label: 'Recurring Invoices', href: '/sales/recurring-invoices' },
        { label: invoice.templateName },
      ]}
    >
      <RecurringInvoiceDetail
        invoice={invoice}
        onEdit={handleEdit}
        onPauseResume={handlePauseResume}
        onGenerate={handleGenerate}
        isTransitioning={updateMutation.isPending}
        isGenerating={generateMutation.isPending}
      />
    </PageContainer>
  );
}

/* ════════════════════════════════════════════
   RecurringInvoiceEditPage — Edit an existing recurring invoice
   ════════════════════════════════════════════ */
export function RecurringInvoiceEditPage() {
  const { recurringId } = useParams({ from: '/sales/recurring-invoices/$recurringId/edit' });
  const navigate = useNavigate();
  const { data: invoice, isLoading } = useRecurringInvoice(recurringId);
  const updateMutation = useUpdateRecurringInvoice();

  const handleSubmit = (data: RecurringInvoiceFormData) => {
    updateMutation.mutate(
      {
        id: recurringId,
        data: {
          templateName: data.templateName,
          contactId: data.contactId,
          frequency: data.frequency,
          nextDate: data.nextDate,
          endDate: data.endDate || undefined,
          daysUntilDue: data.daysUntilDue,
        },
      },
      {
        onSuccess: () => {
          navigate({
            to: '/sales/recurring-invoices/$recurringId',
            params: { recurringId },
          });
        },
      },
    );
  };

  if (isLoading) {
    return (
      <PageContainer
        title="Edit Recurring Invoice"
        breadcrumbs={[
          { label: 'Recurring Invoices', href: '/sales/recurring-invoices' },
          { label: 'Edit' },
        ]}
      >
        <div className="py-12 text-center text-gray-500" data-testid="recurring-edit-loading">
          Loading recurring invoice...
        </div>
      </PageContainer>
    );
  }

  if (!invoice) {
    return (
      <PageContainer
        title="Edit Recurring Invoice"
        breadcrumbs={[
          { label: 'Recurring Invoices', href: '/sales/recurring-invoices' },
          { label: 'Edit' },
        ]}
      >
        <div className="py-12 text-center text-gray-500" data-testid="recurring-not-found">
          Recurring invoice not found
        </div>
      </PageContainer>
    );
  }

  const initialData: Partial<RecurringInvoiceFormData> = {
    templateName: invoice.templateName,
    contactId: invoice.contactId,
    frequency: invoice.frequency,
    nextDate: invoice.nextDate,
    endDate: invoice.endDate ?? '',
    daysUntilDue: invoice.daysUntilDue,
  };

  return (
    <PageContainer
      title="Edit Recurring Invoice"
      breadcrumbs={[
        { label: 'Recurring Invoices', href: '/sales/recurring-invoices' },
        { label: invoice.templateName },
        { label: 'Edit' },
      ]}
    >
      <RecurringInvoiceForm
        initialData={initialData}
        onSubmit={handleSubmit}
        isSaving={updateMutation.isPending}
      />
    </PageContainer>
  );
}

/* ════════════════════════════════════════════
   RecurringInvoiceCreatePage — New recurring invoice
   ════════════════════════════════════════════ */
export function RecurringInvoiceCreatePage() {
  const navigate = useNavigate();
  const createMutation = useCreateRecurringInvoice();

  const handleSubmit = (data: RecurringInvoiceFormData) => {
    createMutation.mutate(
      {
        templateName: data.templateName,
        contactId: data.contactId,
        frequency: data.frequency,
        nextDate: data.nextDate,
        endDate: data.endDate || undefined,
        daysUntilDue: data.daysUntilDue,
      },
      {
        onSuccess: () => {
          navigate({ to: '/sales/recurring-invoices' });
        },
      },
    );
  };

  return (
    <PageContainer
      title="New Recurring Invoice"
      breadcrumbs={[
        { label: 'Recurring Invoices', href: '/sales/recurring-invoices' },
        { label: 'New Recurring Invoice' },
      ]}
    >
      <RecurringInvoiceForm
        onSubmit={handleSubmit}
        isSaving={createMutation.isPending}
      />
    </PageContainer>
  );
}
