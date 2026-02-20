import { useState } from 'react';
import { Button } from '../../../components/ui/Button';
import type { PurchaseOrder } from '../hooks/usePurchaseOrders';

export interface BillFromPOSelectorProps {
  purchaseOrders: PurchaseOrder[];
  onSelect: (po: PurchaseOrder) => void;
  loading?: boolean;
}

export function BillFromPOSelector({
  purchaseOrders,
  onSelect,
  loading = false,
}: BillFromPOSelectorProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const approvedPOs = purchaseOrders.filter((po) => po.status === 'approved');

  const handleSelect = () => {
    const po = approvedPOs.find((p) => p.id === selectedId);
    if (po) {
      onSelect(po);
    }
  };

  if (approvedPOs.length === 0) {
    return (
      <div
        className="rounded border border-[#e5e7eb] bg-gray-50 p-4 text-center text-sm text-[#6b7280]"
        data-testid="no-approved-pos"
      >
        No approved purchase orders available.
      </div>
    );
  }

  return (
    <div data-testid="bill-from-po-selector" className="space-y-2">
      <h3 className="text-sm font-medium text-[#1a1a2e]">Select a Purchase Order</h3>
      <ul className="space-y-1 max-h-[200px] overflow-y-auto border border-[#e5e7eb] rounded">
        {approvedPOs.map((po) => (
          <li
            key={po.id}
            className={`flex justify-between items-center px-3 py-2 text-sm cursor-pointer transition-colors ${
              selectedId === po.id
                ? 'bg-[#0078c8]/10 border-l-2 border-[#0078c8]'
                : 'hover:bg-gray-50'
            }`}
            onClick={() => setSelectedId(po.id)}
            data-testid={`po-option-${po.id}`}
          >
            <div>
              <span className="font-medium">{po.poNumber}</span>
              <span className="ml-2 text-[#6b7280]">{po.contactName}</span>
            </div>
            <span className="font-medium">${po.total.toFixed(2)}</span>
          </li>
        ))}
      </ul>
      <Button
        onClick={handleSelect}
        disabled={!selectedId}
        loading={loading}
        size="sm"
        data-testid="po-select-btn"
      >
        Use Selected PO
      </Button>
    </div>
  );
}
