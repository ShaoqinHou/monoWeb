import { useCallback, useState, useMemo } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { PageContainer } from '../../../components/layout/PageContainer';
import { Button } from '../../../components/ui/Button';
import { PurchaseOrderList } from '../components/PurchaseOrderList';
import { usePurchaseOrders } from '../hooks/usePurchaseOrders';
import { Plus, MoreHorizontal } from 'lucide-react';

const STATUS_TABS = [
  { value: 'all', label: 'All' },
  { value: 'draft', label: 'Draft' },
  { value: 'submitted', label: 'Awaiting approval' },
  { value: 'approved', label: 'Approved' },
  { value: 'billed', label: 'Billed' },
];

export function PurchaseOrdersPage() {
  const { data: orders = [], isLoading } = usePurchaseOrders();
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState('all');
  const [showMoreOptions, setShowMoreOptions] = useState(false);

  // Compute counts per status for tab labels
  const counts = useMemo(() => {
    return {
      all: orders.length,
      draft: orders.filter((po) => po.status === 'draft').length,
      submitted: orders.filter((po) => po.status === 'submitted').length,
      approved: orders.filter((po) => po.status === 'approved').length,
      billed: orders.filter((po) => po.status === 'billed').length,
    };
  }, [orders]);

  const filteredOrders = useMemo(() => {
    if (statusFilter === 'all') return orders;
    return orders.filter((po) => po.status === statusFilter);
  }, [orders, statusFilter]);

  const handlePurchaseOrderClick = useCallback(
    (id: string) => {
      navigate({ to: '/purchases/purchase-orders/$orderId', params: { orderId: id } });
    },
    [navigate],
  );

  const handleNewPurchaseOrder = useCallback(() => {
    navigate({ to: '/purchases/purchase-orders/new' });
  }, [navigate]);

  function getTabLabel(tab: typeof STATUS_TABS[number]): string {
    const count = counts[tab.value as keyof typeof counts];
    if (tab.value === 'all') return tab.label;
    return `${tab.label} (${count})`;
  }

  return (
    <PageContainer
      title="Purchase Orders"
      breadcrumbs={[{ label: 'Purchases', href: '/purchases' }, { label: 'Purchase Orders' }]}
      actions={
        <div className="flex items-center gap-2">
          <Button onClick={handleNewPurchaseOrder} data-testid="new-po-button">
            <Plus className="h-4 w-4 mr-1" />
            New Purchase Order
          </Button>
          <div className="relative">
            <Button
              variant="outline"
              onClick={() => setShowMoreOptions(!showMoreOptions)}
              data-testid="po-more-options-btn"
              aria-label="More options"
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
            {showMoreOptions && (
              <div
                className="absolute right-0 top-full mt-1 w-40 rounded-md border bg-white shadow-lg z-10"
                data-testid="po-more-options-menu"
              >
                <button
                  className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50"
                  onClick={() => setShowMoreOptions(false)}
                  data-testid="po-more-import"
                >
                  Import
                </button>
                <button
                  className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50"
                  onClick={() => setShowMoreOptions(false)}
                  data-testid="po-more-export"
                >
                  Export
                </button>
              </div>
            )}
          </div>
        </div>
      }
    >
      <div
        role="tablist"
        className="flex items-center gap-1 border-b border-[#e5e7eb] mb-4"
        data-testid="po-status-tabs"
      >
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.value}
            role="tab"
            aria-selected={statusFilter === tab.value}
            onClick={() => setStatusFilter(tab.value)}
            className={`px-3 py-2 text-sm font-medium border-b-2 transition-colors ${
              statusFilter === tab.value
                ? 'border-[#0078c8] text-[#0078c8]'
                : 'border-transparent text-[#6b7280] hover:text-[#1a1a2e]'
            }`}
            data-testid={`po-tab-${tab.value}`}
          >
            {getTabLabel(tab)}
          </button>
        ))}
      </div>
      <PurchaseOrderList
        purchaseOrders={filteredOrders}
        onPurchaseOrderClick={handlePurchaseOrderClick}
        isLoading={isLoading}
      />
    </PageContainer>
  );
}
