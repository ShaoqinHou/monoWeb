import { Card, CardHeader, CardContent } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../../components/ui/Table';
import { formatCurrency } from '@shared/calc/currency';
import type { RecentInvoice, InvoiceStatus } from '../hooks/useSales';

interface RecentInvoicesProps {
  data: RecentInvoice[] | undefined;
  isLoading: boolean;
}

const statusVariant: Record<InvoiceStatus, 'success' | 'info' | 'error' | 'default'> = {
  paid: 'success',
  sent: 'info',
  overdue: 'error',
  draft: 'default',
};

const statusLabel: Record<InvoiceStatus, string> = {
  paid: 'Paid',
  sent: 'Sent',
  overdue: 'Overdue',
  draft: 'Draft',
};

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-NZ', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function RecentInvoices({ data, isLoading }: RecentInvoicesProps) {
  return (
    <Card data-testid="recent-invoices">
      <CardHeader>
        <h2 className="text-lg font-semibold text-gray-900">Recent Invoices</h2>
      </CardHeader>
      <CardContent className="p-0">
        {isLoading ? (
          <div className="p-6" data-testid="recent-invoices-loading">
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
                <TableHead>Customer</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((invoice) => (
                <TableRow key={invoice.id}>
                  <TableCell className="font-medium">{invoice.reference}</TableCell>
                  <TableCell>{invoice.customer}</TableCell>
                  <TableCell>{formatDate(invoice.date)}</TableCell>
                  <TableCell>
                    <Badge variant={statusVariant[invoice.status]}>
                      {statusLabel[invoice.status]}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">{formatCurrency(invoice.amount)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="p-6 text-center text-gray-500">No recent invoices</div>
        )}
      </CardContent>
    </Card>
  );
}
