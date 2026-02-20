import { useState } from 'react';
import { PageContainer } from '../../../components/layout/PageContainer';
import { Button } from '../../../components/ui/Button';
import { Dialog } from '../../../components/ui/Dialog';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { PayItemList } from '../components/PayItemList';
import { usePayItems, useCreatePayItem, useUpdatePayItem, useDeletePayItem } from '../hooks/usePayItems';
import type { PayItem, PayItemType, PayItemRateType, CreatePayItemInput } from '../hooks/usePayItems';

const TYPE_OPTIONS = [
  { value: 'earnings', label: 'Earnings' },
  { value: 'deduction', label: 'Deduction' },
  { value: 'reimbursement', label: 'Reimbursement' },
  { value: 'tax', label: 'Tax' },
];

const RATE_TYPE_OPTIONS = [
  { value: 'fixed', label: 'Fixed Amount' },
  { value: 'per_hour', label: 'Per Hour' },
  { value: 'percentage', label: 'Percentage' },
];

interface PayItemFormState {
  name: string;
  type: PayItemType;
  rateType: PayItemRateType;
  amount: string;
  accountCode: string;
  isDefault: boolean;
  isActive: boolean;
}

const INITIAL_FORM: PayItemFormState = {
  name: '',
  type: 'earnings',
  rateType: 'fixed',
  amount: '',
  accountCode: '',
  isDefault: false,
  isActive: true,
};

export function PayItemsPage() {
  const { data: items, isLoading } = usePayItems();
  const createPayItem = useCreatePayItem();
  const updatePayItem = useUpdatePayItem();
  const deletePayItem = useDeletePayItem();
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<PayItem | null>(null);
  const [form, setForm] = useState<PayItemFormState>(INITIAL_FORM);

  const openCreate = () => {
    setEditingItem(null);
    setForm(INITIAL_FORM);
    setShowForm(true);
  };

  const openEdit = (item: PayItem) => {
    setEditingItem(item);
    setForm({
      name: item.name,
      type: item.type,
      rateType: item.rateType,
      amount: String(item.amount),
      accountCode: item.accountCode ?? '',
      isDefault: item.isDefault,
      isActive: item.isActive,
    });
    setShowForm(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data: CreatePayItemInput = {
      name: form.name,
      type: form.type,
      rateType: form.rateType,
      amount: parseFloat(form.amount) || 0,
      accountCode: form.accountCode || undefined,
      isDefault: form.isDefault,
      isActive: form.isActive,
    };

    if (editingItem) {
      updatePayItem.mutate(
        { id: editingItem.id, updates: data },
        { onSuccess: () => setShowForm(false) },
      );
    } else {
      createPayItem.mutate(data, {
        onSuccess: () => setShowForm(false),
      });
    }
  };

  if (isLoading) {
    return (
      <PageContainer
        title="Pay Items"
        breadcrumbs={[{ label: 'Payroll', href: '/payroll' }, { label: 'Pay Items' }]}
      >
        <div className="text-[#6b7280]" data-testid="pay-items-loading">Loading pay items...</div>
      </PageContainer>
    );
  }

  return (
    <PageContainer
      title="Pay Items"
      breadcrumbs={[{ label: 'Payroll', href: '/payroll' }, { label: 'Pay Items' }]}
      actions={
        <Button size="sm" onClick={openCreate}>
          Add Pay Item
        </Button>
      }
    >
      <PayItemList items={items ?? []} onEdit={openEdit} />

      <Dialog
        open={showForm}
        onClose={() => setShowForm(false)}
        title={editingItem ? 'Edit Pay Item' : 'Add Pay Item'}
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowForm(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              form="pay-item-form"
              loading={createPayItem.isPending || updatePayItem.isPending}
            >
              {editingItem ? 'Save Changes' : 'Add Pay Item'}
            </Button>
          </>
        }
      >
        <form id="pay-item-form" onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />
          <Select
            label="Type"
            options={TYPE_OPTIONS}
            value={form.type}
            onChange={(e) => setForm({ ...form, type: e.target.value as PayItemType })}
          />
          <Select
            label="Rate Type"
            options={RATE_TYPE_OPTIONS}
            value={form.rateType}
            onChange={(e) => setForm({ ...form, rateType: e.target.value as PayItemRateType })}
          />
          <Input
            label="Amount"
            type="number"
            value={form.amount}
            onChange={(e) => setForm({ ...form, amount: e.target.value })}
          />
          <Input
            label="Account Code"
            value={form.accountCode}
            onChange={(e) => setForm({ ...form, accountCode: e.target.value })}
          />
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.isDefault}
                onChange={(e) => setForm({ ...form, isDefault: e.target.checked })}
                className="rounded border-gray-300"
              />
              Default
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                className="rounded border-gray-300"
              />
              Active
            </label>
          </div>
        </form>
      </Dialog>
    </PageContainer>
  );
}
