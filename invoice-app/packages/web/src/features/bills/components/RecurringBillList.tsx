import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '../../../components/ui/Table';
import { Badge, type BadgeVariant } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import type { RecurringBill } from '../hooks/useRecurringBills';

interface RecurringBillListProps {
  items: RecurringBill[];
  onItemClick: (id: string) => void;
  isLoading?: boolean;
  onNewRecurringBill?: () => void;
}

const STATUS_VARIANT: Record<string, BadgeVariant> = {
  active: 'success',
  paused: 'warning',
  completed: 'default',
};

const STATUS_LABEL: Record<string, string> = {
  active: 'Active',
  paused: 'Paused',
  completed: 'Completed',
};

export function RecurringBillList({ items, onItemClick, isLoading, onNewRecurringBill }: RecurringBillListProps) {
  if (isLoading) {
    return (
      <div className="py-12 text-center text-gray-500" data-testid="recurring-bill-list-loading">
        Loading recurring bills...
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="py-12 text-center" data-testid="recurring-bill-list-empty">
        <h3 className="text-lg font-medium text-gray-900">No repeating bills</h3>
        <p className="mt-1 text-sm text-gray-500">Set up bills that repeat on a schedule</p>
        <Button className="mt-4" onClick={onNewRecurringBill} data-testid="empty-new-recurring-bill-btn">
          New Repeating Bill
        </Button>
      </div>
    );
  }

  return (
    <Table data-testid="recurring-bill-list-table">
      <TableHeader>
        <TableRow>
          <TableHead>Template Name</TableHead>
          <TableHead>Supplier</TableHead>
          <TableHead>Frequency</TableHead>
          <TableHead>Next Date</TableHead>
          <TableHead className="text-right">Total</TableHead>
          <TableHead className="text-right">Generated</TableHead>
          <TableHead>Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.map((item) => (
          <TableRow
            key={item.id}
            className="cursor-pointer"
            onClick={() => onItemClick(item.id)}
            data-testid={`recurring-bill-row-${item.id}`}
          >
            <TableCell className="font-medium">{item.templateName}</TableCell>
            <TableCell>{item.contactName}</TableCell>
            <TableCell className="capitalize">{item.frequency}</TableCell>
            <TableCell>{item.nextDate}</TableCell>
            <TableCell className="text-right">
              NZD {item.total.toFixed(2)}
            </TableCell>
            <TableCell className="text-right">{item.timesGenerated}</TableCell>
            <TableCell>
              <Badge
                variant={STATUS_VARIANT[item.status] ?? 'default'}
                data-testid="recurring-bill-status-badge"
              >
                {STATUS_LABEL[item.status] ?? item.status}
              </Badge>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
