import { useState } from 'react';
import { showToast } from '../../dashboard/components/ToastContainer';
import { PageContainer } from '../../../components/layout/PageContainer';
import { Button } from '../../../components/ui/Button';
import { BudgetList } from '../components/BudgetList';
import { BudgetEditor, type BudgetLineInput } from '../components/BudgetEditor';
import {
  useBudgets,
  useBudget,
  useCreateBudget,
  useUpdateBudget,
  useDeleteBudget,
  type Budget,
} from '../hooks/useBudgets';

export function BudgetsPage() {
  const { data: budgets, isLoading } = useBudgets();
  const createBudget = useCreateBudget();
  const updateBudget = useUpdateBudget();
  const deleteBudget = useDeleteBudget();

  const [mode, setMode] = useState<'list' | 'create' | 'edit'>('list');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [budgetName, setBudgetName] = useState('');
  const [budgetYear, setBudgetYear] = useState('');
  const [budgetLines, setBudgetLines] = useState<BudgetLineInput[]>([]);

  const { data: editingBudget } = useBudget(editingId ?? '');

  const handleCreate = () => {
    setBudgetName('');
    setBudgetYear('');
    setBudgetLines([]);
    setMode('create');
  };

  const handleSelect = (budget: Budget) => {
    setEditingId(budget.id);
    setBudgetName(budget.name);
    setBudgetYear(budget.financialYear);
    setBudgetLines(
      (budget.lines ?? []).map((l) => ({
        accountCode: l.accountCode,
        accountName: l.accountName,
        month1: l.month1,
        month2: l.month2,
        month3: l.month3,
        month4: l.month4,
        month5: l.month5,
        month6: l.month6,
        month7: l.month7,
        month8: l.month8,
        month9: l.month9,
        month10: l.month10,
        month11: l.month11,
        month12: l.month12,
      })),
    );
    setMode('edit');
  };

  const handleSaveNew = () => {
    createBudget.mutate(
      { name: budgetName, financialYear: budgetYear, lines: budgetLines },
      {
        onSuccess: () => {
          setMode('list');
          showToast('success', 'Budget created');
        },
        onError: (err: Error) => {
          showToast('error', err.message || 'Failed to create budget');
        },
      },
    );
  };

  const handleSaveEdit = () => {
    if (!editingId) return;
    updateBudget.mutate(
      { id: editingId, updates: { name: budgetName, financialYear: budgetYear, lines: budgetLines } },
      {
        onSuccess: () => {
          setMode('list');
          showToast('success', 'Budget saved');
        },
        onError: (err: Error) => {
          showToast('error', err.message || 'Failed to save budget');
        },
      },
    );
  };

  const handleDelete = (id: string) => {
    deleteBudget.mutate(id, {
      onSuccess: () => showToast('success', 'Budget deleted'),
      onError: (err: Error) => {
        showToast('error', err.message || 'Failed to delete budget');
      },
    });
  };

  if (isLoading) {
    return (
      <PageContainer
        title="Budgets"
        breadcrumbs={[{ label: 'Reports', href: '/reporting' }, { label: 'Budgets' }]}
      >
        <div className="text-[#6b7280]" data-testid="budgets-loading">Loading budgets...</div>
      </PageContainer>
    );
  }

  if (mode === 'create') {
    return (
      <PageContainer
        title="New Budget"
        breadcrumbs={[
          { label: 'Reports', href: '/reporting' },
          { label: 'Budgets', href: '/reporting/budgets' },
          { label: 'New' },
        ]}
      >
        <BudgetEditor
          name={budgetName}
          financialYear={budgetYear}
          lines={budgetLines}
          onNameChange={setBudgetName}
          onYearChange={setBudgetYear}
          onLinesChange={setBudgetLines}
          onSave={handleSaveNew}
          onCancel={() => setMode('list')}
          saving={createBudget.isPending}
        />
      </PageContainer>
    );
  }

  if (mode === 'edit' && editingId) {
    return (
      <PageContainer
        title={`Edit Budget: ${budgetName}`}
        breadcrumbs={[
          { label: 'Reports', href: '/reporting' },
          { label: 'Budgets', href: '/reporting/budgets' },
          { label: budgetName },
        ]}
      >
        <BudgetEditor
          name={budgetName}
          financialYear={budgetYear}
          lines={budgetLines}
          onNameChange={setBudgetName}
          onYearChange={setBudgetYear}
          onLinesChange={setBudgetLines}
          onSave={handleSaveEdit}
          onCancel={() => setMode('list')}
          saving={updateBudget.isPending}
        />
      </PageContainer>
    );
  }

  return (
    <PageContainer
      title="Budgets"
      breadcrumbs={[{ label: 'Reports', href: '/reporting' }, { label: 'Budgets' }]}
      actions={
        <Button size="sm" onClick={handleCreate}>
          New Budget
        </Button>
      }
    >
      <BudgetList budgets={budgets ?? []} onSelect={handleSelect} />
    </PageContainer>
  );
}
