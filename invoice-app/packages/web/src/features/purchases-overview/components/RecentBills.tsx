import { Link } from '@tanstack/react-router';
import { Card, CardHeader, CardContent } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../../components/ui/Table';
import { formatCurrency } from '@shared/calc/currency';
import type { RecentBill, BillStatus } from '../hooks/usePurchases';

interface RecentBillsProps {
  data: RecentBill[] | undefined;
  isLoading: boolean;
}

const statusVariant: Record<BillStatus, 'success' | 'info' | 'error' | 'default'> = {
  paid: 'success',
  awaiting_payment: 'info',
  overdue: 'error',
  draft: 'default',
};

const statusLabel: Record<BillStatus, string> = {
  paid: 'Paid',
  awaiting_payment: 'Awaiting Payment',
  overdue: 'Overdue',
  draft: 'Draft',
};

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-NZ', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function RecentBills({ data, isLoading }: RecentBillsProps) {
  return (
    <Card data-testid="recent-bills">
      <CardHeader>
        <h2 className="text-lg font-semibold text-gray-900">Recent Bills</h2>
      </CardHeader>
      <CardContent className="p-0">
        {isLoading ? (
          <div className="p-6" data-testid="recent-bills-loading">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex justify-between py-3">
                <div className="h-4 w-48 bg-gray-200 rounded animate-pulse" />
                <div className="h-4 w-20 bg-gray-200 rounded animate-pulse" />
              </div>
            ))}
          </div>
        ) : data && data.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Reference</TableHead>
                <TableHead>Supplier</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((bill) => (
                <TableRow key={bill.id} className="cursor-pointer" data-testid={`recent-bill-row-${bill.id}`}>
                  <TableCell className="font-medium">
                    <Link to="/purchases/bills/$billId" params={{ billId: bill.id }} className="hover:underline text-blue-600">
                      {bill.reference || bill.id}
                    </Link>
                  </TableCell>
                  <TableCell>{bill.supplier}</TableCell>
                  <TableCell>{formatDate(bill.date)}</TableCell>
                  <TableCell>
                    <Badge variant={statusVariant[bill.status]}>
                      {statusLabel[bill.status]}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">{formatCurrency(bill.amount)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="p-6 text-center text-gray-500">No recent bills</div>
        )}
      </CardContent>
    </Card>
  );
}
