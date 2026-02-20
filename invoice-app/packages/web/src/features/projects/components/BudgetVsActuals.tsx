import { useState } from 'react';
import { Button } from '../../../components/ui/Button';
import { useProjectBudget, useUpdateProjectBudget } from '../hooks/useProjectBudget';
import type { BudgetCategory } from '../hooks/useProjectBudget';

interface BudgetVsActualsProps {
  projectId: string;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-NZ', {
    style: 'currency',
    currency: 'NZD',
    minimumFractionDigits: 2,
  }).format(amount);
}

function getColorClass(percentUsed: number): string {
  if (percentUsed > 100) return 'text-red-600';
  if (percentUsed >= 80) return 'text-yellow-600';
  return 'text-green-600';
}

function getBgColorClass(percentUsed: number): string {
  if (percentUsed > 100) return 'bg-red-500';
  if (percentUsed >= 80) return 'bg-yellow-500';
  return 'bg-green-500';
}

export function BudgetVsActuals({ projectId }: BudgetVsActualsProps) {
  const { data, isLoading } = useProjectBudget(projectId);
  const updateBudget = useUpdateProjectBudget();
  const [editing, setEditing] = useState(false);
  const [editValues, setEditValues] = useState<BudgetCategory[]>([]);

  if (isLoading || !data) {
    return (
      <div data-testid="budget-loading" className="p-4 text-sm text-gray-500">
        Loading budget data...
      </div>
    );
  }

  const handleStartEdit = () => {
    setEditValues(data.categories.map((c) => ({ ...c })));
    setEditing(true);
  };

  const handleCancelEdit = () => {
    setEditing(false);
    setEditValues([]);
  };

  const handleBudgetChange = (categoryId: string, newBudget: number) => {
    setEditValues((prev) =>
      prev.map((c) => {
        if (c.id !== categoryId) return c;
        const variance = newBudget - c.actual;
        const percentUsed = newBudget > 0 ? (c.actual / newBudget) * 100 : 0;
        return { ...c, budget: newBudget, variance, percentUsed };
      }),
    );
  };

  const handleSave = () => {
    updateBudget.mutate(
      { projectId, categories: editValues },
      { onSuccess: () => setEditing(false) },
    );
  };

  const categories = editing ? editValues : data.categories;

  return (
    <div data-testid="budget-vs-actuals" className="rounded-lg border border-gray-200 bg-white p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Budget vs Actuals</h3>
        {!editing ? (
          <Button variant="outline" size="sm" onClick={handleStartEdit}>
            Update Budget
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={handleCancelEdit}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleSave} loading={updateBudget.isPending}>
              Save
            </Button>
          </div>
        )}
      </div>

      {/* Overall progress bar */}
      <div className="mb-6">
        <div className="flex justify-between text-xs text-gray-500 mb-1">
          <span>Overall Budget Utilization</span>
          <span data-testid="total-percent">{Math.round(data.totalPercentUsed)}%</span>
        </div>
        <div
          className="h-3 w-full rounded-full bg-gray-100 overflow-hidden"
          role="progressbar"
          aria-valuenow={Math.round(data.totalPercentUsed)}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div
            data-testid="total-progress-bar"
            className={`h-full rounded-full transition-all ${getBgColorClass(data.totalPercentUsed)}`}
            style={{ width: `${Math.min(data.totalPercentUsed, 100)}%` }}
          />
        </div>
      </div>

      {/* Category table */}
      <table data-testid="budget-table" className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-200">
            <th className="text-left py-2 font-medium text-gray-500">Category</th>
            <th className="text-right py-2 font-medium text-gray-500">Budget</th>
            <th className="text-right py-2 font-medium text-gray-500">Actual</th>
            <th className="text-right py-2 font-medium text-gray-500">Variance</th>
            <th className="text-right py-2 font-medium text-gray-500">% Used</th>
          </tr>
        </thead>
        <tbody>
          {categories.map((cat) => (
            <tr key={cat.id} className="border-b border-gray-100" data-testid={`budget-row-${cat.id}`}>
              <td className="py-2 text-gray-700">{cat.name}</td>
              <td className="py-2 text-right text-gray-700">
                {editing ? (
                  <input
                    type="number"
                    data-testid={`budget-input-${cat.id}`}
                    className="w-24 text-right border border-gray-300 rounded px-2 py-1 text-sm"
                    value={cat.budget}
                    onChange={(e) => handleBudgetChange(cat.id, Number(e.target.value))}
                  />
                ) : (
                  formatCurrency(cat.budget)
                )}
              </td>
              <td className="py-2 text-right text-gray-700">{formatCurrency(cat.actual)}</td>
              <td
                className={`py-2 text-right font-medium ${cat.variance >= 0 ? 'text-green-600' : 'text-red-600'}`}
              >
                {formatCurrency(cat.variance)}
              </td>
              <td className={`py-2 text-right font-medium ${getColorClass(cat.percentUsed)}`}>
                {Math.round(cat.percentUsed)}%
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="border-t-2 border-gray-300 font-semibold">
            <td className="py-2 text-gray-900">Total</td>
            <td className="py-2 text-right text-gray-900">{formatCurrency(data.totalBudget)}</td>
            <td className="py-2 text-right text-gray-900">{formatCurrency(data.totalActual)}</td>
            <td
              className={`py-2 text-right ${data.totalVariance >= 0 ? 'text-green-600' : 'text-red-600'}`}
            >
              {formatCurrency(data.totalVariance)}
            </td>
            <td className={`py-2 text-right ${getColorClass(data.totalPercentUsed)}`}>
              {Math.round(data.totalPercentUsed)}%
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
