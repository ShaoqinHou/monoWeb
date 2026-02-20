import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '../../../components/ui/Table';
import { useStockMovements } from '../hooks/useStockAdjustment';

interface StockMovementLogProps {
  productId: string;
}

function formatType(type: string): string {
  switch (type) {
    case 'invoice': return 'Sale (Invoice)';
    case 'bill': return 'Purchase (Bill)';
    case 'adjustment': return 'Manual Adjustment';
    default: return type;
  }
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-NZ', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function StockMovementLog({ productId }: StockMovementLogProps) {
  const { data: movements = [], isLoading } = useStockMovements(productId);

  if (isLoading) {
    return (
      <div className="py-4 text-center text-gray-500" data-testid="movements-loading">
        Loading stock movements...
      </div>
    );
  }

  if (movements.length === 0) {
    return (
      <div className="py-4 text-center text-gray-500" data-testid="movements-empty">
        No stock movements recorded
      </div>
    );
  }

  const sorted = [...movements].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

  return (
    <div data-testid="stock-movement-log">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Type</TableHead>
            <TableHead className="text-right">Quantity</TableHead>
            <TableHead>Reason</TableHead>
            <TableHead>Notes</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sorted.map((m) => (
            <TableRow key={m.id} data-testid={`movement-row-${m.id}`}>
              <TableCell>{formatDate(m.createdAt)}</TableCell>
              <TableCell>{formatType(m.type)}</TableCell>
              <TableCell
                className={`text-right font-medium ${
                  m.quantity > 0 ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {m.quantity > 0 ? '+' : ''}{m.quantity}
              </TableCell>
              <TableCell className="text-gray-500">{m.reason ?? '-'}</TableCell>
              <TableCell className="text-gray-500">{m.notes ?? '-'}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
