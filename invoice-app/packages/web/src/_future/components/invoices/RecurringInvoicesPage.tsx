import { useNavigate } from '@tanstack/react-router';
import { PageContainer } from '../../../components/layout/PageContainer';
import { Button } from '../../../components/ui/Button';
import { RecurringInvoiceList } from '../../../features/invoices/components/RecurringInvoiceList';
import { useRecurringInvoices } from '../../../features/invoices/hooks/useRecurringInvoices';
import { Plus } from 'lucide-react';

export function RecurringInvoicesPage() {
  const { data: items = [], isLoading } = useRecurringInvoices();
  const navigate = useNavigate();

  const handleItemClick = (id: string) => {
    navigate({ to: '/sales/recurring-invoices/$recurringId', params: { recurringId: id } });
  };

  const handleNewRecurring = () => {
    navigate({ to: '/sales/recurring-invoices/new' });
  };

  return (
    <PageContainer
      title="Recurring Invoices"
      breadcrumbs={[{ label: 'Sales', href: '/sales' }, { label: 'Recurring Invoices' }]}
      actions={
        <Button onClick={handleNewRecurring} data-testid="new-recurring-invoice-button">
          <Plus className="h-4 w-4 mr-1" />
          New Recurring Invoice
        </Button>
      }
    >
      <RecurringInvoiceList
        items={items}
        onItemClick={handleItemClick}
        isLoading={isLoading}
      />
    </PageContainer>
  );
}
