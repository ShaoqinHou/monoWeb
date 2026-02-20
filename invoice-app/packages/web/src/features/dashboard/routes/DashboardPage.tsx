import { PageContainer } from '../../../components/layout/PageContainer';
import { Button } from '../../../components/ui/Button';
import { BankAccountsWidget } from '../components/BankAccountsWidget';
import { InvoicesOwedWidget } from '../components/InvoicesOwedWidget';
import { BillsToPayWidget } from '../components/BillsToPayWidget';
import { CashFlowChart } from '../components/CashFlowChart';
import { ProfitLossChart } from '../components/ProfitLossChart';
import { AccountWatchlist } from '../components/AccountWatchlist';
import { RecentActivity } from '../components/RecentActivity';
import { QuickActions } from '../components/QuickActions';
import { ToastContainer } from '../components/ToastContainer';
import { TasksWidget } from '../components/TasksWidget';
import { InsightsWidget } from '../components/InsightsWidget';
import { ExpensesToReviewWidget } from '../components/ExpensesToReviewWidget';

export function DashboardPage() {
  return (
    <PageContainer
      title="Business Overview"
      actions={
        <Button variant="ghost" size="sm">Edit homepage</Button>
      }
    >
      {/* Quick action buttons */}
      <QuickActions />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3" aria-description="Dashboard of 10 widgets">
        {/* Left column */}
        <div className="space-y-6 lg:col-span-1">
          <TasksWidget />
          <BankAccountsWidget />
          <ExpensesToReviewWidget />
          <BillsToPayWidget />
          <RecentActivity />
        </div>

        {/* Right column (wider) */}
        <div className="space-y-6 lg:col-span-2">
          <InsightsWidget />
          <InvoicesOwedWidget />
          <CashFlowChart />
          <ProfitLossChart />
        </div>
      </div>

      {/* Full width bottom section */}
      <div className="mt-6">
        <AccountWatchlist />
      </div>

      {/* Toast notification container */}
      <ToastContainer />
    </PageContainer>
  );
}
