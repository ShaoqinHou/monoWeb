import { useState, useCallback } from 'react';
import { useParams, useNavigate } from '@tanstack/react-router';
import { showToast } from '../../dashboard/components/ToastContainer';
import { PageContainer } from '../../../components/layout/PageContainer';
import { Button } from '../../../components/ui/Button';
import { PurchaseOrderDetail } from '../components/PurchaseOrderDetail';
import { PurchaseOrderForm, type PurchaseOrderFormData } from '../components/PurchaseOrderForm';
import {
  usePurchaseOrder,
  useCreatePurchaseOrder,
  useUpdatePurchaseOrder,
  useTransitionPurchaseOrder,
  useConvertPurchaseOrder,
} from '../hooks/usePurchaseOrders';
import type { PurchaseOrderStatus } from '../hooks/usePurchaseOrders';
import { useSuppliers } from '../hooks/useBills';
import { useAccounts } from '../../accounting/hooks/useAccounts';
import { useTaxRates } from '../../accounting/hooks/useTaxRates';

/* ════════════════════════════════════════════
   PurchaseOrderDetailPage — View a single PO
   with inline edit support
   ════════════════════════════════════════════ */
export function PurchaseOrderDetailPage() {
  const { orderId } = useParams({ from: '/purchases/purchase-orders/$orderId' });
  const navigate = useNavigate();
  const { data: purchaseOrder, isLoading } = usePurchaseOrder(orderId);
  const transitionMutation = useTransitionPurchaseOrder();
  const convertMutation = useConvertPurchaseOrder();
  const updateMutation = useUpdatePurchaseOrder();
  const { data: suppliers = [] } = useSuppliers();
  const { data: accountsRaw = [] } = useAccounts();
  const accountOptions = accountsRaw.map((a) => ({ value: a.code, label: `${a.code} - ${a.name}` }));
  const { data: taxRatesRaw = [] } = useTaxRates();
  const taxRateOptions = taxRatesRaw.map((tr) => ({ value: String(tr.rate), label: tr.name }));

  // Inline edit mode
  const [isEditing, setIsEditing] = useState(false);

  const handleStatusChange = useCallback(
    (status: PurchaseOrderStatus) => {
      transitionMutation.mutate({ id: orderId, status }, {
        onSuccess: () => showToast('success', `Purchase order ${status}`),
        onError: (err: Error) => showToast('error', err.message || 'Failed to update status'),
      });
    },
    [orderId, transitionMutation],
  );

  const handleEdit = useCallback(() => {
    setIsEditing(true);
  }, []);

  const handleCancelEdit = useCallback(() => {
    setIsEditing(false);
  }, []);

  const handleSaveEdit = useCallback(
    (data: PurchaseOrderFormData) => {
      updateMutation.mutate(
        {
          id: orderId,
          data: {
            contactId: data.contactId,
            date: data.date,
            deliveryDate: data.deliveryDate || undefined,
            deliveryAddress: data.deliveryAddress || undefined,
            reference: data.reference || undefined,
            lineItems: data.lineItems.map((li) => ({
              description: li.description,
              quantity: li.quantity,
              unitPrice: li.unitPrice,
              taxRate: li.taxRate,
              discount: li.discount,
              accountCode: li.accountCode || undefined,
            })),
          },
        },
        {
          onSuccess: () => {
            showToast('success', 'Purchase order saved');
            setIsEditing(false);
          },
          onError: (error: Error) => {
            showToast('error', error.message || 'Failed to save purchase order');
          },
        },
      );
    },
    [orderId, updateMutation],
  );

  const handleConvertToBill = useCallback(() => {
    convertMutation.mutate(orderId, {
      onSuccess: () => {
        showToast('success', 'Purchase order converted to bill');
        navigate({ to: '/purchases/bills' });
      },
      onError: (err: Error) => showToast('error', err.message || 'Failed to convert purchase order'),
    });
  }, [orderId, convertMutation, navigate]);

  if (isLoading) {
    return (
      <PageContainer
        title="Purchase Order"
        breadcrumbs={[
          { label: 'Purchase Orders', href: '/purchases/purchase-orders' },
        ]}
      >
        <div className="py-12 text-center text-gray-500" data-testid="po-detail-loading">
          Loading purchase order...
        </div>
      </PageContainer>
    );
  }

  if (!purchaseOrder) {
    return (
      <PageContainer
        title="Purchase Order"
        breadcrumbs={[
          { label: 'Purchase Orders', href: '/purchases/purchase-orders' },
        ]}
      >
        <div className="py-12 text-center text-gray-500" data-testid="po-not-found">
          Purchase order not found.
        </div>
      </PageContainer>
    );
  }

  // Inline edit mode
  if (isEditing) {
    const initialData: Partial<PurchaseOrderFormData> = {
      contactId: purchaseOrder.contactId,
      contactName: purchaseOrder.contactName,
      date: purchaseOrder.date,
      deliveryDate: purchaseOrder.deliveryDate ?? '',
      deliveryAddress: purchaseOrder.deliveryAddress ?? '',
      reference: purchaseOrder.reference ?? '',
      lineItems: purchaseOrder.lineItems?.map((li) => ({
        description: li.description,
        quantity: li.quantity,
        unitPrice: li.unitPrice,
        accountCode: li.accountCode ?? '',
        taxRate: li.taxRate,
        discount: li.discount,
      })) ?? [],
    };

    return (
      <PageContainer
        title="Edit Purchase Order"
        breadcrumbs={[
          { label: 'Purchase Orders', href: '/purchases/purchase-orders' },
          { label: purchaseOrder.poNumber ?? orderId },
          { label: 'Edit' },
        ]}
        actions={
          <Button
            variant="outline"
            onClick={handleCancelEdit}
            data-testid="po-cancel-edit-btn"
          >
            Cancel
          </Button>
        }
      >
        <PurchaseOrderForm
          initialData={initialData}
          onSave={(data) => handleSaveEdit(data)}
          loading={updateMutation.isPending}
          suppliers={suppliers}
          accountOptions={accountOptions}
          taxRateOptions={taxRateOptions}
          onCreateNew={() => navigate({ to: '/contacts/new' })}
        />
      </PageContainer>
    );
  }

  return (
    <PageContainer
      title={purchaseOrder.poNumber ?? 'Purchase Order'}
      breadcrumbs={[
        { label: 'Purchase Orders', href: '/purchases/purchase-orders' },
        { label: purchaseOrder.poNumber ?? orderId },
      ]}
    >
      <PurchaseOrderDetail
        purchaseOrder={purchaseOrder}
        onStatusChange={handleStatusChange}
        onEdit={handleEdit}
        onConvertToBill={handleConvertToBill}
        loading={transitionMutation.isPending}
        convertLoading={convertMutation.isPending}
      />
    </PageContainer>
  );
}

/* ════════════════════════════════════════════
   PurchaseOrderEditPage — DEPRECATED
   Kept as re-export for backward compatibility.
   Edit is now inline in PurchaseOrderDetailPage.
   ════════════════════════════════════════════ */
export { PurchaseOrderDetailPage as PurchaseOrderEditPage };

/* ════════════════════════════════════════════
   PurchaseOrderCreatePage — New purchase order
   ════════════════════════════════════════════ */
export function PurchaseOrderCreatePage() {
  const navigate = useNavigate();
  const createMutation = useCreatePurchaseOrder();
  const transitionMutation = useTransitionPurchaseOrder();
  const { data: suppliers = [] } = useSuppliers();
  const { data: accountsRaw = [] } = useAccounts();
  const accountOptions = accountsRaw.map((a) => ({ value: a.code, label: `${a.code} - ${a.name}` }));
  const { data: taxRatesRaw = [] } = useTaxRates();
  const taxRateOptions = taxRatesRaw.map((tr) => ({ value: String(tr.rate), label: tr.name }));

  const handleSave = useCallback(
    (data: PurchaseOrderFormData, action: 'draft' | 'submit') => {
      createMutation.mutate(
        {
          contactId: data.contactId,
          date: data.date,
          deliveryDate: data.deliveryDate || undefined,
          deliveryAddress: data.deliveryAddress || undefined,
          reference: data.reference || undefined,
          lineItems: data.lineItems.map((li) => ({
            description: li.description,
            quantity: li.quantity,
            unitPrice: li.unitPrice,
            taxRate: li.taxRate,
            discount: li.discount,
            accountCode: li.accountCode || undefined,
          })),
        },
        {
          onSuccess: (created) => {
            if (action === 'submit' && created?.id) {
              transitionMutation.mutate({ id: created.id, status: 'submitted' as PurchaseOrderStatus }, {
                onSuccess: () => {
                  showToast('success', 'Purchase order submitted');
                  navigate({ to: '/purchases/purchase-orders' });
                },
                onError: () => {
                  showToast('success', 'Purchase order created (submit failed)');
                  navigate({ to: '/purchases/purchase-orders' });
                },
              });
              return;
            }
            showToast('success', 'Purchase order created');
            navigate({ to: '/purchases/purchase-orders' });
          },
          onError: (err: Error) => showToast('error', err.message || 'Failed to create purchase order'),
        },
      );
    },
    [createMutation, transitionMutation, navigate],
  );

  return (
    <PageContainer
      title="New Purchase Order"
      breadcrumbs={[
        { label: 'Purchase Orders', href: '/purchases/purchase-orders' },
        { label: 'New Purchase Order' },
      ]}
    >
      <PurchaseOrderForm
        onSave={(data, action) => handleSave(data, action)}
        loading={createMutation.isPending}
        suppliers={suppliers}
        accountOptions={accountOptions}
        taxRateOptions={taxRateOptions}
        onCreateNew={() => navigate({ to: '/contacts/new' })}
      />
    </PageContainer>
  );
}
