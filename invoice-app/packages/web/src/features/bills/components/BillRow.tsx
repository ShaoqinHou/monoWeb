import { TableRow, TableCell } from '../../../components/ui/Table';
import { BillStatusBadge } from './BillStatusBadge';
import { formatCurrency } from '@shared/calc/currency';
import { RefreshCw, ExternalLink } from 'lucide-react';
import type { Bill } from '../types';
import type { RecurrenceFrequency } from '../types';

interface BillRowProps {
  bill: Bill;
  recurrence?: RecurrenceFrequency;
  selected?: boolean;
  onSelect?: (billId: string, checked: boolean) => void;
  onClick?: (bill: Bill) => void;
}

export function BillRow({ bill, recurrence, selected, onSelect, onClick }: BillRowProps) {
  const handleClick = () => {
    onClick?.(bill);
  };

  return (
    <TableRow
      data-testid={`bill-row-${bill.id}`}
      onClick={handleClick}
      className={`cursor-pointer ${selected ? 'bg-blue-50' : ''}`}
    >
      {onSelect && (
        <TableCell className="w-10">
          <input
            type="checkbox"
            checked={selected ?? false}
            onChange={(e) => {
              e.stopPropagation();
              onSelect(bill.id, e.target.checked);
            }}
            onClick={(e) => e.stopPropagation()}
            data-testid={`bill-checkbox-${bill.id}`}
            aria-label={`Select ${bill.billNumber}`}
          />
        </TableCell>
      )}
      <TableCell>
        <button
          className="text-blue-600 hover:underline inline-flex items-center gap-1"
          onClick={(e) => { e.stopPropagation(); onClick?.(bill); }}
          data-testid={`bill-view-${bill.id}`}
          aria-label={`View ${bill.billNumber}`}
        >
          <ExternalLink className="h-3.5 w-3.5" />
          View
        </button>
      </TableCell>
      <TableCell>
        <span className="flex items-center gap-1.5">
          {bill.contactName}
          {recurrence && recurrence !== 'none' && (
            <RefreshCw
              className="h-3.5 w-3.5 text-teal-500"
              data-testid={`recurring-icon-${bill.id}`}
              aria-label="Recurring bill"
            />
          )}
        </span>
      </TableCell>
      <TableCell>
        <BillStatusBadge status={bill.status} />
      </TableCell>
      <TableCell>{bill.reference || ''}</TableCell>
      <TableCell>{bill.date}</TableCell>
      <TableCell>{bill.dueDate}</TableCell>
      <TableCell className="text-right">{formatCurrency(bill.amountPaid, bill.currency)}</TableCell>
      <TableCell className="text-right">{formatCurrency(bill.amountDue, bill.currency)}</TableCell>
    </TableRow>
  );
}
