import { formatCurrency } from '../../../../../shared/calc/currency';
import { Badge } from '../../../components/ui/Badge';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '../../../components/ui/Table';
import type { JournalEntry, JournalStatus } from '../types';
import type { BadgeVariant } from '../../../components/ui/Badge';

interface JournalEntryListProps {
  journals: JournalEntry[];
}

const STATUS_VARIANT: Record<JournalStatus, BadgeVariant> = {
  draft: 'warning',
  posted: 'success',
  voided: 'error',
};

const STATUS_LABEL: Record<JournalStatus, string> = {
  draft: 'Draft',
  posted: 'Posted',
  voided: 'Voided',
};

export function JournalEntryList({ journals }: JournalEntryListProps) {
  if (journals.length === 0) {
    return (
      <div className="py-12 text-center text-gray-500">
        No journal entries found.
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Date</TableHead>
          <TableHead>Narration</TableHead>
          <TableHead className="text-right">Total</TableHead>
          <TableHead>Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {journals.map((journal) => {
          const total = journal.lines.reduce((sum, l) => sum + l.debit, 0);
          return (
            <TableRow key={journal.id}>
              <TableCell className="whitespace-nowrap">{journal.date}</TableCell>
              <TableCell>{journal.narration}</TableCell>
              <TableCell className="text-right font-mono">
                {formatCurrency(total)}
              </TableCell>
              <TableCell>
                <Badge variant={STATUS_VARIANT[journal.status]}>
                  {STATUS_LABEL[journal.status]}
                </Badge>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
