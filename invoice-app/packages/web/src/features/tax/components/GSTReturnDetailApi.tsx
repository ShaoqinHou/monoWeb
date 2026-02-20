import { useState } from 'react';
import { Card, CardHeader, CardContent } from '../../../components/ui/Card';
import { Badge, type BadgeVariant } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { formatCurrency } from '@shared/calc/currency';
import type { GSTReturnApi } from '../hooks/useGSTReturns';

interface GSTReturnDetailApiProps {
  gstReturn: GSTReturnApi;
  onBack: () => void;
  onFile?: (id: string) => void;
  onDelete?: (id: string) => void;
  filing?: boolean;
  filingConfirmation?: string | null;
}

const STATUS_VARIANT: Record<GSTReturnApi['status'], BadgeVariant> = {
  draft: 'warning',
  filed: 'success',
  overdue: 'error',
};

const STATUS_LABEL: Record<GSTReturnApi['status'], string> = {
  draft: 'Draft',
  filed: 'Filed',
  overdue: 'Overdue',
};

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-NZ', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

interface SummaryRowProps {
  label: string;
  value: number;
  bold?: boolean;
  testId?: string;
}

function SummaryRow({ label, value, bold, testId }: SummaryRowProps) {
  return (
    <div
      className={`flex items-center justify-between py-3 border-b border-gray-100 ${bold ? 'font-semibold' : ''}`}
      data-testid={testId}
    >
      <span className="text-sm text-gray-700">{label}</span>
      <span className="text-sm text-gray-900">{formatCurrency(value)}</span>
    </div>
  );
}

function FileConfirmationDialog({
  returnPeriod,
  netGst,
  onConfirm,
  onCancel,
  loading,
}: {
  returnPeriod: string;
  netGst: number;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" data-testid="file-confirmation-dialog">
      <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">File GST Return</h3>
        <p className="text-sm text-gray-600 mb-4">
          Are you sure you want to file the GST return for <strong>{returnPeriod}</strong>?
          This will submit a net GST amount of <strong>{formatCurrency(netGst)}</strong> to IRD.
          This action cannot be undone.
        </p>
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={onCancel} data-testid="cancel-file-button">
            Cancel
          </Button>
          <Button onClick={onConfirm} loading={loading} data-testid="confirm-file-button">
            Confirm Filing
          </Button>
        </div>
      </div>
    </div>
  );
}

export function GSTReturnDetailApi({
  gstReturn,
  onBack,
  onFile,
  onDelete,
  filing,
  filingConfirmation,
}: GSTReturnDetailApiProps) {
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  const handleFileClick = () => {
    setShowConfirmDialog(true);
  };

  const handleConfirmFile = () => {
    setShowConfirmDialog(false);
    onFile?.(gstReturn.id);
  };

  return (
    <div className="space-y-6">
      {showConfirmDialog && (
        <FileConfirmationDialog
          returnPeriod={gstReturn.period}
          netGst={gstReturn.netGst}
          onConfirm={handleConfirmFile}
          onCancel={() => setShowConfirmDialog(false)}
          loading={filing}
        />
      )}

      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={onBack} data-testid="back-button">
          Back to returns
        </Button>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-bold text-gray-900">
            GST Return: {gstReturn.period}
          </h2>
          <Badge variant={STATUS_VARIANT[gstReturn.status]}>
            {STATUS_LABEL[gstReturn.status]}
          </Badge>
        </div>
        <div className="flex gap-2">
          {gstReturn.status === 'draft' && onFile && (
            <Button
              onClick={handleFileClick}
              loading={filing}
              data-testid="file-return-button"
            >
              File Return
            </Button>
          )}
          {gstReturn.status === 'draft' && onDelete && (
            <Button
              variant="destructive"
              onClick={() => onDelete(gstReturn.id)}
              data-testid="delete-return-button"
            >
              Delete
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
        <div>
          <span className="text-[#6b7280]">Period: </span>
          <span className="font-medium" data-testid="period-dates">
            {formatDate(gstReturn.startDate)} - {formatDate(gstReturn.endDate)}
          </span>
        </div>
        <div>
          <span className="text-[#6b7280]">Due: </span>
          <span className="font-medium" data-testid="due-date">
            {formatDate(gstReturn.dueDate)}
          </span>
        </div>
        {gstReturn.filedAt && (
          <div>
            <span className="text-[#6b7280]">Filed: </span>
            <span className="font-medium" data-testid="filed-date">
              {formatDate(gstReturn.filedAt)}
            </span>
          </div>
        )}
      </div>

      {gstReturn.status === 'filed' && filingConfirmation && (
        <div
          className="bg-green-50 border border-green-200 rounded-md p-4"
          data-testid="filing-status"
        >
          <p className="text-sm font-medium text-green-800">
            Filed on {gstReturn.filedAt ? formatDate(gstReturn.filedAt) : 'N/A'}
          </p>
          <p className="text-sm text-green-700 mt-1" data-testid="filing-confirmation-number">
            Confirmation: {filingConfirmation}
          </p>
        </div>
      )}

      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold text-gray-900">GST Summary</h3>
        </CardHeader>
        <CardContent>
          <SummaryRow
            label="GST Collected (on sales)"
            value={gstReturn.gstCollected}
            testId="gst-collected"
          />
          <SummaryRow
            label="GST Paid (on purchases)"
            value={gstReturn.gstPaid}
            testId="gst-paid"
          />
          <SummaryRow
            label="Net GST Payable"
            value={gstReturn.netGst}
            bold
            testId="net-gst"
          />
        </CardContent>
      </Card>
    </div>
  );
}
