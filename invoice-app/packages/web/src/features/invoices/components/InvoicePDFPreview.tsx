import { useCallback, useRef } from 'react';
import { Dialog } from '../../../components/ui/Dialog';
import { Button } from '../../../components/ui/Button';
import { formatCurrency } from '@xero-replica/shared';
import { Printer, Download } from 'lucide-react';
import type { Invoice } from '../types';

interface InvoicePDFPreviewProps {
  invoice: Invoice;
  open: boolean;
  onClose: () => void;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-NZ', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export function InvoicePDFPreview({ invoice, open, onClose }: InvoicePDFPreviewProps) {
  const previewRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = useCallback(() => {
    const el = previewRef.current;
    if (!el) return;
    const html = el.outerHTML;
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${invoice.invoiceNumber}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [invoice.invoiceNumber]);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Invoice Preview"
      className="max-w-2xl"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
          <Button variant="outline" onClick={handleDownload} data-testid="download-pdf-button">
            <Download className="h-4 w-4 mr-1" />
            Download PDF
          </Button>
          <Button variant="primary" onClick={handlePrint} data-testid="print-button">
            <Printer className="h-4 w-4 mr-1" />
            Print
          </Button>
        </>
      }
    >
      <div ref={previewRef} className="invoice-preview space-y-6 print:m-0" data-testid="pdf-preview-content">
        {/* Company header */}
        <div className="border-b pb-4">
          <h1 className="text-2xl font-bold text-gray-900">TAX INVOICE</h1>
          <p className="text-sm text-gray-600 mt-1">My Organisation</p>
        </div>

        {/* Invoice metadata */}
        <div className="grid grid-cols-2 gap-6 text-sm">
          <div>
            <p className="font-semibold text-gray-500 uppercase text-xs mb-1">Bill To</p>
            <p className="font-medium text-gray-900" data-testid="preview-contact">
              {invoice.contactName}
            </p>
          </div>
          <div className="text-right">
            <p className="font-semibold text-gray-500 uppercase text-xs mb-1">Invoice Number</p>
            <p className="font-medium text-gray-900" data-testid="preview-number">
              {invoice.invoiceNumber}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 text-sm">
          <div>
            <p className="text-gray-500">Date</p>
            <p className="font-medium">{formatDate(invoice.date)}</p>
          </div>
          <div>
            <p className="text-gray-500">Due Date</p>
            <p className="font-medium">{formatDate(invoice.dueDate)}</p>
          </div>
          {invoice.reference && (
            <div>
              <p className="text-gray-500">Reference</p>
              <p className="font-medium">{invoice.reference}</p>
            </div>
          )}
        </div>

        {/* Line items table */}
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="border-b-2 border-gray-300 text-left">
              <th className="py-2 font-semibold">Description</th>
              <th className="py-2 font-semibold text-right">Qty</th>
              <th className="py-2 font-semibold text-right">Unit Price</th>
              <th className="py-2 font-semibold text-right">Tax</th>
              <th className="py-2 font-semibold text-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            {invoice.lineItems.map((item) => (
              <tr key={item.id} className="border-b border-gray-100">
                <td className="py-2">{item.description}</td>
                <td className="py-2 text-right">{item.quantity}</td>
                <td className="py-2 text-right">
                  {formatCurrency(item.unitPrice, invoice.currency)}
                </td>
                <td className="py-2 text-right">
                  {formatCurrency(item.taxAmount, invoice.currency)}
                </td>
                <td className="py-2 text-right font-medium">
                  {formatCurrency(item.lineAmount + item.taxAmount, invoice.currency)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totals */}
        <div className="flex justify-end">
          <div className="w-64 space-y-1.5 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Subtotal</span>
              <span data-testid="preview-subtotal">
                {formatCurrency(invoice.subTotal, invoice.currency)}
              </span>
            </div>
            {invoice.totalTax > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-600">Tax</span>
                <span data-testid="preview-tax">
                  {formatCurrency(invoice.totalTax, invoice.currency)}
                </span>
              </div>
            )}
            <div className="flex justify-between border-t border-gray-300 pt-1.5 font-bold text-base">
              <span>Total</span>
              <span data-testid="preview-total">
                {formatCurrency(invoice.total, invoice.currency)}
              </span>
            </div>
            {invoice.amountPaid > 0 && (
              <div className="flex justify-between text-gray-600">
                <span>Paid</span>
                <span>{formatCurrency(invoice.amountPaid, invoice.currency)}</span>
              </div>
            )}
            <div className="flex justify-between border-t border-gray-300 pt-1.5 font-bold text-lg">
              <span>Amount Due</span>
              <span data-testid="preview-amount-due">
                {formatCurrency(invoice.amountDue, invoice.currency)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </Dialog>
  );
}
