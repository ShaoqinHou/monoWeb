import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '../../../components/ui/Table';
import { Card, CardHeader, CardContent } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { formatCurrency } from '@shared/calc/currency';
import type { BillPayment } from '../types';

interface PaymentHistoryProps {
  payments: BillPayment[];
  currency: string;
  amountDue: number;
  total: number;
  canRecordPayment: boolean;
  onRecordPayment?: () => void;
}

export function PaymentHistory({
  payments,
  currency,
  amountDue,
  total,
  canRecordPayment,
  onRecordPayment,
}: PaymentHistoryProps) {
  const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);

  return (
    <Card data-testid="payment-history-section">
      <CardHeader>
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Payments</h2>
          {canRecordPayment && amountDue > 0 && onRecordPayment && (
            <Button
              variant="primary"
              size="sm"
              onClick={onRecordPayment}
              data-testid="record-payment-btn"
            >
              Record Payment
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {payments.length === 0 ? (
          <p className="text-sm text-gray-500" data-testid="no-payments">No payments recorded yet.</p>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Reference</TableHead>
                  <TableHead>Bank Account</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.map((payment) => (
                  <TableRow key={payment.id} data-testid={`payment-row-${payment.id}`}>
                    <TableCell>{payment.date}</TableCell>
                    <TableCell>{payment.reference || '-'}</TableCell>
                    <TableCell>{payment.bankAccount || '-'}</TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(payment.amount, currency)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <div className="mt-4 flex justify-end" data-testid="payment-summary">
              <div className="w-72 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Total</span>
                  <span>{formatCurrency(total, currency)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Total Paid</span>
                  <span data-testid="total-paid">{formatCurrency(totalPaid, currency)}</span>
                </div>
                <div className="flex justify-between border-t pt-2 font-semibold">
                  <span>Amount Due</span>
                  <span data-testid="remaining-due">{formatCurrency(amountDue, currency)}</span>
                </div>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
