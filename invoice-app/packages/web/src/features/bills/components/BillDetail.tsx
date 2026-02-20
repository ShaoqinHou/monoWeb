import { useState } from 'react';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '../../../components/ui/Table';
import { Card, CardContent, CardHeader } from '../../../components/ui/Card';
import { BillStatusBadge } from './BillStatusBadge';
import { BillActions } from './BillActions';
import { BillTotals } from './BillTotals';
import { PaymentHistory } from './PaymentHistory';
import { RecordPaymentForm } from './RecordPaymentForm';
import { ApprovalProgress } from './ApprovalProgress';
import { Button } from '../../../components/ui/Button';
import { PrintButton } from '../../../components/patterns/PrintButton';
import { ActivityLog } from '../../../components/patterns/ActivityLog';
import { formatCurrency } from '@shared/calc/currency';
import { canReceivePayment } from '@shared/rules/invoice-status';
import { BillAttachments } from './BillAttachments';
import { ChevronDown, Copy, Mail, FileText, XCircle, Trash2, ChevronUp } from 'lucide-react';
import type { Bill, BillStatusType, BillPayment, RecordPaymentData } from '../types';

interface BillDetailProps {
  bill: Bill;
  payments?: BillPayment[];
  onStatusChange: (status: BillStatusType) => void;
  onRecordPayment?: (data: RecordPaymentData) => void;
  onEdit?: () => void;
  onDuplicate?: () => void;
  onCopy?: () => void;
  onEmail?: () => void;
  onVoid?: () => void;
  onDelete?: () => void;
  loading?: boolean;
  paymentLoading?: boolean;
}

export function BillDetail({
  bill,
  payments = [],
  onStatusChange,
  onRecordPayment,
  onEdit,
  onDuplicate,
  onCopy,
  onEmail,
  onVoid,
  onDelete,
  loading = false,
  paymentLoading = false,
}: BillDetailProps) {
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [optionsOpen, setOptionsOpen] = useState(false);
  const [historyExpanded, setHistoryExpanded] = useState(false);
  const [noteText, setNoteText] = useState('');
  const showPaymentSection = canReceivePayment(bill.status) || payments.length > 0 || bill.amountPaid > 0;

  const handleRecordPayment = (data: RecordPaymentData) => {
    onRecordPayment?.(data);
    setPaymentDialogOpen(false);
  };

  return (
    <div className="space-y-6" data-testid="bill-detail">
      {/* Approval workflow progress */}
      <ApprovalProgress status={bill.status as BillStatusType} />

      {/* Header row: status + actions */}
      <div className="flex items-center justify-between">
        <BillStatusBadge status={bill.status} />
        <div className="flex items-center gap-2">
          {/* Print PDF button */}
          <PrintButton label="Print PDF" />

          {onDuplicate && (
            <Button
              variant="outline"
              onClick={onDuplicate}
              data-testid="bill-duplicate-btn"
            >
              Duplicate
            </Button>
          )}

          {/* Bill Options dropdown */}
          <div className="relative">
            <Button
              variant="outline"
              onClick={() => setOptionsOpen(!optionsOpen)}
              data-testid="bill-options-btn"
            >
              Bill Options
              <ChevronDown className="h-4 w-4 ml-1" />
            </Button>
            {optionsOpen && (
              <div
                className="absolute right-0 top-full mt-1 w-48 rounded-md border bg-white shadow-lg z-10"
                data-testid="bill-options-menu"
              >
                <button
                  className="w-full flex items-center gap-2 px-3 py-2 text-left text-sm hover:bg-gray-50"
                  onClick={() => { onCopy?.(); setOptionsOpen(false); }}
                  data-testid="bill-option-copy"
                >
                  <Copy className="h-4 w-4" /> Copy
                </button>
                <button
                  className="w-full flex items-center gap-2 px-3 py-2 text-left text-sm hover:bg-gray-50"
                  onClick={() => { onEmail?.(); setOptionsOpen(false); }}
                  data-testid="bill-option-email"
                >
                  <Mail className="h-4 w-4" /> Email
                </button>
                <button
                  className="w-full flex items-center gap-2 px-3 py-2 text-left text-sm hover:bg-gray-50"
                  onClick={() => { window.print(); setOptionsOpen(false); }}
                  data-testid="bill-option-print-pdf"
                >
                  <FileText className="h-4 w-4" /> Print PDF
                </button>
                <hr className="my-1 border-gray-200" />
                <button
                  className="w-full flex items-center gap-2 px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50"
                  onClick={() => { onVoid?.(); setOptionsOpen(false); }}
                  data-testid="bill-option-void"
                >
                  <XCircle className="h-4 w-4" /> Void
                </button>
                <button
                  className="w-full flex items-center gap-2 px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50"
                  onClick={() => { onDelete?.(); setOptionsOpen(false); }}
                  data-testid="bill-option-delete"
                >
                  <Trash2 className="h-4 w-4" /> Delete
                </button>
              </div>
            )}
          </div>

          <BillActions
            status={bill.status as BillStatusType}
            onStatusChange={onStatusChange}
            onEdit={onEdit}
            loading={loading}
          />
        </div>
      </div>

      {/* Bill info */}
      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold">Bill Details</h2>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-500">From</span>
              <p className="font-medium" data-testid="bill-contact">{bill.contactName}</p>
            </div>
            <div>
              <span className="text-gray-500">Bill Number</span>
              <p className="font-medium" data-testid="bill-number">{bill.billNumber}</p>
            </div>
            <div>
              <span className="text-gray-500">Date</span>
              <p className="font-medium" data-testid="bill-date">{bill.date}</p>
            </div>
            <div>
              <span className="text-gray-500">Due Date</span>
              <p className="font-medium" data-testid="bill-due-date">{bill.dueDate}</p>
            </div>
            {bill.reference && (
              <div>
                <span className="text-gray-500">Reference</span>
                <p className="font-medium" data-testid="bill-reference">{bill.reference}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Line items table */}
      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold">Line Items</h2>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Description</TableHead>
                <TableHead className="text-right">Qty</TableHead>
                <TableHead className="text-right">Unit Price</TableHead>
                <TableHead className="text-right">Tax</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {bill.lineItems.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{item.description}</TableCell>
                  <TableCell className="text-right">{item.quantity}</TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(item.unitPrice, bill.currency)}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(item.taxAmount, bill.currency)}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {formatCurrency(item.lineAmount, bill.currency)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <div className="mt-4">
            <BillTotals
              subTotal={bill.subTotal}
              totalTax={bill.totalTax}
              total={bill.total}
              currency={bill.currency}
              amountPaid={bill.amountPaid}
              amountDue={bill.amountDue}
            />
          </div>
        </CardContent>
      </Card>

      {/* Attachments */}
      <BillAttachments billId={bill.id} />

      {/* Payment history section */}
      {showPaymentSection && (
        <PaymentHistory
          payments={payments}
          currency={bill.currency}
          amountDue={bill.amountDue}
          total={bill.total}
          canRecordPayment={canReceivePayment(bill.status)}
          onRecordPayment={() => setPaymentDialogOpen(true)}
        />
      )}

      {/* Legacy payment summary for backward compat when no detailed payments */}
      {bill.amountPaid > 0 && payments.length === 0 && (
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold">Payment History</h2>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-gray-600" data-testid="payment-history">
              Payment of {formatCurrency(bill.amountPaid, bill.currency)} received.
              Amount due: {formatCurrency(bill.amountDue, bill.currency)}.
            </div>
          </CardContent>
        </Card>
      )}

      {/* History & Notes section (expandable) */}
      <Card>
        <CardHeader>
          <button
            className="flex items-center justify-between w-full text-left"
            onClick={() => setHistoryExpanded(!historyExpanded)}
            data-testid="history-notes-toggle"
          >
            <h2 className="text-lg font-semibold">History & Notes</h2>
            {historyExpanded ? (
              <ChevronUp className="h-5 w-5 text-gray-400" />
            ) : (
              <ChevronDown className="h-5 w-5 text-gray-400" />
            )}
          </button>
        </CardHeader>
        {historyExpanded && (
          <CardContent data-testid="history-notes-content">
            {/* Add note input */}
            <div className="mb-4 flex gap-2" data-testid="add-note-section">
              <input
                type="text"
                placeholder="Add a note..."
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm"
                data-testid="note-input"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => setNoteText('')}
                data-testid="add-note-btn"
              >
                Add Note
              </Button>
            </div>
            {/* Activity log */}
            <ActivityLog entityType="bill" entityId={bill.id} />
          </CardContent>
        )}
      </Card>

      {/* Record Payment Dialog */}
      <RecordPaymentForm
        billId={bill.id}
        amountDue={bill.amountDue}
        currency={bill.currency}
        open={paymentDialogOpen}
        onClose={() => setPaymentDialogOpen(false)}
        onSubmit={handleRecordPayment}
        loading={paymentLoading}
      />
    </div>
  );
}
