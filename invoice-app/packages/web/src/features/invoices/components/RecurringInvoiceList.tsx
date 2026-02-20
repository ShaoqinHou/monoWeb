import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '../../../components/ui/Table';
import { Badge, type BadgeVariant } from '../../../components/ui/Badge';
import type { RecurringInvoice } from '../hooks/useRecurringInvoices';

interface RecurringInvoiceListProps {
  items: RecurringInvoice[];
  onItemClick: (id: string) => void;
  isLoading?: boolean;
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

export function RecurringInvoiceList({ items, onItemClick, isLoading }: RecurringInvoiceListProps) {
  if (isLoading) {
    return (
      <div className="py-12 text-center text-gray-500" data-testid="recurring-invoice-list-loading">
        Loading recurring invoices...
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="py-12 text-center text-gray-500" data-testid="recurring-invoice-list-empty">
        No recurring invoices found
      </div>
    );
  }

  return (
    <Table data-testid="recurring-invoice-list-table">
      <TableHeader>
        <TableRow>
          <TableHead>Template Name</TableHead>
          <TableHead>Contact</TableHead>
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
            data-testid={`recurring-invoice-row-${item.id}`}
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
                data-testid="recurring-invoice-status-badge"
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
