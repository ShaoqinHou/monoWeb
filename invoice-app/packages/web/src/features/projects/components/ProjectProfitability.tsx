import { useProjectProfitability } from '../hooks/useProjectProfitability';

interface ProjectProfitabilityProps {
  projectId: string;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-NZ', {
    style: 'currency',
    currency: 'NZD',
    minimumFractionDigits: 2,
  }).format(amount);
}

export function ProjectProfitability({ projectId }: ProjectProfitabilityProps) {
  const { data, isLoading } = useProjectProfitability(projectId);

  if (isLoading || !data) {
    return (
      <div data-testid="profitability-loading" className="p-4 text-sm text-gray-500">
        Loading profitability data...
      </div>
    );
  }

  const maxBarValue = Math.max(data.totalRevenue, data.totalCost, 1);

  return (
    <div data-testid="project-profitability" className="rounded-lg border border-gray-200 bg-white p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Project Profitability</h3>

      {/* Summary metrics */}
      <div className="grid grid-cols-2 gap-4 mb-6 sm:grid-cols-4">
        <div data-testid="metric-revenue" className="text-center">
          <div className="text-xs text-gray-500 uppercase tracking-wide">Total Revenue</div>
          <div className="text-lg font-semibold text-gray-900 mt-1">{formatCurrency(data.totalRevenue)}</div>
        </div>
        <div data-testid="metric-cost" className="text-center">
          <div className="text-xs text-gray-500 uppercase tracking-wide">Total Cost</div>
          <div className="text-lg font-semibold text-gray-900 mt-1">{formatCurrency(data.totalCost)}</div>
        </div>
        <div data-testid="metric-profit" className="text-center">
          <div className="text-xs text-gray-500 uppercase tracking-wide">Profit</div>
          <div
            className={`text-lg font-semibold mt-1 ${data.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}
          >
            {formatCurrency(data.profit)}
          </div>
        </div>
        <div data-testid="metric-margin" className="text-center">
          <div className="text-xs text-gray-500 uppercase tracking-wide">Profit Margin</div>
          <div
            className={`text-lg font-semibold mt-1 ${data.margin >= 0 ? 'text-green-600' : 'text-red-600'}`}
          >
            {data.margin.toFixed(1)}%
          </div>
        </div>
      </div>

      {/* Revenue vs Cost bars */}
      <div className="mb-6">
        <h4 className="text-sm font-medium text-gray-700 mb-2">Revenue vs Cost</h4>
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-500 w-16">Revenue</span>
            <div className="flex-1 h-6 bg-gray-100 rounded overflow-hidden">
              <div
                data-testid="revenue-bar"
                className="h-full bg-[#0078c8] rounded transition-all"
                style={{ width: `${(data.totalRevenue / maxBarValue) * 100}%` }}
              />
            </div>
            <span className="text-xs font-medium text-gray-700 w-24 text-right">
              {formatCurrency(data.totalRevenue)}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-500 w-16">Cost</span>
            <div className="flex-1 h-6 bg-gray-100 rounded overflow-hidden">
              <div
                data-testid="cost-bar"
                className="h-full bg-[#ef4444] rounded transition-all"
                style={{ width: `${(data.totalCost / maxBarValue) * 100}%` }}
              />
            </div>
            <span className="text-xs font-medium text-gray-700 w-24 text-right">
              {formatCurrency(data.totalCost)}
            </span>
          </div>
        </div>
      </div>

      {/* Monthly breakdown table */}
      <div>
        <h4 className="text-sm font-medium text-gray-700 mb-2">Monthly Breakdown</h4>
        <table data-testid="monthly-table" className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-2 font-medium text-gray-500">Month</th>
              <th className="text-right py-2 font-medium text-gray-500">Revenue</th>
              <th className="text-right py-2 font-medium text-gray-500">Cost</th>
              <th className="text-right py-2 font-medium text-gray-500">Profit</th>
            </tr>
          </thead>
          <tbody>
            {data.monthlyBreakdown.map((row) => (
              <tr key={row.month} className="border-b border-gray-100">
                <td className="py-2 text-gray-700">{row.month}</td>
                <td className="py-2 text-right text-gray-700">{formatCurrency(row.revenue)}</td>
                <td className="py-2 text-right text-gray-700">{formatCurrency(row.cost)}</td>
                <td
                  className={`py-2 text-right font-medium ${row.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}
                >
                  {formatCurrency(row.profit)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
