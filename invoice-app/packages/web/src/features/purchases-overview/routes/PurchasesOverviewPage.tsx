import { useNavigate } from '@tanstack/react-router';
import { PageContainer } from '../../../components/layout/PageContainer';
import { Button } from '../../../components/ui/Button';
import { PurchasesSummary } from '../components/PurchasesSummary';
import { PurchasesChart } from '../components/PurchasesChart';
import { RecentBills } from '../components/RecentBills';
import { usePurchasesSummary, usePurchasesChart, useRecentBills } from '../hooks/usePurchases';

export function PurchasesOverviewPage() {
  const currentYear = new Date().getFullYear();
  const summaryQuery = usePurchasesSummary();
  const chartQuery = usePurchasesChart(currentYear);
  const recentQuery = useRecentBills();
  const navigate = useNavigate();

  return (
    <PageContainer
      title="Purchases Overview"
      breadcrumbs={[
        { label: 'Purchases', href: '/purchases' },
        { label: 'Overview' },
      ]}
      actions={
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate({ to: '/purchases/bills' })}
          >
            View All Bills
          </Button>
          <Button
            size="sm"
            onClick={() => navigate({ to: '/purchases/bills/new' })}
          >
            New Bill
          </Button>
        </div>
      }
    >
      <div className="space-y-6">
        <PurchasesSummary data={summaryQuery.data} isLoading={summaryQuery.isLoading} />
        <PurchasesChart data={chartQuery.data} isLoading={chartQuery.isLoading} />
        <RecentBills data={recentQuery.data} isLoading={recentQuery.isLoading} />
      </div>
    </PageContainer>
  );
}
