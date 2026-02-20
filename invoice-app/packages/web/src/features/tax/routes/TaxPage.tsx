import { useState } from 'react';
import { PageContainer } from '../../../components/layout/PageContainer';
import { Button } from '../../../components/ui/Button';
import { Card, CardContent } from '../../../components/ui/Card';
import { Tabs, TabList, Tab, TabPanel } from '../../../components/ui/Tabs';
import { GSTReturnList } from '../components/GSTReturnList';
import { GSTReturnDetailApi } from '../components/GSTReturnDetailApi';
import { TaxRateList } from '../components/TaxRateList';
import { TaxSummaryCard } from '../components/TaxSummaryCard';
import { ActivityStatementsList } from '../components/ActivityStatementsList';
import { useGSTReturnsApi, useGSTReturnApi, useCreateGSTReturn, useFileGSTReturn, useDeleteGSTReturn } from '../hooks/useGSTReturns';
import { useTaxSummary } from '../hooks/useTax';
import { useActivityStatements } from '../hooks/useActivityStatements';
import { useTaxSettings } from '../hooks/useTaxSettings';

/** Tax Rates page -- standalone route */
export function TaxRatesPage() {
  return (
    <PageContainer title="Tax Rates" breadcrumbs={[{ label: 'Tax' }, { label: 'Tax Rates' }]}>
      <TaxRateList />
    </PageContainer>
  );
}

export function GSTReturnsPage() {
  const [selectedReturnId, setSelectedReturnId] = useState<string | null>(null);
  const { data: returns = [], isLoading: returnsLoading } = useGSTReturnsApi();
  const { data: selectedReturn } = useGSTReturnApi(selectedReturnId ?? '');
  const { data: taxSummary } = useTaxSummary();
  const { data: activityStatements = [], isLoading: statementsLoading } = useActivityStatements();
  const { data: taxSettings, isLoading: settingsLoading } = useTaxSettings();

  const createReturn = useCreateGSTReturn();
  const fileReturn = useFileGSTReturn();
  const deleteReturn = useDeleteGSTReturn();

  const handleNewReturn = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    createReturn.mutate({
      period: `${now.toLocaleString('default', { month: 'short' })}-${String(now.getMonth() + 2).padStart(2, '0')} ${year}`,
      startDate: `${year}-${month}-01`,
      endDate: `${year}-${month}-${new Date(year, now.getMonth() + 1, 0).getDate()}`,
      dueDate: `${year}-${String(now.getMonth() + 2).padStart(2, '0')}-28`,
    });
  };

  if (returnsLoading || settingsLoading) {
    return (
      <PageContainer title="GST Returns">
        <p className="text-gray-500">Loading GST returns...</p>
      </PageContainer>
    );
  }

  if (selectedReturnId && selectedReturn) {
    return (
      <PageContainer
        title="GST Returns"
        breadcrumbs={[
          { label: 'Tax', href: '/tax/gst-returns' },
          { label: 'GST Returns', href: '/tax/gst-returns' },
          { label: selectedReturn.period },
        ]}
      >
        <GSTReturnDetailApi
          gstReturn={selectedReturn}
          onBack={() => setSelectedReturnId(null)}
          onFile={(id) => fileReturn.mutate(id, { onSuccess: () => setSelectedReturnId(null) })}
          onDelete={(id) => deleteReturn.mutate(id, { onSuccess: () => setSelectedReturnId(null) })}
          filing={fileReturn.isPending}
        />
      </PageContainer>
    );
  }

  return (
    <PageContainer
      title="GST Returns"
      actions={
        <Button
          onClick={handleNewReturn}
          loading={createReturn.isPending}
          data-testid="new-gst-return-btn"
        >
          New Return
        </Button>
      }
    >
      {taxSummary && (
        <div className="mb-6">
          <TaxSummaryCard summary={taxSummary} />
        </div>
      )}

      {/* GST Setup Form (matches Xero) */}
      <Card className="mb-6">
        <CardContent>
          <h3 className="text-sm font-semibold text-[#1a1a2e] mb-4">GST Settings</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Tax form type */}
            <div data-testid="gst-form-type">
              <label className="block text-sm font-medium text-[#6b7280] mb-2">Tax form type</label>
              <div className="space-y-1">
                <label className="flex items-center gap-2 text-sm text-[#1a1a2e]">
                  <input type="radio" name="gst-form-type" value="GST101A" defaultChecked={taxSettings?.gstFormType !== 'GST101B'} className="accent-[#0078c8]" />
                  GST101A (Standard)
                </label>
                <label className="flex items-center gap-2 text-sm text-[#1a1a2e]">
                  <input type="radio" name="gst-form-type" value="GST101B" defaultChecked={taxSettings?.gstFormType === 'GST101B'} className="accent-[#0078c8]" />
                  GST101B (Simplified)
                </label>
              </div>
            </div>

            {/* Accounting basis (read-only) */}
            <div data-testid="gst-accounting-basis">
              <label className="block text-sm font-medium text-[#6b7280] mb-2">Accounting basis</label>
              <p className="text-sm text-[#1a1a2e] bg-gray-50 px-3 py-2 rounded border border-[#e5e7eb]">
                {taxSettings?.accountingBasis ?? 'Invoice basis (Accrual)'}
              </p>
            </div>

            {/* Filing period (read-only) */}
            <div data-testid="gst-filing-period">
              <label className="block text-sm font-medium text-[#6b7280] mb-2">Filing period</label>
              <p className="text-sm text-[#1a1a2e] bg-gray-50 px-3 py-2 rounded border border-[#e5e7eb]">
                {taxSettings?.filingPeriod ?? '2-monthly'}
              </p>
            </div>

            {/* GST number */}
            <div data-testid="gst-number">
              <label className="block text-sm font-medium text-[#6b7280] mb-2">GST number</label>
              <input
                type="text"
                defaultValue={taxSettings?.gstNumber ?? ''}
                className="w-full text-sm text-[#1a1a2e] px-3 py-2 rounded border border-[#e5e7eb] focus:outline-none focus:ring-2 focus:ring-[#0078c8]/30"
                data-testid="gst-number-input"
              />
            </div>

            {/* Start returns from */}
            <div data-testid="gst-start-date">
              <label className="block text-sm font-medium text-[#6b7280] mb-2">Start returns from</label>
              <input
                type="date"
                defaultValue={taxSettings?.gstStartDate ?? ''}
                className="w-full text-sm text-[#1a1a2e] px-3 py-2 rounded border border-[#e5e7eb] focus:outline-none focus:ring-2 focus:ring-[#0078c8]/30"
                data-testid="gst-start-date-input"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultTab="returns">
        <TabList>
          <Tab tabId="returns">GST Returns</Tab>
          <Tab tabId="activity-statements">Activity Statements</Tab>
          <Tab tabId="tax-rates">Tax Rates</Tab>
        </TabList>
        <TabPanel tabId="returns">
          <GSTReturnList
            returns={returns}
            onSelectReturn={setSelectedReturnId}
            onNewReturn={handleNewReturn}
          />
        </TabPanel>
        <TabPanel tabId="activity-statements">
          {statementsLoading ? (
            <p className="text-gray-500 py-4">Loading activity statements...</p>
          ) : (
            <ActivityStatementsList statements={activityStatements} />
          )}
        </TabPanel>
        <TabPanel tabId="tax-rates">
          <TaxRateList />
        </TabPanel>
      </Tabs>
    </PageContainer>
  );
}
