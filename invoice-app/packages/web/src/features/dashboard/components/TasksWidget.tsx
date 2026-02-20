import { Link } from '@tanstack/react-router';
import { Card, CardContent } from '../../../components/ui/Card';
import { useDashboardTasks } from '../hooks/useDashboardTasks';
import {
  AlertCircle,
  FileText,
  CreditCard,
  Receipt,
  CalendarClock,
} from 'lucide-react';

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-NZ', {
    style: 'currency',
    currency: 'NZD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

interface TaskItemProps {
  icon: React.ReactNode;
  label: string;
  count: number;
  amount?: number;
  href: string;
  search?: Record<string, string>;
}

function TaskItem({ icon, label, count, amount, href, search }: TaskItemProps) {
  if (count === 0) return null;
  return (
    <Link
      to={href}
      search={search}
      className="flex items-center gap-3 py-2.5 px-3 rounded-lg hover:bg-gray-50 transition-colors"
      data-testid={`task-item-${label.toLowerCase().replace(/\s+/g, '-')}`}
    >
      <div className="text-[#0078c8]">{icon}</div>
      <div className="flex-1 text-sm text-[#1a1a2e]">
        <span className="font-medium">{count}</span> {label}
        {amount !== undefined && (
          <span className="text-[#6b7280] ml-1">({formatCurrency(amount)})</span>
        )}
      </div>
    </Link>
  );
}

export function TasksWidget() {
  const { data, isLoading } = useDashboardTasks();

  return (
    <Card data-testid="tasks-widget">
      <CardContent>
        <h2 className="text-base font-semibold text-[#1a1a2e] mb-2">Tasks</h2>
        {isLoading && <p className="text-sm text-[#6b7280]">Loading tasks...</p>}
        {data && (
          <div className="divide-y divide-gray-100">
            <TaskItem
              icon={<AlertCircle className="h-4 w-4" />}
              label="overdue invoices"
              count={data.overdueInvoices.count}
              amount={data.overdueInvoices.total}
              href="/sales/invoices"
              search={{ status: 'overdue' }}
            />
            <TaskItem
              icon={<FileText className="h-4 w-4" />}
              label="bills due this week"
              count={data.billsDueThisWeek.count}
              amount={data.billsDueThisWeek.total}
              href="/purchases/bills"
              search={{ status: 'due-soon' }}
            />
            <TaskItem
              icon={<CreditCard className="h-4 w-4" />}
              label="unreconciled transactions"
              count={data.unreconciledTransactions.count}
              href="/bank"
            />
            <TaskItem
              icon={<Receipt className="h-4 w-4" />}
              label="unapproved expenses"
              count={data.unapprovedExpenses.count}
              href="/expenses"
            />
            <TaskItem
              icon={<CalendarClock className="h-4 w-4" />}
              label="pending leave requests"
              count={data.pendingLeaveRequests.count}
              href="/payroll"
            />
            {data.overdueInvoices.count === 0 &&
              data.billsDueThisWeek.count === 0 &&
              data.unreconciledTransactions.count === 0 &&
              data.unapprovedExpenses.count === 0 &&
              data.pendingLeaveRequests.count === 0 && (
                <p className="text-sm text-[#6b7280] py-2">All caught up! No pending tasks.</p>
              )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
