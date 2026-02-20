import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '../../../components/ui/Table';
import { Badge, type BadgeVariant } from '../../../components/ui/Badge';
import type { CreditNote, CreditNoteStatus } from '../hooks/useCreditNotes';

interface CreditNoteListProps {
  creditNotes: CreditNote[];
  onCreditNoteClick: (id: string) => void;
  isLoading?: boolean;
}

const STATUS_CONFIG: Record<CreditNoteStatus, { label: string; variant: BadgeVariant }> = {
  draft: { label: 'Draft', variant: 'default' },
  submitted: { label: 'Submitted', variant: 'info' },
  approved: { label: 'Approved', variant: 'warning' },
  applied: { label: 'Applied', variant: 'success' },
  voided: { label: 'Voided', variant: 'error' },
};

export function CreditNoteList({ creditNotes, onCreditNoteClick, isLoading }: CreditNoteListProps) {
  if (isLoading) {
    return (
      <div className="py-12 text-center text-gray-500" data-testid="credit-note-list-loading">
        Loading credit notes...
      </div>
    );
  }

  if (creditNotes.length === 0) {
    return (
      <div className="py-12 text-center text-gray-500" data-testid="credit-note-list-empty">
        No credit notes found
      </div>
    );
  }

  return (
    <Table data-testid="credit-note-list-table">
      <TableHeader>
        <TableRow>
          <TableHead>Number</TableHead>
          <TableHead>Type</TableHead>
          <TableHead>Contact</TableHead>
          <TableHead>Date</TableHead>
          <TableHead className="text-right">Total</TableHead>
          <TableHead className="text-right">Remaining</TableHead>
          <TableHead>Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {creditNotes.map((cn) => {
          const config = STATUS_CONFIG[cn.status] ?? STATUS_CONFIG.draft;
          return (
            <TableRow
              key={cn.id}
              className="cursor-pointer"
              onClick={() => onCreditNoteClick(cn.id)}
              data-testid={`credit-note-row-${cn.id}`}
            >
              <TableCell className="font-medium">{cn.creditNoteNumber}</TableCell>
              <TableCell className="capitalize">{cn.type}</TableCell>
              <TableCell>{cn.contactName}</TableCell>
              <TableCell>{cn.date}</TableCell>
              <TableCell className="text-right">{cn.total.toFixed(2)}</TableCell>
              <TableCell className="text-right">{cn.remainingCredit.toFixed(2)}</TableCell>
              <TableCell>
                <Badge variant={config.variant} data-testid="credit-note-status-badge">
                  {config.label}
                </Badge>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
