import { useParams, useNavigate } from '@tanstack/react-router';
import { PageContainer } from '../../../components/layout/PageContainer';
import { RecurringBillDetail } from '../components/RecurringBillDetail';
import { RecurringBillForm, type RecurringBillFormData } from '../components/RecurringBillForm';
import {
  useRecurringBill,
  useCreateRecurringBill,
  useUpdateRecurringBill,
  useGenerateRecurringBill,
} from '../hooks/useRecurringBills';
import { useSuppliers } from '../hooks/useBills';

/* ════════════════════════════════════════════
   RecurringBillDetailPage — View a single recurring bill
   ════════════════════════════════════════════ */
export function RecurringBillDetailPage() {
  const { recurringBillId } = useParams({ from: '/purchases/recurring-bills/$recurringBillId' });
  const navigate = useNavigate();
  const { data: bill, isLoading } = useRecurringBill(recurringBillId);
  const updateMutation = useUpdateRecurringBill();
  const generateMutation = useGenerateRecurringBill();

  const handleEdit = () => {
    navigate({
      to: '/purchases/recurring-bills/$recurringBillId/edit',
      params: { recurringBillId },
    });
  };

  const handlePauseResume = (newStatus: 'active' | 'paused') => {
    updateMutation.mutate({ id: recurringBillId, data: { status: newStatus } });
  };

  const handleGenerate = () => {
    generateMutation.mutate(recurringBillId);
  };

  if (isLoading) {
    return (
      <PageContainer
        title="Recurring Bill"
        breadcrumbs={[
          { label: 'Purchases', href: '/purchases' },
          { label: 'Recurring Bills', href: '/purchases/recurring-bills' },
        ]}
      >
        <div className="py-12 text-center text-gray-500" data-testid="rb-detail-loading">
          Loading recurring bill...
        </div>
      </PageContainer>
    );
  }

  if (!bill) {
    return (
      <PageContainer
        title="Recurring Bill"
        breadcrumbs={[
          { label: 'Purchases', href: '/purchases' },
          { label: 'Recurring Bills', href: '/purchases/recurring-bills' },
        ]}
      >
        <div className="py-12 text-center text-gray-500" data-testid="rb-not-found">
          Recurring bill not found
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer
      title={bill.templateName}
      breadcrumbs={[
        { label: 'Purchases', href: '/purchases' },
        { label: 'Recurring Bills', href: '/purchases/recurring-bills' },
        { label: bill.templateName },
      ]}
    >
      <RecurringBillDetail
        bill={bill}
        onEdit={handleEdit}
        onPauseResume={handlePauseResume}
        onGenerate={handleGenerate}
        isUpdating={updateMutation.isPending || generateMutation.isPending}
      />
    </PageContainer>
  );
}

/* ════════════════════════════════════════════
   RecurringBillEditPage — Edit an existing recurring bill
   ════════════════════════════════════════════ */
export function RecurringBillEditPage() {
  const { recurringBillId } = useParams({ from: '/purchases/recurring-bills/$recurringBillId/edit' });
  const navigate = useNavigate();
  const { data: bill, isLoading } = useRecurringBill(recurringBillId);
  const { data: suppliers } = useSuppliers();
  const updateMutation = useUpdateRecurringBill();

  const handleSave = (data: RecurringBillFormData) => {
    updateMutation.mutate(
      {
        id: recurringBillId,
        data: {
          templateName: data.templateName,
          contactId: data.contactId,
          frequency: data.frequency,
          nextDate: data.nextDate,
          endDate: data.endDate || undefined,
        },
      },
      {
        onSuccess: () => {
          navigate({
            to: '/purchases/recurring-bills/$recurringBillId',
            params: { recurringBillId },
          });
        },
      },
    );
  };

  if (isLoading) {
    return (
      <PageContainer
        title="Edit Recurring Bill"
        breadcrumbs={[
          { label: 'Purchases', href: '/purchases' },
          { label: 'Recurring Bills', href: '/purchases/recurring-bills' },
          { label: 'Edit' },
        ]}
      >
        <div className="py-12 text-center text-gray-500" data-testid="rb-edit-loading">
          Loading recurring bill...
        </div>
      </PageContainer>
    );
  }

  if (!bill) {
    return (
      <PageContainer
        title="Edit Recurring Bill"
        breadcrumbs={[
          { label: 'Purchases', href: '/purchases' },
          { label: 'Recurring Bills', href: '/purchases/recurring-bills' },
          { label: 'Edit' },
        ]}
      >
        <div className="py-12 text-center text-gray-500" data-testid="rb-not-found">
          Recurring bill not found
        </div>
      </PageContainer>
    );
  }

  const initialData: Partial<RecurringBillFormData> = {
    templateName: bill.templateName,
    contactId: bill.contactId,
    contactName: bill.contactName,
    frequency: bill.frequency,
    nextDate: bill.nextDate,
    endDate: bill.endDate ?? '',
    reference: '',
    amountType: 'exclusive',
    lineItems: [],
  };

  return (
    <PageContainer
      title="Edit Recurring Bill"
      breadcrumbs={[
        { label: 'Purchases', href: '/purchases' },
        { label: 'Recurring Bills', href: '/purchases/recurring-bills' },
        { label: bill.templateName },
        { label: 'Edit' },
      ]}
    >
      <RecurringBillForm
        suppliers={suppliers ?? []}
        initialData={initialData}
        onSave={handleSave}
        loading={updateMutation.isPending}
      />
    </PageContainer>
  );
}

/* ════════════════════════════════════════════
   RecurringBillCreatePage — Create a new recurring bill
   ════════════════════════════════════════════ */
export function RecurringBillCreatePage() {
  const navigate = useNavigate();
  const { data: suppliers } = useSuppliers();
  const createMutation = useCreateRecurringBill();

  const handleSave = (data: RecurringBillFormData) => {
    createMutation.mutate(
      {
        templateName: data.templateName,
        contactId: data.contactId,
        frequency: data.frequency,
        nextDate: data.nextDate,
        endDate: data.endDate || undefined,
      },
      {
        onSuccess: () => {
          navigate({ to: '/purchases/recurring-bills' });
        },
      },
    );
  };

  return (
    <PageContainer
      title="New Recurring Bill"
      breadcrumbs={[
        { label: 'Purchases', href: '/purchases' },
        { label: 'Recurring Bills', href: '/purchases/recurring-bills' },
        { label: 'New Recurring Bill' },
      ]}
    >
      <RecurringBillForm
        suppliers={suppliers ?? []}
        onSave={handleSave}
        loading={createMutation.isPending}
      />
    </PageContainer>
  );
}
