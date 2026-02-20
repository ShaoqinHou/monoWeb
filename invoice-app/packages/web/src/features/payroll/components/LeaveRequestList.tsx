import { useState, useMemo } from 'react';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '../../../components/ui/Table';
import { Select } from '../../../components/ui/Select';
import { Button } from '../../../components/ui/Button';
import { Check, X } from 'lucide-react';
import type { LeaveRequest, LeaveStatus } from '../hooks/useLeaveRequests';

interface LeaveRequestListProps {
  requests: LeaveRequest[];
  onApprove?: (id: string) => void;
  onDecline?: (id: string) => void;
  onDelete?: (id: string) => void;
}

const STATUS_OPTIONS = [
  { value: 'all', label: 'All statuses' },
  { value: 'pending', label: 'Pending' },
  { value: 'approved', label: 'Approved' },
  { value: 'declined', label: 'Declined' },
];

const STATUS_COLORS: Record<LeaveStatus, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  approved: 'bg-green-100 text-green-700',
  declined: 'bg-red-100 text-red-700',
};

const LEAVE_TYPE_LABELS: Record<string, string> = {
  annual: 'Annual Leave',
  sick: 'Sick Leave',
  bereavement: 'Bereavement',
  parental: 'Parental Leave',
  unpaid: 'Unpaid Leave',
};

export function LeaveRequestList({ requests, onApprove, onDecline, onDelete }: LeaveRequestListProps) {
  const [statusFilter, setStatusFilter] = useState('all');

  const filtered = useMemo(() => {
    if (statusFilter === 'all') return requests;
    return requests.filter((r) => r.status === statusFilter);
  }, [requests, statusFilter]);

  return (
    <div className="space-y-4" data-testid="leave-request-list">
      {/* Status filter */}
      <div className="flex items-end gap-4">
        <div className="w-48">
          <Select
            options={STATUS_OPTIONS}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            aria-label="Filter by status"
          />
        </div>
      </div>

      {/* Table */}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Employee</TableHead>
            <TableHead>Leave Type</TableHead>
            <TableHead>Start Date</TableHead>
            <TableHead>End Date</TableHead>
            <TableHead className="text-right">Hours</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filtered.length === 0 ? (
            <TableRow>
              <td colSpan={7} className="px-4 py-8 text-center text-[#6b7280]">
                No leave requests found
              </td>
            </TableRow>
          ) : (
            filtered.map((request) => (
              <TableRow key={request.id}>
                <TableCell className="font-medium">{request.employeeId}</TableCell>
                <TableCell>{LEAVE_TYPE_LABELS[request.leaveType] ?? request.leaveType}</TableCell>
                <TableCell>{request.startDate}</TableCell>
                <TableCell>{request.endDate}</TableCell>
                <TableCell className="text-right tabular-nums">{request.hours}</TableCell>
                <TableCell>
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      STATUS_COLORS[request.status]
                    }`}
                  >
                    {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                  </span>
                </TableCell>
                <TableCell>
                  {request.status === 'pending' && (
                    <div className="flex gap-1">
                      {onApprove && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onApprove(request.id)}
                          aria-label={`Approve leave request ${request.id}`}
                        >
                          <Check className="h-4 w-4 text-green-600" />
                        </Button>
                      )}
                      {onDecline && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onDecline(request.id)}
                          aria-label={`Decline leave request ${request.id}`}
                        >
                          <X className="h-4 w-4 text-red-600" />
                        </Button>
                      )}
                    </div>
                  )}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
