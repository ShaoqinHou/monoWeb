import { useState, useMemo } from 'react';
import { useNavigate, useParams } from '@tanstack/react-router';
import { showToast } from '../../dashboard/components/ToastContainer';
import { PageContainer } from '../../../components/layout/PageContainer';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { ExpenseList } from '../components/ExpenseList';
import { ExpenseForm } from '../components/ExpenseForm';
import { ExpenseStatusBadge } from '../components/ExpenseStatusBadge';
import {
  useExpenses,
  useExpense,
  useCreateExpense,
  useDeleteExpense,
  useTransitionExpenseStatus,
} from '../hooks/useExpenses';
import { Plus } from 'lucide-react';
import type { ExpenseStatusType, Expense, CreateExpense } from '@xero-replica/shared';

/* ════════════════════════════════════════════
   ExpensesPage — List of all expenses
   ════════════════════════════════════════════ */
export function ExpensesPage() {
  const { data: expenses = [], isLoading } = useExpenses();
  const [activeTab, setActiveTab] = useState('own');
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  // Compute counts for tabs
  const reviewCount = useMemo(() => expenses.filter((e) => e.status === 'submitted').length, [expenses]);
  const payCount = useMemo(() => expenses.filter((e) => e.status === 'approved').length, [expenses]);

  const STATUS_TABS: { key: string; label: string }[] = [
    { key: 'own', label: 'Your own' },
    { key: 'review', label: `To review (${reviewCount})` },
    { key: 'pay', label: `To pay (${payCount})` },
    { key: 'all', label: 'All expenses' },
    { key: 'explorer', label: 'Explorer' },
  ];

  const filtered = useMemo(() => {
    let result: typeof expenses;
    switch (activeTab) {
      case 'own':
        // Show user's own expenses (draft + submitted)
        result = expenses.filter((e) => e.status === 'draft' || e.status === 'submitted');
        break;
      case 'review':
        // Expenses awaiting review/approval
        result = expenses.filter((e) => e.status === 'submitted');
        break;
      case 'pay':
        // Approved expenses awaiting reimbursement
        result = expenses.filter((e) => e.status === 'approved');
        break;
      case 'explorer':
        // Explorer shows all with analytics (same data, different view in future)
        result = expenses;
        break;
      case 'all':
      default:
        result = expenses;
    }
    if (searchTerm.trim()) {
      const lower = searchTerm.toLowerCase();
      result = result.filter(
        (e) =>
          e.description.toLowerCase().includes(lower) ||
          (e.category ?? '').toLowerCase().includes(lower),
      );
    }
    return result;
  }, [expenses, activeTab, searchTerm]);

  const handleSelect = (id: string) => {
    navigate({ to: '/purchases/expenses/$expenseId', params: { expenseId: id } });
  };

  const handleNew = () => {
    navigate({ to: '/purchases/expenses/new' });
  };

  return (
    <PageContainer
      title="Expenses"
      actions={
        <Button onClick={handleNew} data-testid="new-expense-button">
          <Plus className="h-4 w-4 mr-1" />
          New Expense
        </Button>
      }
    >
      {isLoading ? (
        <div className="py-12 text-center text-gray-500" data-testid="expenses-loading">
          Loading expenses...
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex gap-1 border-b" data-testid="expense-status-tabs">
            {STATUS_TABS.map((tab) => (
              <button
                key={tab.key}
                className={`px-4 py-2 text-sm font-medium transition-colors ${
                  activeTab === tab.key
                    ? 'border-b-2 border-[#0078c8] text-[#0078c8]'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
                onClick={() => setActiveTab(tab.key)}
                data-testid={`tab-${tab.key}`}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <div className="flex items-center">
            <Input
              type="search"
              placeholder="Search expenses"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-64"
              data-testid="expense-search"
            />
          </div>
          <ExpenseList expenses={filtered} onSelect={handleSelect} />
        </div>
      )}
    </PageContainer>
  );
}

/* ════════════════════════════════════════════
   ExpenseCreatePage — New expense
   ════════════════════════════════════════════ */
export function ExpenseCreatePage() {
  const navigate = useNavigate();
  const createMutation = useCreateExpense();

  const handleSubmit = (data: CreateExpense) => {
    createMutation.mutate(data, {
      onSuccess: () => {
        showToast('success', 'Expense created');
        navigate({ to: '/purchases/expenses' });
      },
      onError: (error: Error) => {
        showToast('error', error.message || 'Failed to create expense');
      },
    });
  };

  return (
    <PageContainer
      title="New Expense"
      breadcrumbs={[
        { label: 'Expenses', href: '/purchases/expenses' },
        { label: 'New Expense' },
      ]}
    >
      <ExpenseForm onSubmit={handleSubmit} isLoading={createMutation.isPending} />
    </PageContainer>
  );
}

/* ════════════════════════════════════════════
   ExpenseDetailPage — View a single expense
   ════════════════════════════════════════════ */

const TRANSITION_MAP: Partial<Record<ExpenseStatusType, { label: string; next: ExpenseStatusType }[]>> = {
  draft: [{ label: 'Submit', next: 'submitted' }],
  submitted: [
    { label: 'Approve', next: 'approved' },
    { label: 'Decline', next: 'declined' },
  ],
  approved: [{ label: 'Reimburse', next: 'reimbursed' }],
};

export function ExpenseDetailPage() {
  const { expenseId } = useParams({ from: '/purchases/expenses/$expenseId' });
  const { data: expense, isLoading } = useExpense(expenseId);
  const transitionMutation = useTransitionExpenseStatus();
  const deleteMutation = useDeleteExpense();
  const navigate = useNavigate();

  const handleTransition = (status: ExpenseStatusType) => {
    transitionMutation.mutate({ id: expenseId, status }, {
      onSuccess: () => showToast('success', `Expense ${status}`),
      onError: (err: Error) => showToast('error', err.message || 'Failed to update status'),
    });
  };

  const handleDelete = () => {
    deleteMutation.mutate(expenseId, {
      onSuccess: () => {
        showToast('success', 'Expense deleted');
        navigate({ to: '/purchases/expenses' });
      },
      onError: (err: Error) => {
        showToast('error', err.message || 'Failed to delete expense');
      },
    });
  };

  if (isLoading) {
    return (
      <PageContainer
        title="Expense"
        breadcrumbs={[{ label: 'Expenses', href: '/purchases/expenses' }]}
      >
        <div className="py-12 text-center text-gray-500" data-testid="expense-detail-loading">
          Loading expense...
        </div>
      </PageContainer>
    );
  }

  if (!expense) {
    return (
      <PageContainer
        title="Expense"
        breadcrumbs={[{ label: 'Expenses', href: '/purchases/expenses' }]}
      >
        <div className="py-12 text-center text-gray-500" data-testid="expense-not-found">
          Expense not found
        </div>
      </PageContainer>
    );
  }

  const transitions = TRANSITION_MAP[expense.status] ?? [];

  return (
    <PageContainer
      title={expense.description}
      breadcrumbs={[
        { label: 'Expenses', href: '/purchases/expenses' },
        { label: expense.description },
      ]}
    >
      <div className="space-y-6" data-testid="expense-detail">
        <div className="flex items-center gap-3">
          <ExpenseStatusBadge status={expense.status} />
          <span className="text-sm text-gray-500">
            {expense.date}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-4 rounded-md border p-4">
          <div>
            <p className="text-sm text-gray-500">Description</p>
            <p className="font-medium" data-testid="expense-detail-description">{expense.description}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Category</p>
            <p className="font-medium" data-testid="expense-detail-category">{expense.category ?? '-'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Amount</p>
            <p className="font-medium" data-testid="expense-detail-amount">
              ${expense.amount.toFixed(2)}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Tax</p>
            <p className="font-medium" data-testid="expense-detail-tax">
              ${expense.taxAmount.toFixed(2)} ({expense.taxRate}%)
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Total</p>
            <p className="text-lg font-bold" data-testid="expense-detail-total">
              ${expense.total.toFixed(2)}
            </p>
          </div>
          {expense.accountCode && (
            <div>
              <p className="text-sm text-gray-500">Account Code</p>
              <p className="font-medium">{expense.accountCode}</p>
            </div>
          )}
          {expense.notes && (
            <div className="col-span-2">
              <p className="text-sm text-gray-500">Notes</p>
              <p className="font-medium">{expense.notes}</p>
            </div>
          )}
          {expense.mileageKm != null && (
            <div>
              <p className="text-sm text-gray-500">Mileage</p>
              <p className="font-medium">
                {expense.mileageKm} km @ ${expense.mileageRate}/km
              </p>
            </div>
          )}
          {expense.receiptUrl && (
            <div className="col-span-2">
              <p className="text-sm text-gray-500 mb-1">Receipt</p>
              <img
                src={expense.receiptUrl}
                alt="Receipt"
                className="max-h-40 rounded border"
                data-testid="expense-detail-receipt"
              />
            </div>
          )}
        </div>

        <div className="flex gap-2" data-testid="expense-actions">
          {transitions.map((t) => (
            <Button
              key={t.next}
              variant="primary"
              onClick={() => handleTransition(t.next)}
              loading={transitionMutation.isPending}
              data-testid={`expense-action-${t.next}`}
            >
              {t.label}
            </Button>
          ))}
          {expense.status === 'draft' && (
            <Button
              variant="destructive"
              onClick={handleDelete}
              loading={deleteMutation.isPending}
              data-testid="expense-delete-button"
            >
              Delete
            </Button>
          )}
        </div>
      </div>
    </PageContainer>
  );
}
