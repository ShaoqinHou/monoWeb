import { useState, useMemo } from 'react';
import { PageContainer } from '../../../components/layout/PageContainer';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { Card, CardContent } from '../../../components/ui/Card';
import { Dialog } from '../../../components/ui/Dialog';
import { Tabs, TabList, Tab, TabPanel } from '../../../components/ui/Tabs';
import { LeaveRequestList } from '../components/LeaveRequestList';
import { LeaveRequestForm } from '../components/LeaveRequestForm';
import { showToast } from '../../dashboard/components/ToastContainer';
import {
  useLeaveRequests,
  useCreateLeaveRequest,
  useApproveLeaveRequest,
  useDeclineLeaveRequest,
  type CreateLeaveRequestInput,
} from '../hooks/useLeaveRequests';
import { useEmployees } from '../hooks/usePayroll';

const STATUS_FILTER_OPTIONS = [
  { value: '', label: 'All Statuses' },
  { value: 'pending', label: 'Pending' },
  { value: 'approved', label: 'Approved' },
  { value: 'declined', label: 'Declined' },
];

export function LeaveRequestsPage() {
  const { data: requests, isLoading } = useLeaveRequests();
  const { data: employees } = useEmployees();
  const createRequest = useCreateLeaveRequest();
  const approveRequest = useApproveLeaveRequest();
  const declineRequest = useDeclineLeaveRequest();
  const [showNewForm, setShowNewForm] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const handleCreate = (data: CreateLeaveRequestInput) => {
    createRequest.mutate(data, {
      onSuccess: () => {
        setShowNewForm(false);
        showToast('success', 'Leave request submitted');
      },
      onError: (err: Error) => showToast('error', err.message || 'Failed to submit leave request'),
    });
  };

  const filteredRequests = useMemo(() => {
    let result = requests ?? [];
    if (search) {
      const lower = search.toLowerCase();
      result = result.filter(
        (r) =>
          r.employeeName.toLowerCase().includes(lower) ||
          r.leaveType.toLowerCase().includes(lower),
      );
    }
    if (statusFilter) {
      result = result.filter((r) => r.status === statusFilter);
    }
    return result;
  }, [requests, search, statusFilter]);

  const currentRequests = useMemo(
    () => filteredRequests.filter((r) => r.status === 'pending' || r.status === 'approved'),
    [filteredRequests],
  );

  const historyRequests = useMemo(
    () => filteredRequests.filter((r) => r.status === 'declined'),
    [filteredRequests],
  );

  if (isLoading) {
    return (
      <PageContainer
        title="Leave"
        breadcrumbs={[{ label: 'Payroll', href: '/payroll' }, { label: 'Leave' }]}
      >
        <div className="text-[#6b7280]" data-testid="leave-loading">Loading leave requests...</div>
      </PageContainer>
    );
  }

  return (
    <PageContainer
      title="Leave"
      breadcrumbs={[{ label: 'Payroll', href: '/payroll' }, { label: 'Leave' }]}
      actions={
        <Button size="sm" onClick={() => setShowNewForm(true)}>
          New Leave Request
        </Button>
      }
    >
      <div className="space-y-4">
        {/* Info Panel */}
        <Card data-testid="leave-info-panel">
          <CardContent>
            <p className="text-sm text-[#6b7280]">
              Review, approve, and track employee leave requests. Employees can submit leave requests which will appear here for approval.
            </p>
          </CardContent>
        </Card>

        {/* Calendar graphic placeholder */}
        <div
          className="h-20 rounded-md border border-dashed border-[#d1d5db] bg-[#f9fafb] flex items-center justify-center text-sm text-[#6b7280]"
          data-testid="leave-calendar-graphic"
        >
          Leave Calendar Overview
        </div>

        {/* Search and filter */}
        <div className="flex gap-3 items-end" data-testid="leave-filters">
          <div className="flex-1 max-w-xs">
            <Input
              placeholder="Search by employee or type..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label="Search leave requests"
              data-testid="leave-search"
            />
          </div>
          <div className="w-44">
            <Select
              options={STATUS_FILTER_OPTIONS}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              aria-label="Filter by status"
              data-testid="leave-status-filter"
            />
          </div>
        </div>

        {/* Current / History tabs */}
        <Tabs defaultTab="current" data-testid="leave-tabs">
          <TabList>
            <Tab tabId="current" data-testid="leave-tab-current">Current</Tab>
            <Tab tabId="history" data-testid="leave-tab-history">History</Tab>
          </TabList>

          <TabPanel tabId="current">
            <LeaveRequestList
              requests={currentRequests}
              onApprove={(id) => approveRequest.mutate(id, {
                onSuccess: () => showToast('success', 'Leave request approved'),
                onError: (err: Error) => showToast('error', err.message || 'Failed to approve leave'),
              })}
              onDecline={(id) => declineRequest.mutate(id, {
                onSuccess: () => showToast('success', 'Leave request declined'),
                onError: (err: Error) => showToast('error', err.message || 'Failed to decline leave'),
              })}
            />
          </TabPanel>

          <TabPanel tabId="history">
            <LeaveRequestList
              requests={historyRequests}
              onApprove={(id) => approveRequest.mutate(id, {
                onSuccess: () => showToast('success', 'Leave request approved'),
                onError: (err: Error) => showToast('error', err.message || 'Failed to approve leave'),
              })}
              onDecline={(id) => declineRequest.mutate(id, {
                onSuccess: () => showToast('success', 'Leave request declined'),
                onError: (err: Error) => showToast('error', err.message || 'Failed to decline leave'),
              })}
            />
          </TabPanel>
        </Tabs>
      </div>

      <Dialog
        open={showNewForm}
        onClose={() => setShowNewForm(false)}
        title="New Leave Request"
      >
        <LeaveRequestForm
          employees={employees ?? []}
          onSubmit={handleCreate}
          onCancel={() => setShowNewForm(false)}
          loading={createRequest.isPending}
        />
      </Dialog>
    </PageContainer>
  );
}
