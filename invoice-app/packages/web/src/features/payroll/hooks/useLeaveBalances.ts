import { useMemo } from 'react';
import { useLeaveRequests } from './useLeaveRequests';
import type { LeaveType } from './useLeaveRequests';

export interface LeaveBalance {
  leaveType: LeaveType;
  accrued: number;
  taken: number;
  remaining: number;
}

/** Default annual accrual hours per leave type (NZ standard) */
const DEFAULT_ACCRUALS: Record<LeaveType, number> = {
  annual: 160, // 4 weeks x 40h
  sick: 40,    // 5 days x 8h
  bereavement: 24, // 3 days x 8h
  parental: 0, // variable, not auto-accrued
  unpaid: 0,
};

/**
 * Calculate leave balances for a given employee by aggregating approved leave requests.
 */
export function useLeaveBalances(employeeId: string) {
  const { data: allRequests, isLoading, error } = useLeaveRequests();

  const balances = useMemo(() => {
    if (!allRequests) return [];

    const employeeRequests = allRequests.filter(
      (r) => r.employeeId === employeeId && r.status === 'approved',
    );

    const takenMap = new Map<LeaveType, number>();
    for (const req of employeeRequests) {
      const current = takenMap.get(req.leaveType) ?? 0;
      takenMap.set(req.leaveType, current + req.hours);
    }

    const leaveTypes: LeaveType[] = ['annual', 'sick', 'bereavement', 'parental', 'unpaid'];
    return leaveTypes.map((lt): LeaveBalance => {
      const accrued = DEFAULT_ACCRUALS[lt];
      const taken = takenMap.get(lt) ?? 0;
      return {
        leaveType: lt,
        accrued,
        taken,
        remaining: accrued - taken,
      };
    });
  }, [allRequests, employeeId]);

  return { data: balances, isLoading, error };
}
