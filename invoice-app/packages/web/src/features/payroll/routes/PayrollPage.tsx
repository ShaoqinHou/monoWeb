import { useState, useMemo } from 'react';
import { useParams, useNavigate } from '@tanstack/react-router';
import { showToast } from '../../dashboard/components/ToastContainer';
import { PageContainer } from '../../../components/layout/PageContainer';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { Dialog } from '../../../components/ui/Dialog';
import { Input } from '../../../components/ui/Input';
import { Card, CardHeader, CardContent } from '../../../components/ui/Card';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '../../../components/ui/Table';
import { PayrollSummary } from '../components/PayrollSummary';
import { PayRunCard } from '../components/PayRunCard';
import { EmployeeList } from '../components/EmployeeList';
import { EmployeeDetail } from '../components/EmployeeDetail';
import { PayRunList } from '../components/PayRunList';
import { PayRunDetail } from '../components/PayRunDetail';
import { NewPayRunForm } from '../components/NewPayRunForm';
import {
  useEmployees,
  useEmployee,
  usePayRuns,
  usePayRun,
  usePayrollSummary,
  useDeleteEmployee,
  useCreatePayRun,
  usePostPayRun,
} from '../hooks/usePayroll';
import { useLeaveRequests } from '../hooks/useLeaveRequests';
import type { LeaveRequest } from '../hooks/useLeaveRequests';
import type { CreatePayRunInput, LeaveToApprove } from '../types';
import { NotImplemented } from '../../../components/patterns/NotImplemented';

// ─── PayrollCalendarWidget ───────────────────────────────────────────────────

function PayrollCalendarWidget({ payRunDate }: { payRunDate: string }) {
  const date = new Date(payRunDate + 'T00:00:00');
  const year = date.getFullYear();
  const month = date.getMonth();
  const payDay = date.getDate();
  const monthName = date.toLocaleDateString('en-NZ', { month: 'long', year: 'numeric' });

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const dayLabels = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  return (
    <Card data-testid="payroll-calendar">
      <CardHeader>
        <h3 className="text-sm font-semibold text-[#1a1a2e]">{monthName}</h3>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-7 gap-1 text-xs text-center">
          {dayLabels.map((d) => (
            <div key={d} className="font-medium text-[#6b7280] py-1">{d}</div>
          ))}
          {cells.map((day, i) => (
            <div
              key={i}
              className={`py-1 rounded ${
                day === payDay
                  ? 'bg-[#0078c8] text-white font-bold'
                  : day
                    ? 'text-[#1a1a2e]'
                    : ''
              }`}
              data-testid={day === payDay ? 'pay-run-day-marker' : undefined}
            >
              {day ?? ''}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// ─── LeaveToApproveTable ────────────────────────────────────────────────────

const STATUS_VARIANTS: Record<string, 'default' | 'success' | 'warning' | 'error'> = {
  pending: 'warning',
  approved: 'success',
  declined: 'error',
};

const LEAVE_TYPE_LABELS: Record<string, string> = {
  annual: 'Annual Leave',
  sick: 'Sick Leave',
  bereavement: 'Bereavement Leave',
  parental: 'Parental Leave',
  unpaid: 'Unpaid Leave',
};

function formatLeavePeriod(startDate: string, endDate: string): string {
  const start = new Date(startDate + 'T00:00:00');
  const end = new Date(endDate + 'T00:00:00');
  const formatOpts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short', year: 'numeric' };
  const startStr = start.toLocaleDateString('en-NZ', formatOpts);
  const endStr = end.toLocaleDateString('en-NZ', formatOpts);
  if (startDate === endDate) return startStr;
  return `${startStr} - ${endStr}`;
}

function mapLeaveRequestToApproveItem(req: LeaveRequest): LeaveToApprove {
  return {
    id: req.id,
    employee: req.employeeName,
    leaveType: LEAVE_TYPE_LABELS[req.leaveType] ?? req.leaveType,
    leavePeriod: formatLeavePeriod(req.startDate, req.endDate),
    status: req.status,
  };
}

function LeaveToApproveTable({ items }: { items: LeaveToApprove[] }) {
  if (items.length === 0) {
    return <p className="text-sm text-[#6b7280]">No leave requests to approve.</p>;
  }

  return (
    <Table data-testid="leave-to-approve-table">
      <TableHeader>
        <TableRow>
          <TableHead>Employee</TableHead>
          <TableHead>Leave Type</TableHead>
          <TableHead>Leave Period</TableHead>
          <TableHead>Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.map((item) => (
          <TableRow key={item.id}>
            <TableCell className="font-medium">{item.employee}</TableCell>
            <TableCell>{item.leaveType}</TableCell>
            <TableCell>{item.leavePeriod}</TableCell>
            <TableCell>
              <Badge variant={STATUS_VARIANTS[item.status] ?? 'default'}>
                {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
              </Badge>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

// ─── PayrollOverviewPage ─────────────────────────────────────────────────────

export function PayrollOverviewPage() {
  const navigate = useNavigate();
  const { data: summary, isLoading: summaryLoading } = usePayrollSummary();
  const { data: payRuns, isLoading: payRunsLoading } = usePayRuns();
  const { data: leaveRequests, isLoading: leaveLoading } = useLeaveRequests();

  const recentPayRuns = payRuns?.slice(0, 3) ?? [];

  const leaveToApprove = useMemo(() => {
    if (!leaveRequests) return [];
    return leaveRequests
      .filter((req) => req.status === 'pending' || req.status === 'approved')
      .map(mapLeaveRequestToApproveItem);
  }, [leaveRequests]);

  if (summaryLoading || payRunsLoading) {
    return (
      <PageContainer title="Payroll">
        <div className="text-[#6b7280]" data-testid="payroll-loading">Loading payroll data...</div>
      </PageContainer>
    );
  }

  return (
    <PageContainer
      title="Payroll"
      actions={
        <div className="flex gap-2">
          <NotImplemented label="New task — not yet implemented">
            <Button variant="outline" size="sm" data-testid="new-task-btn" onClick={() => {}}>
              New task
            </Button>
          </NotImplemented>
          <Button variant="outline" size="sm" onClick={() => navigate({ to: '/payroll/employees' })}>
            Add Employee
          </Button>
          <Button size="sm" onClick={() => navigate({ to: '/payroll/pay-runs' })}>New Pay Run</Button>
        </div>
      }
    >
      <div className="space-y-6">
        {summary && <PayrollSummary summary={summary} />}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Calendar widget */}
          <div className="lg:col-span-1">
            {summary?.nextPayRunDate && (
              <PayrollCalendarWidget payRunDate={summary.nextPayRunDate} />
            )}
          </div>

          {/* Leave to Approve */}
          <div className="lg:col-span-2">
            <h2 className="text-lg font-semibold text-[#1a1a2e] mb-3">Leave to Approve</h2>
            {leaveLoading ? (
              <p className="text-sm text-[#6b7280]" data-testid="leave-loading">Loading leave requests...</p>
            ) : (
              <LeaveToApproveTable items={leaveToApprove} />
            )}
          </div>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-[#1a1a2e] mb-3">Recent Pay Runs</h2>
          {recentPayRuns.length === 0 ? (
            <p className="text-[#6b7280]">No pay runs yet.</p>
          ) : (
            <div className="space-y-3">
              {recentPayRuns.map((pr) => (
                <PayRunCard key={pr.id} payRun={pr} />
              ))}
            </div>
          )}
        </div>
      </div>
    </PageContainer>
  );
}

// ─── EmployeesPage ───────────────────────────────────────────────────────────

type EmployeeTab = 'current' | 'past';

const EMPLOYEE_TABS: { key: EmployeeTab; label: string }[] = [
  { key: 'current', label: 'Current' },
  { key: 'past', label: 'Past' },
];

export function EmployeesPage() {
  const navigate = useNavigate();
  const { data: employees, isLoading } = useEmployees();
  const [showAddDropdown, setShowAddDropdown] = useState(false);
  const [activeTab, setActiveTab] = useState<EmployeeTab>('current');

  const filteredEmployees = useMemo(() => {
    const all = employees ?? [];
    if (activeTab === 'current') {
      return all.filter((emp) => emp.status === 'active');
    }
    return all.filter((emp) => emp.status === 'inactive');
  }, [employees, activeTab]);

  const currentCount = useMemo(() => (employees ?? []).filter((e) => e.status === 'active').length, [employees]);
  const pastCount = useMemo(() => (employees ?? []).filter((e) => e.status === 'inactive').length, [employees]);

  const tabCounts: Record<EmployeeTab, number> = { current: currentCount, past: pastCount };

  if (isLoading) {
    return (
      <PageContainer title="Employees" breadcrumbs={[{ label: 'Payroll', href: '/payroll' }, { label: 'Employees' }]}>
        <div className="text-[#6b7280]" data-testid="employees-loading">Loading employees...</div>
      </PageContainer>
    );
  }

  return (
    <PageContainer
      title="Employees"
      breadcrumbs={[{ label: 'Payroll', href: '/payroll' }, { label: 'Employees' }]}
      actions={
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            data-testid="end-of-year-reports-btn"
            onClick={() => navigate({ to: '/payroll/year-end' })}
          >
            End of year reports
          </Button>
          <div className="flex">
            <Button
              size="sm"
              className="rounded-r-none"
              onClick={() => navigate({ to: '/payroll/employees/new' })}
              data-testid="add-employee-btn"
            >
              Add employee
            </Button>
            <div className="relative">
              <Button
                size="sm"
                className="rounded-l-none border-l border-l-white/30 px-2"
                onClick={() => setShowAddDropdown(!showAddDropdown)}
                data-testid="add-employee-dropdown-btn"
                aria-label="Add employee options"
              >
                &#9662;
              </Button>
              {showAddDropdown && (
                <div
                  className="absolute right-0 mt-1 w-48 bg-white border border-[#e5e7eb] rounded-md shadow-lg z-10"
                  data-testid="add-employee-dropdown"
                >
                  <button
                    type="button"
                    className="w-full text-left px-4 py-2 text-sm hover:bg-[#f3f4f6]"
                    onClick={() => { setShowAddDropdown(false); navigate({ to: '/payroll/employees/new' }); }}
                  >
                    Add manually
                  </button>
                  <NotImplemented label="Import from CSV — not yet implemented">
                    <button
                      type="button"
                      className="w-full text-left px-4 py-2 text-sm hover:bg-[#f3f4f6]"
                      onClick={() => { setShowAddDropdown(false); }}
                      data-testid="import-csv-btn"
                    >
                      Import from CSV
                    </button>
                  </NotImplemented>
                </div>
              )}
            </div>
          </div>
        </div>
      }
    >
      <div className="space-y-4">
        {/* Current / Past Tabs */}
        <div className="border-b border-[#e5e7eb]" data-testid="employee-tabs">
          <nav className="flex gap-0 -mb-px" aria-label="Employee tabs">
            {EMPLOYEE_TABS.map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.key
                    ? 'border-[#0078c8] text-[#0078c8]'
                    : 'border-transparent text-[#6b7280] hover:text-[#1a1a2e] hover:border-[#d1d5db]'
                }`}
                data-testid={`employee-tab-${tab.key}`}
                aria-selected={activeTab === tab.key}
                role="tab"
              >
                {tab.label}
                <span className={`ml-1.5 inline-flex items-center justify-center px-2 py-0.5 rounded-full text-xs ${
                  activeTab === tab.key
                    ? 'bg-[#0078c8]/10 text-[#0078c8]'
                    : 'bg-[#f3f4f6] text-[#6b7280]'
                }`}>
                  {tabCounts[tab.key]}
                </span>
              </button>
            ))}
          </nav>
        </div>

        <EmployeeList employees={filteredEmployees} />
      </div>
    </PageContainer>
  );
}

// ─── EmployeeDetailPage ─────────────────────────────────────────────────────

interface EmployeeDetailPageProps {
  employeeId?: string;
  onBack?: () => void;
}

export function EmployeeDetailPage({ employeeId: employeeIdProp, onBack }: EmployeeDetailPageProps) {
  let routeEmployeeId: string | undefined;
  try {
    const params = useParams({ from: '/payroll/employees/$employeeId' });
    routeEmployeeId = params.employeeId;
  } catch {
    // Not rendered under the route — use prop fallback
  }
  const employeeId = employeeIdProp ?? routeEmployeeId ?? '';
  const navigate = useNavigate();
  const { data: employee, isLoading } = useEmployee(employeeId);
  const deleteEmployee = useDeleteEmployee();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleDelete = () => {
    deleteEmployee.mutate(employeeId, {
      onSuccess: () => {
        showToast('success', 'Employee deleted');
        setShowDeleteConfirm(false);
        if (onBack) {
          onBack();
        } else {
          navigate({ to: '/payroll/employees' });
        }
      },
      onError: (err: Error) => showToast('error', err.message || 'Failed to delete employee'),
    });
  };

  if (isLoading) {
    return (
      <PageContainer
        title="Employee"
        breadcrumbs={[
          { label: 'Payroll', href: '/payroll' },
          { label: 'Employees', href: '/payroll/employees' },
          { label: 'Loading...' },
        ]}
      >
        <div className="text-[#6b7280]" data-testid="employee-loading">Loading employee...</div>
      </PageContainer>
    );
  }

  if (!employee) {
    return (
      <PageContainer
        title="Employee Not Found"
        breadcrumbs={[
          { label: 'Payroll', href: '/payroll' },
          { label: 'Employees', href: '/payroll/employees' },
          { label: 'Not Found' },
        ]}
      >
        <div className="text-[#6b7280]">Employee not found.</div>
      </PageContainer>
    );
  }

  return (
    <PageContainer
      title={`${employee.firstName} ${employee.lastName}`}
      breadcrumbs={[
        { label: 'Payroll', href: '/payroll' },
        { label: 'Employees', href: '/payroll/employees' },
        { label: `${employee.firstName} ${employee.lastName}` },
      ]}
    >
      <EmployeeDetail
        employee={employee}
        onEdit={() => navigate({ to: '/payroll/employees/$employeeId/edit', params: { employeeId } })}
        onDelete={() => setShowDeleteConfirm(true)}
        deleting={deleteEmployee.isPending}
      />

      {/* Delete confirmation dialog — kept as dialog since it's a small confirmation, not a form */}
      <Dialog
        open={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        title="Delete Employee"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowDeleteConfirm(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              loading={deleteEmployee.isPending}
              disabled={deleteEmployee.isPending}
            >
              Delete Employee
            </Button>
          </>
        }
      >
        <p className="text-sm text-[#6b7280]">
          Are you sure you want to delete {employee.firstName} {employee.lastName}?
          This action cannot be undone.
        </p>
      </Dialog>
    </PageContainer>
  );
}

// ─── PayRunsPage ─────────────────────────────────────────────────────────────

type PayRunFrequency = 'weekly' | 'monthly' | 'unscheduled';

export function PayRunsPage() {
  const { data: payRuns, isLoading: payRunsLoading } = usePayRuns();
  const createPayRun = useCreatePayRun();
  const postPayRun = usePostPayRun();
  const [showNewPayRun, setShowNewPayRun] = useState(false);
  const [showPayRunDropdown, setShowPayRunDropdown] = useState(false);
  const [selectedFrequency, setSelectedFrequency] = useState<PayRunFrequency>('monthly');
  const [searchTerm, setSearchTerm] = useState('');

  const handleCreatePayRun = (data: CreatePayRunInput) => {
    createPayRun.mutate(data, {
      onSuccess: () => {
        setShowNewPayRun(false);
        showToast('success', 'Pay run created');
      },
      onError: (err: Error) => showToast('error', err.message || 'Failed to create pay run'),
    });
  };

  const handleSelectFrequency = (freq: PayRunFrequency) => {
    setSelectedFrequency(freq);
    setShowPayRunDropdown(false);
    setShowNewPayRun(true);
  };

  const handleProcessPayRun = () => {
    const draftRun = payRuns?.find((pr) => pr.status === 'draft');
    if (draftRun) {
      postPayRun.mutate(draftRun.id, {
        onSuccess: () => showToast('success', 'Pay run processed'),
        onError: (err: Error) => showToast('error', err.message || 'Failed to process pay run'),
      });
    }
  };

  if (payRunsLoading) {
    return (
      <PageContainer title="Pay Runs" breadcrumbs={[{ label: 'Payroll', href: '/payroll' }, { label: 'Pay Runs' }]}>
        <div className="text-[#6b7280]" data-testid="payruns-loading">Loading pay runs...</div>
      </PageContainer>
    );
  }

  const hasDraftRun = payRuns?.some((pr) => pr.status === 'draft');

  const filteredPayRuns = useMemo(() => {
    const all = payRuns ?? [];
    if (!searchTerm.trim()) return all;
    const lower = searchTerm.toLowerCase();
    return all.filter(
      (pr) =>
        pr.periodStart.toLowerCase().includes(lower) ||
        pr.periodEnd.toLowerCase().includes(lower),
    );
  }, [payRuns, searchTerm]);

  return (
    <PageContainer
      title="Pay Employees"
      breadcrumbs={[{ label: 'Payroll', href: '/payroll' }, { label: 'Pay Employees' }]}
      actions={
        <div className="flex gap-2">
          {hasDraftRun && (
            <Button
              size="sm"
              variant="outline"
              onClick={handleProcessPayRun}
              data-testid="process-pay-run-btn"
              loading={postPayRun.isPending}
            >
              Process Pay Run
            </Button>
          )}
          <div className="relative">
            <Button
              size="sm"
              onClick={() => setShowPayRunDropdown(!showPayRunDropdown)}
              data-testid="new-pay-run-dropdown-btn"
            >
              New Pay Run &#9662;
            </Button>
            {showPayRunDropdown && (
              <div
                className="absolute right-0 mt-1 w-48 bg-white border border-[#e5e7eb] rounded-md shadow-lg z-10"
                data-testid="new-pay-run-dropdown"
              >
                <button
                  type="button"
                  className="w-full text-left px-4 py-2 text-sm hover:bg-[#f3f4f6]"
                  onClick={() => handleSelectFrequency('weekly')}
                >
                  Weekly
                </button>
                <button
                  type="button"
                  className="w-full text-left px-4 py-2 text-sm hover:bg-[#f3f4f6]"
                  onClick={() => handleSelectFrequency('monthly')}
                >
                  Monthly
                </button>
                <button
                  type="button"
                  className="w-full text-left px-4 py-2 text-sm hover:bg-[#f3f4f6]"
                  onClick={() => handleSelectFrequency('unscheduled')}
                >
                  Unscheduled
                </button>
              </div>
            )}
          </div>
        </div>
      }
    >
      <div className="space-y-6">
        {/* myIR connection banner */}
        <div
          className="flex items-center gap-2 rounded-md border border-[#14b8a6]/30 bg-[#14b8a6]/5 px-4 py-3 text-sm text-[#0d9488]"
          data-testid="myir-status-banner"
        >
          <span className="font-medium">Connected to myIR (simulated)</span>
        </div>

        <div className="flex items-center">
          <Input
            type="search"
            placeholder="Search pay runs"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-64"
            data-testid="payrun-search"
          />
        </div>

        {/* Not Filed status badges on draft pay runs */}
        <PayRunList payRuns={filteredPayRuns} showNotFiledBadge />

        <Dialog
          open={showNewPayRun}
          onClose={() => setShowNewPayRun(false)}
          title={`New Pay Run - ${selectedFrequency.charAt(0).toUpperCase() + selectedFrequency.slice(1)}`}
        >
          <NewPayRunForm
            onSubmit={handleCreatePayRun}
            onCancel={() => setShowNewPayRun(false)}
            loading={createPayRun.isPending}
          />
        </Dialog>
      </div>
    </PageContainer>
  );
}

// ─── PayRunDetailPage ────────────────────────────────────────────────────────

interface PayRunDetailPageProps {
  payRunId?: string;
}

export function PayRunDetailPage({ payRunId: payRunIdProp }: PayRunDetailPageProps) {
  let routePayRunId: string | undefined;
  try {
    const params = useParams({ from: '/payroll/pay-runs/$payRunId' });
    routePayRunId = params.payRunId;
  } catch {
    // Not rendered under the route — use prop fallback
  }
  const payRunId = payRunIdProp ?? routePayRunId ?? '';
  const { data: payRun, isLoading } = usePayRun(payRunId);
  const postPayRun = usePostPayRun();

  const handlePost = () => {
    postPayRun.mutate(payRunId, {
      onSuccess: () => showToast('success', 'Pay run posted'),
      onError: (err: Error) => showToast('error', err.message || 'Failed to post pay run'),
    });
  };

  if (isLoading) {
    return (
      <PageContainer
        title="Pay Run"
        breadcrumbs={[
          { label: 'Payroll', href: '/payroll' },
          { label: 'Pay Runs', href: '/payroll/pay-runs' },
          { label: 'Loading...' },
        ]}
      >
        <div className="text-[#6b7280]" data-testid="payrun-loading">Loading pay run...</div>
      </PageContainer>
    );
  }

  if (!payRun) {
    return (
      <PageContainer
        title="Pay Run Not Found"
        breadcrumbs={[
          { label: 'Payroll', href: '/payroll' },
          { label: 'Pay Runs', href: '/payroll/pay-runs' },
          { label: 'Not Found' },
        ]}
      >
        <div className="text-[#6b7280]">Pay run not found.</div>
      </PageContainer>
    );
  }

  return (
    <PageContainer
      title="Pay Run"
      breadcrumbs={[
        { label: 'Payroll', href: '/payroll' },
        { label: 'Pay Runs', href: '/payroll/pay-runs' },
        { label: `${payRun.periodStart} - ${payRun.periodEnd}` },
      ]}
    >
      <PayRunDetail
        payRun={payRun}
        onPost={handlePost}
        posting={postPayRun.isPending}
      />
    </PageContainer>
  );
}
