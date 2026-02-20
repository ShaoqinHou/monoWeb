import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '../../../components/ui/Table';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { formatCurrency } from '../../../../../shared/calc/currency';
import type { ProjectExpense } from '../hooks/useProjectExpenses';

interface ProjectExpenseListProps {
  expenses: ProjectExpense[];
  onEdit?: (expense: ProjectExpense) => void;
  onDelete?: (expenseId: string) => void;
  onAddExpense?: () => void;
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-NZ', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function ProjectExpenseList({
  expenses,
  onEdit,
  onDelete,
  onAddExpense,
}: ProjectExpenseListProps) {
  if (expenses.length === 0) {
    return (
      <div className="text-center py-12" data-testid="empty-expenses">
        <h3 className="text-base font-semibold text-[#1a1a2e] mb-1">No expenses yet</h3>
        <p className="text-[#6b7280] text-sm mb-4">Track project expenses to include them in invoices.</p>
        {onAddExpense && (
          <Button size="sm" onClick={onAddExpense} data-testid="add-expense-cta">
            Add Expense
          </Button>
        )}
      </div>
    );
  }

  const totalAmount = expenses.reduce((sum, e) => sum + e.amount, 0);
  const billableAmount = expenses
    .filter((e) => e.isBillable)
    .reduce((sum, e) => sum + e.amount, 0);

  return (
    <div>
      {/* Summary bar */}
      <div
        className="flex gap-6 mb-4 p-3 bg-gray-50 rounded-lg text-sm"
        data-testid="expense-summary"
      >
        <div>
          <span className="text-[#6b7280]">Total: </span>
          <span className="font-medium text-[#1a1a2e]" data-testid="summary-total">
            {formatCurrency(totalAmount)}
          </span>
        </div>
        <div>
          <span className="text-[#6b7280]">Billable: </span>
          <span className="font-medium text-[#1a1a2e]" data-testid="summary-billable">
            {formatCurrency(billableAmount)}
          </span>
        </div>
        <div>
          <span className="text-[#6b7280]">Count: </span>
          <span className="font-medium text-[#1a1a2e]" data-testid="summary-count">
            {expenses.length}
          </span>
        </div>
      </div>

      <Table data-testid="expense-table">
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Category</TableHead>
            <TableHead className="text-right">Amount</TableHead>
            <TableHead>Status</TableHead>
            {(onEdit || onDelete) && <TableHead>Actions</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {expenses.map((expense) => (
            <TableRow key={expense.id} data-testid={`expense-row-${expense.id}`}>
              <TableCell>{formatDate(expense.date)}</TableCell>
              <TableCell className="font-medium">{expense.description}</TableCell>
              <TableCell>{expense.category ?? '-'}</TableCell>
              <TableCell className="text-right">
                {formatCurrency(expense.amount)}
              </TableCell>
              <TableCell>
                <div className="flex gap-1">
                  <Badge variant={expense.isBillable ? 'success' : 'default'}>
                    {expense.isBillable ? 'Billable' : 'Non-billable'}
                  </Badge>
                  {expense.isInvoiced && (
                    <Badge variant="info">Invoiced</Badge>
                  )}
                </div>
              </TableCell>
              {(onEdit || onDelete) && (
                <TableCell>
                  <div className="flex gap-1">
                    {onEdit && (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => onEdit(expense)}
                        aria-label={`Edit ${expense.description}`}
                      >
                        Edit
                      </Button>
                    )}
                    {onDelete && (
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => onDelete(expense.id)}
                        aria-label={`Delete ${expense.description}`}
                      >
                        Delete
                      </Button>
                    )}
                  </div>
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
