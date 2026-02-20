import { useState, useCallback, useMemo } from 'react';
import { PageContainer } from '../../../components/layout/PageContainer';
import { Button } from '../../../components/ui/Button';
import { Select } from '../../../components/ui/Select';
import { Card, CardHeader, CardContent } from '../../../components/ui/Card';
import { Input } from '../../../components/ui/Input';
import { TimesheetGrid } from '../components/TimesheetGrid';
import { useTimesheets, useUpdateTimesheet } from '../hooks/useTimesheets';
import type { UpdateTimesheetInput } from '../hooks/useTimesheets';

function getMonday(date: Date): string {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  return d.toISOString().split('T')[0];
}

function getWeekEndingLabel(weekStart: string): string {
  const d = new Date(weekStart);
  d.setDate(d.getDate() + 6);
  return `Week ending ${d.toLocaleDateString('en-NZ', { day: 'numeric', month: 'short', year: 'numeric' })}`;
}

const PAY_FREQUENCY_OPTIONS = [
  { value: 'weekly', label: 'Weekly' },
  { value: 'fortnightly', label: 'Fortnightly' },
  { value: 'monthly', label: 'Monthly' },
];

const EMPLOYEE_CATEGORIES = [
  { key: 'salaried', label: 'Salaried Employees', count: 3 },
  { key: 'hourly', label: 'Hourly Employees', count: 2 },
  { key: 'contractor', label: 'Contractors', count: 1 },
];

export function TimesheetsPage() {
  const [weekStart, setWeekStart] = useState(() => getMonday(new Date()));
  const [payFrequency, setPayFrequency] = useState('weekly');
  const { data: entries, isLoading } = useTimesheets(weekStart);
  const updateTimesheet = useUpdateTimesheet();

  const handlePrevWeek = () => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() - 7);
    setWeekStart(d.toISOString().split('T')[0]);
  };

  const handleNextWeek = () => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + 7);
    setWeekStart(d.toISOString().split('T')[0]);
  };

  const handleChange = useCallback(
    (id: string, updates: UpdateTimesheetInput) => {
      updateTimesheet.mutate({ id, updates });
    },
    [updateTimesheet],
  );

  const handleSubmitAll = () => {
    if (!entries) return;
    for (const entry of entries) {
      if (entry.status === 'draft') {
        updateTimesheet.mutate({ id: entry.id, updates: { status: 'submitted' } });
      }
    }
  };

  const handleApproveAll = () => {
    if (!entries) return;
    for (const entry of entries) {
      if (entry.status === 'submitted') {
        updateTimesheet.mutate({ id: entry.id, updates: { status: 'approved' } });
      }
    }
  };

  const unsubmittedCount = useMemo(
    () => (entries ?? []).filter((e) => e.status === 'draft').length,
    [entries],
  );

  const weekEndingLabel = getWeekEndingLabel(weekStart);

  // Build pay period options (current + previous 3 weeks)
  const payPeriodOptions = useMemo(() => {
    const options = [];
    for (let i = 0; i < 4; i++) {
      const d = new Date(weekStart);
      d.setDate(d.getDate() - i * 7);
      const ws = d.toISOString().split('T')[0];
      options.push({ value: ws, label: getWeekEndingLabel(ws) });
    }
    return options;
  }, [weekStart]);

  return (
    <PageContainer
      title="Timesheets"
      breadcrumbs={[{ label: 'Payroll', href: '/payroll' }, { label: 'Timesheets' }]}
      actions={
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleSubmitAll}>
            Submit All
          </Button>
          <Button size="sm" onClick={handleApproveAll}>
            Approve All
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        {/* Pay frequency and period selectors */}
        <div className="flex items-end gap-4 flex-wrap" data-testid="timesheet-selectors">
          <div className="w-44">
            <Select
              label="Pay frequency"
              options={PAY_FREQUENCY_OPTIONS}
              value={payFrequency}
              onChange={(e) => setPayFrequency(e.target.value)}
              data-testid="pay-frequency-selector"
              aria-label="Pay frequency"
            />
          </div>
          <div className="w-64">
            <Select
              label="Pay period"
              options={payPeriodOptions}
              value={weekStart}
              onChange={(e) => setWeekStart(e.target.value)}
              data-testid="pay-period-selector"
              aria-label="Pay period"
            />
          </div>
        </div>

        {/* Date range selector */}
        <div className="flex items-center gap-3" data-testid="week-selector">
          <Button variant="ghost" size="sm" onClick={handlePrevWeek} aria-label="Previous week">
            &larr;
          </Button>
          <Input
            type="date"
            value={weekStart}
            onChange={(e) => setWeekStart(e.target.value)}
            aria-label="Week start date"
            className="w-44"
          />
          <Button variant="ghost" size="sm" onClick={handleNextWeek} aria-label="Next week">
            &rarr;
          </Button>
          <span className="text-sm text-[#6b7280] ml-2" data-testid="week-ending-label">{weekEndingLabel}</span>
        </div>

        {/* Employee category cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4" data-testid="employee-category-cards">
          {EMPLOYEE_CATEGORIES.map((cat) => (
            <Card key={cat.key} data-testid={`category-card-${cat.key}`}>
              <CardHeader>
                <h3 className="text-sm font-semibold text-[#1a1a2e]">{cat.label}</h3>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-[#6b7280] mb-3">{cat.count} employees</p>
                <Button size="sm" variant="outline" data-testid={`create-timesheet-${cat.key}`}>
                  Create timesheet
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Unsubmitted section */}
        {unsubmittedCount > 0 && (
          <div data-testid="unsubmitted-section">
            <h3 className="text-sm font-semibold text-[#1a1a2e] mb-2">
              Unsubmitted ({unsubmittedCount})
            </h3>
          </div>
        )}

        {isLoading ? (
          <div className="text-[#6b7280]" data-testid="timesheets-loading">Loading timesheets...</div>
        ) : (
          <TimesheetGrid
            entries={entries ?? []}
            weekStart={weekStart}
            onChange={handleChange}
          />
        )}
      </div>
    </PageContainer>
  );
}
