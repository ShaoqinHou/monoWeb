import { Card, CardHeader, CardContent } from '../../../components/ui/Card';
import { Badge, type BadgeVariant } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { formatCurrency } from '@shared/calc/currency';
import type { GSTReturn } from '../types';

interface GSTReturnDetailProps {
  gstReturn: GSTReturn;
  onBack: () => void;
}

const STATUS_VARIANT: Record<GSTReturn['status'], BadgeVariant> = {
  draft: 'warning',
  filed: 'success',
  overdue: 'error',
};

const STATUS_LABEL: Record<GSTReturn['status'], string> = {
  draft: 'Draft',
  filed: 'Filed',
  overdue: 'Overdue',
};

interface BoxRowProps {
  boxNumber: string;
  label: string;
  value: number;
  bold?: boolean;
}

function BoxRow({ boxNumber, label, value, bold }: BoxRowProps) {
  return (
    <div
      className={`flex items-center justify-between py-3 border-b border-gray-100 ${bold ? 'font-semibold' : ''}`}
      data-testid={`box-${boxNumber}`}
    >
      <div className="flex items-center gap-3">
        <span className="inline-flex items-center justify-center w-8 h-8 rounded bg-gray-100 text-sm font-medium text-gray-600">
          {boxNumber}
        </span>
        <span className="text-sm text-gray-700">{label}</span>
      </div>
      <span className="text-sm text-gray-900">{formatCurrency(value)}</span>
    </div>
  );
}

export function GSTReturnDetail({ gstReturn, onBack }: GSTReturnDetailProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={onBack} data-testid="back-button">
          Back to returns
        </Button>
      </div>

      <div className="flex items-center gap-4">
        <h2 className="text-xl font-bold text-gray-900">
          GST Return: {gstReturn.period}
        </h2>
        <Badge variant={STATUS_VARIANT[gstReturn.status]}>
          {STATUS_LABEL[gstReturn.status]}
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sales Section */}
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold text-gray-900">Sales</h3>
          </CardHeader>
          <CardContent>
            <BoxRow
              boxNumber="5"
              label="Total sales (excl GST)"
              value={gstReturn.totalSales}
            />
            <BoxRow
              boxNumber="6"
              label="Zero-rated supplies"
              value={gstReturn.zeroRatedSupplies}
            />
            <BoxRow
              boxNumber="9"
              label="GST on sales (15%)"
              value={gstReturn.gstOnSales}
              bold
            />
          </CardContent>
        </Card>

        {/* Purchases Section */}
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold text-gray-900">Purchases</h3>
          </CardHeader>
          <CardContent>
            <BoxRow
              boxNumber="11"
              label="Total purchases (excl GST)"
              value={gstReturn.totalPurchases}
            />
            <BoxRow
              boxNumber="13"
              label="GST on purchases"
              value={gstReturn.gstOnPurchases}
              bold
            />
          </CardContent>
        </Card>
      </div>

      {/* Net GST Summary */}
      <Card>
        <CardContent>
          <div className="flex items-center justify-between py-2">
            <span className="text-lg font-semibold text-gray-900">
              Net GST payable (Box 9 - Box 13)
            </span>
            <span
              className="text-lg font-bold text-gray-900"
              data-testid="net-gst-value"
            >
              {formatCurrency(gstReturn.netGST)}
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
