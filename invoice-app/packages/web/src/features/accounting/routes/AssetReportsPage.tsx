import { useMemo } from 'react';
import { PageContainer } from '../../../components/layout/PageContainer';
import { Tabs, TabList, Tab, TabPanel } from '../../../components/ui/Tabs';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '../../../components/ui/Table';
import { useFixedAssets } from '../hooks/useFixedAssets';
import type { FixedAsset } from '../hooks/useFixedAssets';
import { DepreciationRunner } from '../components/DepreciationRunner';
import { useRunDepreciation } from '../hooks/useDepreciation';

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-NZ', {
    style: 'currency',
    currency: 'NZD',
  }).format(amount);
}

function RegisterTab({ assets, isLoading }: { assets: FixedAsset[]; isLoading: boolean }) {
  if (isLoading) {
    return (
      <div className="py-8 text-center text-gray-500" data-testid="register-loading">
        Loading asset register...
      </div>
    );
  }

  if (assets.length === 0) {
    return (
      <div className="py-8 text-center text-gray-500" data-testid="register-empty">
        No fixed assets found.
      </div>
    );
  }

  return (
    <Table data-testid="register-table">
      <TableHeader>
        <TableRow>
          <TableHead>Asset #</TableHead>
          <TableHead>Name</TableHead>
          <TableHead>Purchase Date</TableHead>
          <TableHead className="text-right">Purchase Price</TableHead>
          <TableHead>Method</TableHead>
          <TableHead>Rate</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Current Value</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {assets.map((asset) => (
          <TableRow key={asset.id} data-testid={`register-row-${asset.id}`}>
            <TableCell className="text-gray-500">{asset.assetNumber}</TableCell>
            <TableCell className="font-medium">{asset.name}</TableCell>
            <TableCell className="text-gray-500">{asset.purchaseDate}</TableCell>
            <TableCell className="text-right">{formatCurrency(asset.purchasePrice)}</TableCell>
            <TableCell className="text-gray-500">
              {asset.depreciationMethod === 'straight_line' ? 'Straight Line' : 'Diminishing Value'}
            </TableCell>
            <TableCell className="text-gray-500">{asset.depreciationRate}%</TableCell>
            <TableCell>
              <span
                className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                  asset.status === 'registered'
                    ? 'bg-blue-50 text-blue-700'
                    : asset.status === 'sold'
                      ? 'bg-green-50 text-green-700'
                      : 'bg-gray-100 text-gray-500'
                }`}
              >
                {asset.status.charAt(0).toUpperCase() + asset.status.slice(1)}
              </span>
            </TableCell>
            <TableCell className="text-right">{formatCurrency(asset.currentValue)}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function DepreciationScheduleTab({ assets, isLoading }: { assets: FixedAsset[]; isLoading: boolean }) {
  const registeredAssets = useMemo(
    () => assets.filter((a) => a.status === 'registered'),
    [assets],
  );

  if (isLoading) {
    return (
      <div className="py-8 text-center text-gray-500" data-testid="schedule-loading">
        Loading depreciation schedule...
      </div>
    );
  }

  if (registeredAssets.length === 0) {
    return (
      <div className="py-8 text-center text-gray-500" data-testid="schedule-empty">
        No registered assets to depreciate.
      </div>
    );
  }

  return (
    <Table data-testid="schedule-table">
      <TableHeader>
        <TableRow>
          <TableHead>Asset</TableHead>
          <TableHead>Method</TableHead>
          <TableHead className="text-right">Purchase Price</TableHead>
          <TableHead className="text-right">Accumulated</TableHead>
          <TableHead className="text-right">Current Value</TableHead>
          <TableHead className="text-right">Monthly Amount</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {registeredAssets.map((asset) => {
          const monthly =
            asset.depreciationMethod === 'straight_line'
              ? (asset.purchasePrice * asset.depreciationRate) / 100 / 12
              : (asset.currentValue * asset.depreciationRate) / 100 / 12;

          return (
            <TableRow key={asset.id} data-testid={`schedule-row-${asset.id}`}>
              <TableCell className="font-medium">{asset.name}</TableCell>
              <TableCell className="text-gray-500">
                {asset.depreciationMethod === 'straight_line' ? 'SL' : 'DV'} @{' '}
                {asset.depreciationRate}%
              </TableCell>
              <TableCell className="text-right">{formatCurrency(asset.purchasePrice)}</TableCell>
              <TableCell className="text-right">
                {formatCurrency(asset.accumulatedDepreciation)}
              </TableCell>
              <TableCell className="text-right">{formatCurrency(asset.currentValue)}</TableCell>
              <TableCell className="text-right">
                {formatCurrency(Math.round(monthly * 100) / 100)}
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}

function ReconciliationTab({ assets, isLoading }: { assets: FixedAsset[]; isLoading: boolean }) {
  const totals = useMemo(() => {
    let totalPurchase = 0;
    let totalDepreciation = 0;
    let totalCurrent = 0;

    for (const asset of assets) {
      totalPurchase += asset.purchasePrice;
      totalDepreciation += asset.accumulatedDepreciation;
      totalCurrent += asset.currentValue;
    }

    return {
      purchase: totalPurchase,
      depreciation: totalDepreciation,
      current: totalCurrent,
      variance: totalPurchase - totalDepreciation - totalCurrent,
    };
  }, [assets]);

  if (isLoading) {
    return (
      <div className="py-8 text-center text-gray-500" data-testid="reconciliation-loading">
        Loading reconciliation...
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="reconciliation-panel">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-lg border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Total Purchase Cost</p>
          <p className="text-lg font-semibold" data-testid="total-purchase">
            {formatCurrency(totals.purchase)}
          </p>
        </div>
        <div className="rounded-lg border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Total Depreciation</p>
          <p className="text-lg font-semibold" data-testid="total-depreciation-recon">
            {formatCurrency(totals.depreciation)}
          </p>
        </div>
        <div className="rounded-lg border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Total Book Value</p>
          <p className="text-lg font-semibold" data-testid="total-book-value">
            {formatCurrency(totals.current)}
          </p>
        </div>
        <div className="rounded-lg border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Variance</p>
          <p
            className={`text-lg font-semibold ${
              Math.abs(totals.variance) > 0.01 ? 'text-red-600' : 'text-green-600'
            }`}
            data-testid="variance"
          >
            {formatCurrency(totals.variance)}
          </p>
        </div>
      </div>

      <Table data-testid="reconciliation-table">
        <TableHeader>
          <TableRow>
            <TableHead>Asset</TableHead>
            <TableHead className="text-right">Purchase Price</TableHead>
            <TableHead className="text-right">Depreciation</TableHead>
            <TableHead className="text-right">Book Value</TableHead>
            <TableHead className="text-right">Variance</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {assets.map((asset) => {
            const v = asset.purchasePrice - asset.accumulatedDepreciation - asset.currentValue;
            return (
              <TableRow key={asset.id}>
                <TableCell className="font-medium">{asset.name}</TableCell>
                <TableCell className="text-right">{formatCurrency(asset.purchasePrice)}</TableCell>
                <TableCell className="text-right">
                  {formatCurrency(asset.accumulatedDepreciation)}
                </TableCell>
                <TableCell className="text-right">{formatCurrency(asset.currentValue)}</TableCell>
                <TableCell
                  className={`text-right ${Math.abs(v) > 0.01 ? 'text-red-600' : 'text-green-600'}`}
                >
                  {formatCurrency(v)}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}

export function AssetReportsPage() {
  const { data: assets = [], isLoading } = useFixedAssets();
  const runDepreciation = useRunDepreciation();

  const handleRunDepreciation = (period: string, entries: Parameters<typeof runDepreciation.mutate>[0]['entries']) => {
    runDepreciation.mutate({ period, entries });
  };

  return (
    <PageContainer
      title="Asset Reports"
      breadcrumbs={[
        { label: 'Accounting', href: '/accounting' },
        { label: 'Fixed Assets', href: '/accounting/fixed-assets' },
        { label: 'Reports' },
      ]}
      actions={
        <DepreciationRunner
          assets={assets}
          onRun={handleRunDepreciation}
          isRunning={runDepreciation.isPending}
        />
      }
    >
      <Tabs defaultTab="register">
        <TabList>
          <Tab tabId="register" data-testid="tab-register">Register</Tab>
          <Tab tabId="schedule" data-testid="tab-schedule">Depreciation Schedule</Tab>
          <Tab tabId="reconciliation" data-testid="tab-reconciliation">Reconciliation</Tab>
        </TabList>

        <TabPanel tabId="register">
          <RegisterTab assets={assets} isLoading={isLoading} />
        </TabPanel>

        <TabPanel tabId="schedule">
          <DepreciationScheduleTab assets={assets} isLoading={isLoading} />
        </TabPanel>

        <TabPanel tabId="reconciliation">
          <ReconciliationTab assets={assets} isLoading={isLoading} />
        </TabPanel>
      </Tabs>
    </PageContainer>
  );
}
