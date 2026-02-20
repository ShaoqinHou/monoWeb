import { useState } from 'react';
import { Card, CardContent } from '../../../components/ui/Card';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '../../../components/ui/Table';
import { InvoiceStatusBadge } from './InvoiceStatusBadge';
import { InvoiceActions } from './InvoiceActions';
import { InvoicePDFPreview } from './InvoicePDFPreview';
import { formatCurrency } from '@xero-replica/shared';
import { isEditable } from '@xero-replica/shared';
import { Button } from '../../../components/ui/Button';
import { Pencil, FileText, CreditCard } from 'lucide-react';
import type { Invoice, InvoiceStatusType } from '../types';
import type { PaymentRecord } from './RecordPaymentDialog';

interface InvoiceDetailProps {
  invoice: Invoice;
  onTransition: (newStatus: InvoiceStatusType) => void;
  onEdit: () => void;
  onCreateCreditNote?: () => void;
  isTransitioning?: boolean;
  notes?: string;
  expectedPaymentDate?: string;
  payments?: PaymentRecord[];
  overpaymentAmount?: number;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-NZ', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export function InvoiceDetail({
  invoice,
  onTransition,
  onEdit,
  onCreateCreditNote,
  isTransitioning = false,
  notes,
  expectedPaymentDate,
  payments = [],
  overpaymentAmount = 0,
}: InvoiceDetailProps) {
  const canEdit = isEditable(invoice.status);
  const canCreateCreditNote = invoice.status === 'paid' || invoice.status === 'approved';
  const [showPreview, setShowPreview] = useState(false);

  return (
    <div className="space-y-6" data-testid="invoice-detail">
      {/* Header row: status badge + actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <InvoiceStatusBadge status={invoice.status} />
          {canEdit && (
            <Button variant="outline" size="sm" onClick={onEdit} data-testid="edit-invoice-button">
              <Pencil className="h-4 w-4 mr-1" />
              Edit
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowPreview(true)}
            data-testid="preview-invoice-button"
          >
            <FileText className="h-4 w-4 mr-1" />
            Preview
          </Button>
          {canCreateCreditNote && onCreateCreditNote && (
            <Button
              variant="outline"
              size="sm"
              onClick={onCreateCreditNote}
              data-testid="create-credit-note-button"
            >
              <CreditCard className="h-4 w-4 mr-1" />
              Create Credit Note
            </Button>
          )}
        </div>
        <InvoiceActions
          status={invoice.status}
          onTransition={onTransition}
          isPending={isTransitioning}
        />
      </div>

      {/* PDF Preview Modal */}
      <InvoicePDFPreview
        invoice={invoice}
        open={showPreview}
        onClose={() => setShowPreview(false)}
      />

      {/* Invoice preview card */}
      <Card>
        <CardContent className="space-y-6 p-8">
          {/* From / To row */}
          <div className="grid grid-cols-2 gap-8">
            <div>
              <p className="text-xs font-semibold uppercase text-gray-500 mb-1">From</p>
              <p className="font-medium text-gray-900">My Organisation</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase text-gray-500 mb-1">To</p>
              <p className="font-medium text-gray-900" data-testid="detail-contact">
                {invoice.contactName}
              </p>
            </div>
          </div>

          {/* Invoice metadata */}
          <div className="grid grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-gray-500">Invoice Number</p>
              <p className="font-medium" data-testid="detail-number">
                {invoice.invoiceNumber}
              </p>
            </div>
            <div>
              <p className="text-gray-500">Reference</p>
              <p className="font-medium">{invoice.reference ?? '-'}</p>
            </div>
            <div>
              <p className="text-gray-500">Date</p>
              <p className="font-medium">{formatDate(invoice.date)}</p>
            </div>
            <div>
              <p className="text-gray-500">Due Date</p>
              <p className="font-medium">{formatDate(invoice.dueDate)}</p>
            </div>
          </div>

          {/* Line items table */}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Description</TableHead>
                <TableHead className="text-right">Qty</TableHead>
                <TableHead className="text-right">Unit Price</TableHead>
                <TableHead className="text-right">Discount</TableHead>
                <TableHead>Account</TableHead>
                <TableHead className="text-right">Tax</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoice.lineItems.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{item.description}</TableCell>
                  <TableCell className="text-right">{item.quantity}</TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(item.unitPrice, invoice.currency)}
                  </TableCell>
                  <TableCell className="text-right">
                    {item.discount > 0 ? `${item.discount}%` : '—'}
                  </TableCell>
                  <TableCell>{item.accountCode ?? '—'}</TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(item.taxAmount, invoice.currency)}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {formatCurrency(item.lineAmount + item.taxAmount, invoice.currency)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {/* Totals */}
          <div className="flex justify-end">
            <div className="w-72 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Subtotal</span>
                <span data-testid="detail-subtotal">
                  {formatCurrency(invoice.subTotal, invoice.currency)}
                </span>
              </div>
              {invoice.totalTax > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Tax</span>
                  <span data-testid="detail-tax">
                    {formatCurrency(invoice.totalTax, invoice.currency)}
                  </span>
                </div>
              )}
              <div className="flex justify-between border-t border-gray-200 pt-2 font-semibold">
                <span>Total</span>
                <span data-testid="detail-total">
                  {formatCurrency(invoice.total, invoice.currency)}
                </span>
              </div>
              {invoice.amountPaid > 0 && (
                <div className="flex justify-between text-gray-600">
                  <span>Paid</span>
                  <span data-testid="detail-paid">
                    {formatCurrency(invoice.amountPaid, invoice.currency)}
                  </span>
                </div>
              )}
              <div className="flex justify-between border-t border-gray-200 pt-2 font-bold text-base">
                <span>Amount Due</span>
                <span data-testid="detail-amount-due">
                  {formatCurrency(invoice.amountDue, invoice.currency)}
                </span>
              </div>
            </div>
          </div>

          {/* Expected Payment Date */}
          {expectedPaymentDate && (
            <div data-testid="detail-expected-payment-date">
              <p className="text-gray-500 text-sm">Expected Payment Date</p>
              <p className="font-medium text-sm">{formatDate(expectedPaymentDate)}</p>
            </div>
          )}

          {/* Payment history */}
          {(invoice.amountPaid > 0 || payments.length > 0) && (
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Payment History</h3>
              {payments.length > 0 ? (
                <div className="space-y-1" data-testid="payments-list">
                  {payments.map((p, i) => (
                    <div key={i} className="text-sm text-gray-600 border rounded-md p-3 bg-gray-50 flex justify-between" data-testid={`payment-entry-${i}`}>
                      <span>{p.date} {p.reference && `(${p.reference})`}</span>
                      <span className="font-medium">
                        {formatCurrency(p.amount, invoice.currency)}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-sm text-gray-600 border rounded-md p-3 bg-gray-50">
                  <div className="flex justify-between">
                    <span>Payment received</span>
                    <span className="font-medium">
                      {formatCurrency(invoice.amountPaid, invoice.currency)}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Overpayment notice */}
          {overpaymentAmount > 0 && (
            <div className="rounded-md bg-amber-50 p-3 text-sm text-amber-800" data-testid="detail-overpayment">
              Overpayment: <span className="font-semibold">{formatCurrency(overpaymentAmount, invoice.currency)}</span>
            </div>
          )}

          {/* Notes */}
          {notes && (
            <div data-testid="detail-notes">
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Notes</h3>
              <p className="text-sm text-gray-600 border rounded-md p-3 bg-gray-50 whitespace-pre-wrap">{notes}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
