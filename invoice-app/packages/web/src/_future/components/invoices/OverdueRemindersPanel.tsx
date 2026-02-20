import { useState } from 'react';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '../../../components/ui/Table';
import {
  useOverdueInvoices,
  useSendReminder,
  useSendBulkReminders,
  type OverdueFilter,
} from '../hooks/useOverdueReminders';

const FILTER_OPTIONS: { value: OverdueFilter; label: string }[] = [
  { value: 'all', label: 'All Overdue' },
  { value: '1-30', label: '1-30 Days' },
  { value: '31-60', label: '31-60 Days' },
  { value: '60+', label: '60+ Days' },
];

function formatCurrency(amount: number, currency: string): string {
  return `${currency} ${amount.toLocaleString('en-NZ', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function OverdueRemindersPanel() {
  const [filter, setFilter] = useState<OverdueFilter>('all');
  const { data: invoices = [], isLoading } = useOverdueInvoices(filter);
  const sendReminder = useSendReminder();
  const sendBulkReminders = useSendBulkReminders();
  const [sentIds, setSentIds] = useState<Set<string>>(new Set());

  const handleSendReminder = (invoiceId: string) => {
    sendReminder.mutate(invoiceId, {
      onSuccess: () => {
        setSentIds((prev) => new Set(prev).add(invoiceId));
      },
    });
  };

  const handleSendAll = () => {
    const ids = invoices.map((inv) => inv.id);
    sendBulkReminders.mutate(ids, {
      onSuccess: () => {
        setSentIds(new Set(ids));
      },
    });
  };

  const getDaysOverdueBadgeVariant = (days: number) => {
    if (days > 60) return 'error';
    if (days > 30) return 'warning';
    return 'info';
  };

  return (
    <div data-testid="overdue-reminders-panel">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-[#1a1a2e]">Overdue Invoice Reminders</h2>
        <Button
          variant="primary"
          size="sm"
          onClick={handleSendAll}
          disabled={invoices.length === 0 || sendBulkReminders.isPending}
          loading={sendBulkReminders.isPending}
          data-testid="send-all-reminders"
        >
          Send All Reminders
        </Button>
      </div>

      <div className="flex gap-2 mb-4">
        {FILTER_OPTIONS.map((opt) => (
          <Button
            key={opt.value}
            variant={filter === opt.value ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setFilter(opt.value)}
            data-testid={`filter-${opt.value}`}
          >
            {opt.label}
          </Button>
        ))}
      </div>

      {isLoading ? (
        <p data-testid="loading">Loading...</p>
      ) : invoices.length === 0 ? (
        <p className="text-[#6b7280] text-sm py-8 text-center" data-testid="no-overdue">
          No overdue invoices found.
        </p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Invoice #</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Due Date</TableHead>
              <TableHead>Days Overdue</TableHead>
              <TableHead>Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {invoices.map((inv) => (
              <TableRow key={inv.id} data-testid={`overdue-row-${inv.id}`}>
                <TableCell className="font-medium">{inv.invoiceNumber}</TableCell>
                <TableCell>{inv.contactName}</TableCell>
                <TableCell>{formatCurrency(inv.amountDue, inv.currency)}</TableCell>
                <TableCell>{inv.dueDate}</TableCell>
                <TableCell>
                  <Badge variant={getDaysOverdueBadgeVariant(inv.daysOverdue)}>
                    {inv.daysOverdue} days
                  </Badge>
                </TableCell>
                <TableCell>
                  {sentIds.has(inv.id) ? (
                    <span className="text-sm text-[#14b8a6]" data-testid={`sent-${inv.id}`}>
                      Sent
                    </span>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleSendReminder(inv.id)}
                      disabled={sendReminder.isPending}
                      data-testid={`send-reminder-${inv.id}`}
                    >
                      Send Reminder
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
