import { useCallback } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { PageContainer } from '../../../components/layout/PageContainer';
import { Button } from '../../../components/ui/Button';
import { RecurringBillList } from '../components/RecurringBillList';
import { useRecurringBills } from '../hooks/useRecurringBills';
import { Plus } from 'lucide-react';

export function RecurringBillsPage() {
  const { data: items = [], isLoading } = useRecurringBills();
  const navigate = useNavigate();

  const handleItemClick = useCallback(
    (id: string) => {
      navigate({ to: '/purchases/recurring-bills/$recurringBillId', params: { recurringBillId: id } });
    },
    [navigate],
  );

  const handleNewRecurringBill = useCallback(() => {
    navigate({ to: '/purchases/recurring-bills/new' });
  }, [navigate]);

  return (
    <PageContainer
      title="Recurring Bills"
      breadcrumbs={[{ label: 'Purchases', href: '/purchases' }, { label: 'Recurring Bills' }]}
      actions={
        <Button onClick={handleNewRecurringBill} data-testid="new-recurring-bill-button">
          <Plus className="h-4 w-4 mr-1" />
          New Recurring Bill
        </Button>
      }
    >
      <RecurringBillList
        items={items}
        onItemClick={handleItemClick}
        isLoading={isLoading}
      />
    </PageContainer>
  );
}
