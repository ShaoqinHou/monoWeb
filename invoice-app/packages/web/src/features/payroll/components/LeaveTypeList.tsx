import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import type { LeaveType } from '../hooks/useLeaveTypes';

interface LeaveTypeListProps {
  leaveTypes: LeaveType[];
  onEdit: (leaveType: LeaveType) => void;
  onDelete: (id: string) => void;
}

export function LeaveTypeList({ leaveTypes, onEdit, onDelete }: LeaveTypeListProps) {
  if (leaveTypes.length === 0) {
    return (
      <p className="text-sm text-[#6b7280]" data-testid="leave-types-empty">
        No leave types configured.
      </p>
    );
  }

  return (
    <div className="space-y-2" data-testid="leave-type-list">
      {leaveTypes.map((lt) => (
        <div
          key={lt.id}
          className="flex items-center justify-between rounded border border-[#e5e7eb] bg-white px-4 py-3"
          data-testid={`leave-type-${lt.id}`}
        >
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-[#1a1a2e]">{lt.name}</span>
            <Badge variant={lt.paidLeave ? 'success' : 'default'}>
              {lt.paidLeave ? 'Paid' : 'Unpaid'}
            </Badge>
            {lt.defaultDaysPerYear > 0 && (
              <span className="text-xs text-[#6b7280]">
                {lt.defaultDaysPerYear} days/year
              </span>
            )}
          </div>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEdit(lt)}
              data-testid={`edit-leave-type-${lt.id}`}
            >
              Edit
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(lt.id)}
              data-testid={`delete-leave-type-${lt.id}`}
            >
              Delete
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
