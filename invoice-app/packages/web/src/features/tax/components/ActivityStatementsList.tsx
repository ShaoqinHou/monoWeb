import { Badge, type BadgeVariant } from '../../../components/ui/Badge';
import { formatCurrency } from '@shared/calc/currency';
import type { ActivityStatement } from '../hooks/useActivityStatements';

interface ActivityStatementsListProps {
  statements: ActivityStatement[];
}

const STATUS_VARIANT: Record<ActivityStatement['status'], BadgeVariant> = {
  due: 'warning',
  filed: 'success',
  overdue: 'error',
};

const STATUS_LABEL: Record<ActivityStatement['status'], string> = {
  due: 'Due',
  filed: 'Filed',
  overdue: 'Overdue',
};

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-NZ', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function ActivityStatementsList({ statements }: ActivityStatementsListProps) {
  if (statements.length === 0) {
    return <p className="text-sm text-gray-500 py-4">No activity statements found.</p>;
  }

  return (
    <div className="overflow-auto rounded-lg border border-[#e5e7eb]" data-testid="activity-statements-list">
      <table className="w-full text-sm">
        <thead className="bg-[#f8f9fa]">
          <tr>
            <th className="px-4 py-3 text-left font-semibold text-[#6b7280] border-b border-[#e5e7eb]">Period</th>
            <th className="px-4 py-3 text-left font-semibold text-[#6b7280] border-b border-[#e5e7eb]">Due Date</th>
            <th className="px-4 py-3 text-right font-semibold text-[#6b7280] border-b border-[#e5e7eb]">GST</th>
            <th className="px-4 py-3 text-right font-semibold text-[#6b7280] border-b border-[#e5e7eb]">PAYE</th>
            <th className="px-4 py-3 text-right font-semibold text-[#6b7280] border-b border-[#e5e7eb]">Total</th>
            <th className="px-4 py-3 text-center font-semibold text-[#6b7280] border-b border-[#e5e7eb]">Status</th>
          </tr>
        </thead>
        <tbody>
          {statements.map((stmt) => (
            <tr
              key={stmt.id}
              className="border-b border-[#e5e7eb] hover:bg-gray-50"
              data-testid={`statement-row-${stmt.id}`}
            >
              <td className="px-4 py-3 font-medium text-[#1a1a2e]">{stmt.period}</td>
              <td className="px-4 py-3 text-[#6b7280]">{formatDate(stmt.dueDate)}</td>
              <td className="px-4 py-3 text-right tabular-nums text-[#1a1a2e]">{formatCurrency(stmt.gstAmount)}</td>
              <td className="px-4 py-3 text-right tabular-nums text-[#1a1a2e]">{formatCurrency(stmt.payeAmount)}</td>
              <td className="px-4 py-3 text-right tabular-nums font-semibold text-[#1a1a2e]">{formatCurrency(stmt.totalAmount)}</td>
              <td className="px-4 py-3 text-center">
                <Badge variant={STATUS_VARIANT[stmt.status]}>
                  {STATUS_LABEL[stmt.status]}
                </Badge>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
