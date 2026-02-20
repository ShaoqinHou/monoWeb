import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '../../../components/ui/Table';
import { formatCurrency } from '@shared/calc/currency';
import { Button } from '../../../components/ui/Button';

export interface SupplierCreditNote {
  id: string;
  creditNoteNumber: string;
  contactName: string;
  date: string;
  total: number;
  remainingCredit: number;
  status: string;
}

interface SupplierCreditNoteListProps {
  creditNotes: SupplierCreditNote[];
  onSelect?: (id: string) => void;
  onNewCreditNote?: () => void;
}

const STATUS_LABELS: Record<string, string> = {
  draft: 'Draft',
  submitted: 'Submitted',
  approved: 'Approved',
  applied: 'Applied',
  voided: 'Voided',
};

export function SupplierCreditNoteList({ creditNotes, onSelect, onNewCreditNote }: SupplierCreditNoteListProps) {
  if (creditNotes.length === 0) {
    return (
      <div className="py-12 text-center" data-testid="scn-list-empty">
        <h3 className="text-lg font-medium text-gray-900">No credit notes</h3>
        <p className="mt-1 text-sm text-gray-500">Track credits from your suppliers</p>
        <Button className="mt-4" onClick={onNewCreditNote} data-testid="empty-new-credit-note-btn">
          New Credit Note
        </Button>
      </div>
    );
  }

  return (
    <div data-testid="scn-list">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Number</TableHead>
            <TableHead>Supplier</TableHead>
            <TableHead>Date</TableHead>
            <TableHead className="text-right">Total</TableHead>
            <TableHead className="text-right">Remaining</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {creditNotes.map((cn) => (
            <TableRow
              key={cn.id}
              className="cursor-pointer hover:bg-gray-50"
              onClick={() => onSelect?.(cn.id)}
              data-testid={`scn-row-${cn.id}`}
            >
              <TableCell className="font-medium">{cn.creditNoteNumber}</TableCell>
              <TableCell>{cn.contactName}</TableCell>
              <TableCell>{cn.date}</TableCell>
              <TableCell className="text-right">{formatCurrency(cn.total, 'NZD')}</TableCell>
              <TableCell className="text-right">{formatCurrency(cn.remainingCredit, 'NZD')}</TableCell>
              <TableCell>
                <span className="inline-block px-2 py-0.5 rounded text-xs font-medium bg-gray-100">
                  {STATUS_LABELS[cn.status] ?? cn.status}
                </span>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
