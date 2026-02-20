import { useMemo } from 'react';
import { Card, CardContent } from '../../../components/ui/Card';
import { useStaffTimeOverview } from '../hooks/useStaffTimeOverview';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

export function StaffTimeOverviewPage() {
  const { data, isLoading } = useStaffTimeOverview();

  const grid = useMemo(() => {
    if (!data) return null;
    const { entries, staffNames, projectNames } = data;

    // Build lookup: projectName -> staffName -> hours
    const lookup = new Map<string, Map<string, number>>();
    for (const entry of entries) {
      if (!lookup.has(entry.projectName)) {
        lookup.set(entry.projectName, new Map());
      }
      const staffMap = lookup.get(entry.projectName)!;
      staffMap.set(entry.staffName, (staffMap.get(entry.staffName) ?? 0) + entry.totalHours);
    }

    return { lookup, staffNames, projectNames };
  }, [data]);

  // Compute staff-level chargeable vs non-chargeable
  const staffMetrics = useMemo(() => {
    if (!data) return [];
    const staffMap = new Map<string, { chargeable: number; nonChargeable: number; totalHours: number }>();
    for (const entry of data.entries) {
      const existing = staffMap.get(entry.staffName) ?? { chargeable: 0, nonChargeable: 0, totalHours: 0 };
      // Mock: assume 70% chargeable split
      const chargeable = entry.totalHours * 0.7;
      const nonChargeable = entry.totalHours * 0.3;
      existing.chargeable += chargeable;
      existing.nonChargeable += nonChargeable;
      existing.totalHours += entry.totalHours;
      staffMap.set(entry.staffName, existing);
    }
    return Array.from(staffMap.entries()).map(([name, metrics]) => ({
      name,
      ...metrics,
    }));
  }, [data]);

  if (isLoading) {
    return (
      <div className="p-6" data-testid="staff-time-loading">
        <p className="text-gray-500">Loading staff time overview...</p>
      </div>
    );
  }

  if (!data || !grid) {
    return (
      <div className="p-6">
        <p className="text-gray-500">No staff time data available.</p>
      </div>
    );
  }

  const { lookup, staffNames, projectNames } = grid;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold text-[#1a1a2e] mb-6">Staff Time Overview</h1>

      {/* Horizontal bar chart: chargeable vs non-chargeable */}
      {staffMetrics.length > 0 && (
        <div className="mb-8" data-testid="staff-chargeable-chart">
          <h2 className="text-sm font-semibold text-[#1a1a2e] mb-3">Chargeable vs Non-chargeable</h2>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={staffMetrics}
                layout="vertical"
                margin={{ top: 5, right: 30, left: 80, bottom: 5 }}
              >
                <XAxis type="number" tick={{ fontSize: 11, fill: '#6b7280' }} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: '#1a1a2e' }} width={75} />
                <Tooltip
                  formatter={(value: number) => [`${value.toFixed(1)}h`, undefined]}
                  contentStyle={{ borderRadius: '6px', border: '1px solid #e5e7eb', fontSize: '12px' }}
                />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                <Bar dataKey="chargeable" name="Chargeable" fill="#14b8a6" stackId="a" />
                <Bar dataKey="nonChargeable" name="Non-chargeable" fill="#94a3b8" stackId="a" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Staff cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8" data-testid="staff-cards">
        {staffMetrics.map((staff) => (
          <Card key={staff.name} data-testid={`staff-card-${staff.name.toLowerCase().replace(/\s+/g, '-')}`}>
            <CardContent>
              <div className="flex items-center gap-3 py-1">
                <div className="h-10 w-10 rounded-full bg-[#0078c8]/10 flex items-center justify-center text-[#0078c8] text-sm font-bold">
                  {staff.name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-[#1a1a2e]">{staff.name}</p>
                  <div className="flex gap-3 text-xs text-[#6b7280] mt-0.5">
                    <span>{staff.totalHours.toFixed(1)}h total</span>
                    <span>{staff.chargeable.toFixed(1)}h chargeable</span>
                    <span>{((staff.chargeable / staff.totalHours) * 100).toFixed(0)}% utilization</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Data grid */}
      <div className="overflow-auto rounded-lg border border-[#e5e7eb]" data-testid="staff-time-grid">
        <table className="w-full text-sm">
          <thead className="bg-[#f8f9fa]">
            <tr>
              <th className="px-4 py-3 text-left font-semibold text-[#6b7280] border-b border-[#e5e7eb]">
                Project
              </th>
              {staffNames.map((name) => (
                <th
                  key={name}
                  className="px-4 py-3 text-right font-semibold text-[#6b7280] border-b border-[#e5e7eb]"
                >
                  {name}
                </th>
              ))}
              <th className="px-4 py-3 text-right font-semibold text-[#1a1a2e] border-b border-[#e5e7eb]">
                Total
              </th>
            </tr>
          </thead>
          <tbody>
            {projectNames.map((projectName) => {
              const staffMap = lookup.get(projectName) ?? new Map();
              const total = Array.from(staffMap.values()).reduce((s, h) => s + h, 0);
              return (
                <tr key={projectName} className="border-b border-[#e5e7eb] hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-[#1a1a2e]">{projectName}</td>
                  {staffNames.map((name) => (
                    <td key={name} className="px-4 py-3 text-right text-[#1a1a2e]">
                      {staffMap.get(name) ?? '-'}
                    </td>
                  ))}
                  <td className="px-4 py-3 text-right font-semibold text-[#1a1a2e]">{total}</td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="bg-[#f8f9fa]">
              <td className="px-4 py-3 font-semibold text-[#1a1a2e]">Total</td>
              {staffNames.map((name) => {
                const staffTotal = Array.from(lookup.values()).reduce(
                  (sum, m) => sum + (m.get(name) ?? 0),
                  0,
                );
                return (
                  <td key={name} className="px-4 py-3 text-right font-semibold text-[#1a1a2e]">
                    {staffTotal}
                  </td>
                );
              })}
              <td className="px-4 py-3 text-right font-bold text-[#1a1a2e]" data-testid="grand-total">
                {data.grandTotal}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
