import { Card, CardHeader, CardContent } from '../../../components/ui/Card';
import { useLeaveBalances } from '../hooks/useLeaveBalances';
import type { LeaveType } from '../hooks/useLeaveRequests';

interface LeaveBalanceCardProps {
  employeeId: string;
}

const LEAVE_TYPE_LABELS: Record<LeaveType, string> = {
  annual: 'Annual Leave',
  sick: 'Sick Leave',
  bereavement: 'Bereavement',
  parental: 'Parental Leave',
  unpaid: 'Unpaid Leave',
};

export function LeaveBalanceCard({ employeeId }: LeaveBalanceCardProps) {
  const { data: balances, isLoading } = useLeaveBalances(employeeId);

  if (isLoading) {
    return (
      <Card data-testid="leave-balance-card">
        <CardContent>
          <div className="text-[#6b7280]" data-testid="leave-balance-loading">Loading leave balances...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card data-testid="leave-balance-card">
      <CardHeader>
        <h3 className="text-sm font-semibold text-[#1a1a2e]">Leave Balances</h3>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {balances.map((balance) => (
            <div key={balance.leaveType} className="flex items-center justify-between" data-testid={`leave-balance-${balance.leaveType}`}>
              <span className="text-sm text-[#1a1a2e]">{LEAVE_TYPE_LABELS[balance.leaveType]}</span>
              <div className="flex gap-4 text-sm">
                <span className="text-[#6b7280]">
                  Accrued: <span className="font-medium text-[#1a1a2e]">{balance.accrued}h</span>
                </span>
                <span className="text-[#6b7280]">
                  Taken: <span className="font-medium text-[#1a1a2e]">{balance.taken}h</span>
                </span>
                <span className="text-[#6b7280]">
                  Remaining: <span className={`font-semibold ${balance.remaining < 0 ? 'text-[#ef4444]' : 'text-[#14b8a6]'}`}>
                    {balance.remaining}h
                  </span>
                </span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
