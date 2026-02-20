import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '../../../components/ui/Table';
import { Card, CardContent, CardHeader } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { PurchaseOrderStatusBadge } from './PurchaseOrderStatusBadge';
import type { PurchaseOrder, PurchaseOrderStatus } from '../hooks/usePurchaseOrders';

interface PurchaseOrderDetailProps {
  purchaseOrder: PurchaseOrder;
  onStatusChange: (status: PurchaseOrderStatus) => void;
  onEdit: () => void;
  onConvertToBill: () => void;
  loading?: boolean;
  convertLoading?: boolean;
}

export function PurchaseOrderDetail({
  purchaseOrder,
  onStatusChange,
  onEdit,
  onConvertToBill,
  loading = false,
  convertLoading = false,
}: PurchaseOrderDetailProps) {
  const po = purchaseOrder;
  const canApprove = po.status === 'draft' || po.status === 'submitted';
  const canSend = po.status === 'draft';
  const canConvert = po.status === 'approved';
  const canEdit = po.status === 'draft' || po.status === 'submitted';

  return (
    <div className="space-y-6" data-testid="po-detail">
      {/* Header row: status + actions */}
      <div className="flex items-center justify-between">
        <PurchaseOrderStatusBadge status={po.status} />
        <div className="flex items-center gap-2">
          {canEdit && (
            <Button
              variant="secondary"
              onClick={onEdit}
              data-testid="po-edit-btn"
            >
              Edit
            </Button>
          )}
          {canSend && (
            <Button
              variant="outline"
              onClick={() => onStatusChange('submitted')}
              loading={loading}
              data-testid="po-send-btn"
            >
              Send
            </Button>
          )}
          {canApprove && (
            <Button
              variant="primary"
              onClick={() => onStatusChange('approved')}
              loading={loading}
              data-testid="po-approve-btn"
            >
              Approve
            </Button>
          )}
          {canConvert && (
            <Button
              variant="primary"
              onClick={onConvertToBill}
              loading={convertLoading}
              data-testid="po-convert-btn"
            >
              Convert to Bill
            </Button>
          )}
        </div>
      </div>

      {/* PO info */}
      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold">Purchase Order Details</h2>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-500">Supplier</span>
              <p className="font-medium" data-testid="po-contact">{po.contactName}</p>
            </div>
            <div>
              <span className="text-gray-500">PO Number</span>
              <p className="font-medium" data-testid="po-number">{po.poNumber}</p>
            </div>
            <div>
              <span className="text-gray-500">Order Date</span>
              <p className="font-medium" data-testid="po-date">{po.date}</p>
            </div>
            {po.deliveryDate && (
              <div>
                <span className="text-gray-500">Delivery Date</span>
                <p className="font-medium" data-testid="po-delivery-date">{po.deliveryDate}</p>
              </div>
            )}
            {po.reference && (
              <div>
                <span className="text-gray-500">Reference</span>
                <p className="font-medium" data-testid="po-reference">{po.reference}</p>
              </div>
            )}
            {po.deliveryAddress && (
              <div>
                <span className="text-gray-500">Delivery Address</span>
                <p className="font-medium" data-testid="po-delivery-address">{po.deliveryAddress}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Line items table */}
      {po.lineItems && po.lineItems.length > 0 && (
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
                {po.lineItems.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>{item.description}</TableCell>
                    <TableCell className="text-right">{item.quantity}</TableCell>
                    <TableCell className="text-right">
                      {po.currency} {item.unitPrice.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right">
                      {po.currency} {item.taxAmount.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {po.currency} {item.lineAmount.toFixed(2)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {/* Totals */}
            <div className="mt-4 border-t pt-4 text-sm">
              <div className="flex justify-between py-1">
                <span className="text-gray-500">Subtotal</span>
                <span data-testid="po-subtotal">{po.currency} {po.subTotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-gray-500">Tax</span>
                <span data-testid="po-tax">{po.currency} {po.totalTax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between py-1 font-semibold text-base">
                <span>Total</span>
                <span data-testid="po-total">{po.currency} {po.total.toFixed(2)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Converted bill link */}
      {po.convertedBillId && (
        <Card>
          <CardContent>
            <p className="text-sm text-gray-600" data-testid="po-converted-bill">
              This purchase order has been converted to bill <span className="font-medium">{po.convertedBillId}</span>.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
