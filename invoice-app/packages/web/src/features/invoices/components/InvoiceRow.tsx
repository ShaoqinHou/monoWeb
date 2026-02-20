import { TableRow, TableCell } from '../../../components/ui/Table';
import { InvoiceStatusBadge } from './InvoiceStatusBadge';
import { Badge } from '../../../components/ui/Badge';
import { formatCurrency } from '@xero-replica/shared';
import { Link } from '@tanstack/react-router';
import { Repeat, CreditCard } from 'lucide-react';
import type { Invoice } from '../types';
import type { RecurringSchedule } from '../types';

interface InvoiceRowProps {
  invoice: Invoice;
  onClick: (id: string) => void;
  recurring?: RecurringSchedule;
  isCreditNote?: boolean;
  selected?: boolean;
  onSelect?: (id: string, checked: boolean) => void;
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-NZ', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function InvoiceRow({
  invoice,
  onClick,
  recurring,
  isCreditNote = false,
  selected = false,
  onSelect,
}: InvoiceRowProps) {
  return (
    <TableRow
      className={`cursor-pointer ${selected ? 'bg-blue-50' : ''}`}
      onClick={() => onClick(invoice.id)}
      data-testid={`invoice-row-${invoice.id}`}
    >
      {onSelect && (
        <TableCell className="w-10">
          <input
            type="checkbox"
            checked={selected}
            onChange={(e) => {
              e.stopPropagation();
              onSelect(invoice.id, e.target.checked);
            }}
            onClick={(e) => e.stopPropagation()}
            className="h-4 w-4 rounded border-gray-300"
            data-testid={`invoice-checkbox-${invoice.id}`}
          />
        </TableCell>
      )}
      <TableCell className="font-medium">
        <span className="flex items-center gap-1.5">
          {invoice.invoiceNumber}
          {recurring && recurring !== 'none' && (
            <Repeat className="h-3.5 w-3.5 text-blue-500" data-testid={`recurring-icon-${invoice.id}`} />
          )}
          {isCreditNote && (
            <Badge variant="info" data-testid={`credit-note-badge-${invoice.id}`}>
              <CreditCard className="h-3 w-3 mr-0.5" />
              CN
            </Badge>
          )}
        </span>
      </TableCell>
      <TableCell className="text-gray-500 text-sm" data-testid={`invoice-ref-${invoice.id}`}>
        {invoice.reference ?? ''}
      </TableCell>
      <TableCell>
        <Link
          to="/contacts/$contactId"
          params={{ contactId: invoice.contactId }}
          className="text-[#0078c8] hover:underline"
          onClick={(e) => e.stopPropagation()}
        >
          {invoice.contactName}
        </Link>
      </TableCell>
      <TableCell>{formatDate(invoice.date)}</TableCell>
      <TableCell>{formatDate(invoice.dueDate)}</TableCell>
      <TableCell className="text-right font-medium" data-testid={`invoice-paid-${invoice.id}`}>
        {formatCurrency(invoice.amountPaid, invoice.currency)}
      </TableCell>
      <TableCell className="text-right font-medium" data-testid={`invoice-due-${invoice.id}`}>
        {formatCurrency(invoice.amountDue, invoice.currency)}
      </TableCell>
      <TableCell>
        <InvoiceStatusBadge status={invoice.status} />
      </TableCell>
      <TableCell data-testid={`invoice-sent-${invoice.id}`}>
        {'sentToContact' in invoice && invoice.sentToContact ? 'Yes' : ''}
      </TableCell>
    </TableRow>
  );
}
