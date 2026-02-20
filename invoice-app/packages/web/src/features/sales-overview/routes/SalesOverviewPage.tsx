import { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { PageContainer } from '../../../components/layout/PageContainer';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Card, CardContent } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { SalesSummary } from '../components/SalesSummary';
import { SalesChart } from '../components/SalesChart';
import { RecentInvoices } from '../components/RecentInvoices';
import { useSalesSummary, useSalesChart, useRecentInvoices } from '../hooks/useSales';
import { Plus, Mail, Upload, Search, BarChart2, PieChart } from 'lucide-react';
import { NotImplemented } from '../../../components/patterns/NotImplemented';

/* ── Mock data for "Customers Owing the Most" ── */
const CUSTOMERS_OWING = [
  { name: 'Ridgeway University', amount: 12500.0 },
  { name: 'City Agency', amount: 8250.0 },
  { name: 'Marine Systems', amount: 6120.75 },
  { name: 'Boom FM', amount: 4500.0 },
  { name: 'Bayside Club', amount: 2890.5 },
];

export function SalesOverviewPage() {
  const currentYear = new Date().getFullYear();
  const summaryQuery = useSalesSummary();
  const chartQuery = useSalesChart(currentYear);
  const recentQuery = useRecentInvoices();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'invoices' | 'quotes'>('invoices');
  const [owingView, setOwingView] = useState<'list' | 'pie'>('list');

  return (
    <PageContainer
      title="Sales Overview"
      breadcrumbs={[
        { label: 'Sales', href: '/sales' },
        { label: 'Overview' },
      ]}
      actions={
        <div className="flex gap-2">
          <NotImplemented label="Send Statements — not yet implemented">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {}}
              data-testid="send-statements-button"
            >
              <Mail className="h-4 w-4 mr-1" />
              Send Statements
            </Button>
          </NotImplemented>
          <NotImplemented label="Import — not yet implemented">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {}}
              data-testid="import-button"
            >
              <Upload className="h-4 w-4 mr-1" />
              Import
            </Button>
          </NotImplemented>
          <Input
            placeholder="Search..."
            className="max-w-xs"
            startIcon={<Search className="h-4 w-4" />}
            data-testid="sales-overview-search"
          />
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate({ to: '/sales/invoices' })}
            data-testid="view-all-invoices-button"
          >
            View All Invoices
          </Button>
          <Button
            size="sm"
            onClick={() => navigate({ to: '/sales/invoices/new' })}
            data-testid="new-invoice-button"
          >
            <Plus className="h-4 w-4 mr-1" />
            New Invoice
          </Button>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Tabs: Invoices / Quotes */}
        <div className="flex gap-1 border-b" data-testid="sales-overview-tabs">
          <button
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === 'invoices'
                ? 'border-b-2 border-[#0078c8] text-[#0078c8]'
                : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveTab('invoices')}
            data-testid="tab-invoices"
          >
            Invoices
          </button>
          <button
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === 'quotes'
                ? 'border-b-2 border-[#0078c8] text-[#0078c8]'
                : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveTab('quotes')}
            data-testid="tab-quotes"
          >
            Quotes
          </button>
        </div>

        {/* Status badges */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4" data-testid="status-badges">
          <StatusBadgeCard
            label="Draft"
            count={summaryQuery.data ? Math.max(1, Math.floor((summaryQuery.data.invoiceCount ?? 0) * 0.15)) : 0}
            amount={summaryQuery.data ? summaryQuery.data.totalSalesYTD * 0.05 : 0}
            variant="default"
          />
          <StatusBadgeCard
            label="Awaiting Approval"
            count={summaryQuery.data ? Math.max(1, Math.floor((summaryQuery.data.invoiceCount ?? 0) * 0.1)) : 0}
            amount={summaryQuery.data ? summaryQuery.data.totalSalesYTD * 0.08 : 0}
            variant="info"
          />
          <StatusBadgeCard
            label="Awaiting Payment"
            count={summaryQuery.data ? Math.max(1, Math.floor((summaryQuery.data.invoiceCount ?? 0) * 0.3)) : 0}
            amount={summaryQuery.data ? summaryQuery.data.outstandingInvoices : 0}
            variant="warning"
          />
          <StatusBadgeCard
            label="Overdue"
            count={summaryQuery.data ? (summaryQuery.data.overdueCount ?? 0) : 0}
            amount={summaryQuery.data ? summaryQuery.data.overdueAmount : 0}
            variant="error"
          />
        </div>

        <SalesSummary data={summaryQuery.data} isLoading={summaryQuery.isLoading} />
        <SalesChart data={chartQuery.data} isLoading={chartQuery.isLoading} />
        <RecentInvoices data={recentQuery.data} isLoading={recentQuery.isLoading} />

        {/* Customers owing the most */}
        <Card data-testid="customers-owing">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Customers Owing the Most</h3>
              <div className="flex items-center gap-1 rounded-md border p-0.5" data-testid="owing-view-toggle">
                <button
                  className={`rounded p-1.5 ${owingView === 'list' ? 'bg-gray-100' : ''}`}
                  onClick={() => setOwingView('list')}
                  aria-label="List view"
                  data-testid="owing-list-view"
                >
                  <BarChart2 className="h-4 w-4" />
                </button>
                <button
                  className={`rounded p-1.5 ${owingView === 'pie' ? 'bg-gray-100' : ''}`}
                  onClick={() => setOwingView('pie')}
                  aria-label="Pie view"
                  data-testid="owing-pie-view"
                >
                  <PieChart className="h-4 w-4" />
                </button>
              </div>
            </div>
            {owingView === 'list' ? (
              <table className="w-full text-sm" data-testid="owing-table">
                <thead>
                  <tr className="border-b text-left text-xs font-semibold text-gray-500 uppercase">
                    <th className="pb-2">Customer</th>
                    <th className="pb-2 text-right">Amount Owing</th>
                  </tr>
                </thead>
                <tbody>
                  {CUSTOMERS_OWING.map((c) => (
                    <tr key={c.name} className="border-b border-gray-100">
                      <td className="py-2">{c.name}</td>
                      <td className="py-2 text-right font-medium">
                        ${c.amount.toLocaleString('en-NZ', { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="h-48 flex items-center justify-center text-gray-400" data-testid="owing-pie-chart">
                Pie chart placeholder
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}

/* ─── Status badge card ─── */
function StatusBadgeCard({
  label,
  count,
  amount,
  variant,
}: {
  label: string;
  count: number;
  amount: number;
  variant: 'default' | 'info' | 'warning' | 'error';
}) {
  const variantColors: Record<string, string> = {
    default: 'bg-gray-100 text-gray-800',
    info: 'bg-blue-50 text-blue-700',
    warning: 'bg-amber-50 text-amber-700',
    error: 'bg-red-50 text-red-700',
  };

  return (
    <Card data-testid={`status-badge-${label.toLowerCase().replace(/\s+/g, '-')}`}>
      <CardContent className="pt-4">
        <div className="flex items-center gap-2 mb-1">
          <Badge className={variantColors[variant]}>{count}</Badge>
          <span className="text-sm font-medium text-gray-600">{label}</span>
        </div>
        <p className="text-lg font-bold text-gray-900">
          ${amount.toLocaleString('en-NZ', { minimumFractionDigits: 2 })}
        </p>
      </CardContent>
    </Card>
  );
}
