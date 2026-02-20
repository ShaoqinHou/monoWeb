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
import { formatCurrency } from '@shared/calc/currency';
import type { GSTReturnApi } from '../hooks/useGSTReturns';

interface GSTReturnListProps {
  returns: GSTReturnApi[];
  onSelectReturn: (id: string) => void;
  onNewReturn?: () => void;
}

const STATUS_VARIANT: Record<GSTReturnApi['status'], BadgeVariant> = {
  draft: 'warning',
  filed: 'success',
  overdue: 'error',
};

const STATUS_LABEL: Record<GSTReturnApi['status'], string> = {
  draft: 'Draft',
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

export function GSTReturnList({ returns, onSelectReturn, onNewReturn }: GSTReturnListProps) {
  if (returns.length === 0) {
    return (
      <div className="py-12 text-center">
        <h3 className="text-lg font-medium text-gray-900">No GST returns</h3>
        <p className="mt-1 text-sm text-gray-500">Create a GST return to get started</p>
        <Button className="mt-4" onClick={onNewReturn} data-testid="empty-new-gst-return-btn">
          New GST Return
        </Button>
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Period</TableHead>
          <TableHead>Due Date</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">GST Collected</TableHead>
          <TableHead className="text-right">GST Paid</TableHead>
          <TableHead className="text-right">Net GST</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {returns.map((gstReturn) => (
          <TableRow
            key={gstReturn.id}
            className="cursor-pointer"
            onClick={() => onSelectReturn(gstReturn.id)}
            data-testid={`gst-return-row-${gstReturn.id}`}
          >
            <TableCell className="font-medium text-[#0078c8]">
              {gstReturn.period}
            </TableCell>
            <TableCell>{formatDate(gstReturn.dueDate)}</TableCell>
            <TableCell>
              <Badge variant={STATUS_VARIANT[gstReturn.status]}>
                {STATUS_LABEL[gstReturn.status]}
              </Badge>
            </TableCell>
            <TableCell className="text-right">
              {formatCurrency(gstReturn.gstCollected)}
            </TableCell>
            <TableCell className="text-right">
              {formatCurrency(gstReturn.gstPaid)}
            </TableCell>
            <TableCell className="text-right font-medium">
              {formatCurrency(gstReturn.netGst)}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
