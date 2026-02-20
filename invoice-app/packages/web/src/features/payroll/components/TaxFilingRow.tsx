import { TableRow, TableCell } from '../../../components/ui/Table';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { formatCurrency } from '@shared/calc/currency';

export interface TaxFiling {
  id: string;
  period: string;
  dueDate: string;
  status: 'draft' | 'filed' | 'overdue';
  amount: number;
  irdStatus: 'pending' | 'submitted' | 'accepted' | 'rejected';
}

interface TaxFilingRowProps {
  filing: TaxFiling;
  onFile: (id: string) => void;
  selected?: boolean;
  onToggleSelect?: (id: string) => void;
}

const STATUS_VARIANTS: Record<string, 'default' | 'success' | 'warning' | 'error'> = {
  draft: 'default',
  filed: 'success',
  overdue: 'error',
};

const IRD_STATUS_VARIANTS: Record<string, 'default' | 'success' | 'warning' | 'error' | 'info'> = {
  pending: 'default',
  submitted: 'info',
  accepted: 'success',
  rejected: 'error',
};

export function TaxFilingRow({ filing, onFile, selected, onToggleSelect }: TaxFilingRowProps) {
  return (
    <TableRow data-testid={`tax-filing-${filing.id}`}>
      {onToggleSelect && (
        <TableCell className="w-10">
          <input
            type="checkbox"
            checked={selected ?? false}
            onChange={() => onToggleSelect(filing.id)}
            aria-label={`Select ${filing.period}`}
            data-testid={`select-filing-${filing.id}`}
            className="rounded border-gray-300"
          />
        </TableCell>
      )}
      <TableCell className="font-medium">{filing.period}</TableCell>
      <TableCell>{filing.dueDate}</TableCell>
      <TableCell>
        <Badge variant={STATUS_VARIANTS[filing.status] ?? 'default'}>
          {filing.status.charAt(0).toUpperCase() + filing.status.slice(1)}
        </Badge>
      </TableCell>
      <TableCell className="text-right">{formatCurrency(filing.amount)}</TableCell>
      <TableCell>
        <Badge variant={IRD_STATUS_VARIANTS[filing.irdStatus] ?? 'default'}>
          {filing.irdStatus.charAt(0).toUpperCase() + filing.irdStatus.slice(1)}
        </Badge>
      </TableCell>
      <TableCell>
        {filing.status !== 'filed' && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => onFile(filing.id)}
            data-testid={`file-btn-${filing.id}`}
          >
            File
          </Button>
        )}
      </TableCell>
    </TableRow>
  );
}
