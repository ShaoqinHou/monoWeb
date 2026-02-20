import { useCallback } from 'react';
import { useParams, useNavigate } from '@tanstack/react-router';
import { PageContainer } from '../../../components/layout/PageContainer';
import { BillForm } from '../components/BillForm';
import { useBill, useUpdateBill, useSuppliers } from '../hooks/useBills';
import type { BillFormData } from '../types';

/* ════════════════════════════════════════════
   BillEditPage — Edit an existing bill
   ════════════════════════════════════════════ */
export function BillEditPage() {
  const { billId } = useParams({ from: '/purchases/bills/$billId/edit' });
  const navigate = useNavigate();
  const { data: bill, isLoading } = useBill(billId);
  const { data: suppliers = [] } = useSuppliers();
  const updateMutation = useUpdateBill();

  const handleSave = useCallback(
    (data: BillFormData) => {
      updateMutation.mutate(
        {
          id: billId,
          data: {
            contactId: data.contactId,
            reference: data.reference || undefined,
            amountType: data.amountType,
            currency: data.currency,
            date: data.date,
            dueDate: data.dueDate,
            lineItems: data.lineItems.map((li) => ({
              description: li.description,
              quantity: li.quantity,
              unitPrice: li.unitPrice,
              accountCode: li.accountCode || undefined,
              taxRate: li.taxRate,
              discount: li.discount,
            })),
          },
        },
        {
          onSuccess: () => {
            navigate({ to: '/purchases/bills/$billId', params: { billId } });
          },
        },
      );
    },
    [billId, updateMutation, navigate],
  );

  if (isLoading) {
    return (
      <PageContainer
        title="Edit Bill"
        breadcrumbs={[
          { label: 'Bills', href: '/purchases/bills' },
          { label: 'Edit' },
        ]}
      >
        <div className="py-12 text-center text-gray-500" data-testid="bill-edit-loading">
          Loading bill...
        </div>
      </PageContainer>
    );
  }

  if (!bill) {
    return (
      <PageContainer
        title="Edit Bill"
        breadcrumbs={[
          { label: 'Bills', href: '/purchases/bills' },
          { label: 'Edit' },
        ]}
      >
        <div className="py-12 text-center text-gray-500" data-testid="bill-not-found">
          Bill not found.
        </div>
      </PageContainer>
    );
  }

  const initialData: Partial<BillFormData> = {
    contactId: bill.contactId,
    reference: bill.reference ?? '',
    amountType: bill.amountType as 'exclusive' | 'inclusive' | 'no_tax',
    currency: bill.currency,
    date: bill.date,
    dueDate: bill.dueDate,
    lineItems: bill.lineItems.map((li) => ({
      description: li.description,
      quantity: li.quantity,
      unitPrice: li.unitPrice,
      accountCode: li.accountCode ?? '',
      taxRate: li.taxRate,
      discount: li.discount,
    })),
  };

  return (
    <PageContainer
      title="Edit Bill"
      breadcrumbs={[
        { label: 'Bills', href: '/purchases/bills' },
        { label: bill.billNumber ?? billId },
        { label: 'Edit' },
      ]}
    >
      <BillForm
        suppliers={suppliers}
        initialData={initialData}
        onSave={(data) => handleSave(data)}
        loading={updateMutation.isPending}
      />
    </PageContainer>
  );
}
