import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '../../../lib/api-helpers';
import { taxKeys } from './keys';

export interface ActivityStatement {
  id: string;
  period: string;
  startDate: string;
  endDate: string;
  dueDate: string;
  status: 'due' | 'filed' | 'overdue';
  gstAmount: number;
  payeAmount: number;
  totalAmount: number;
  filedAt: string | null;
}

const FALLBACK_STATEMENTS: ActivityStatement[] = [
  {
    id: 'as-2026-01',
    period: 'Jan-Feb 2026',
    startDate: '2026-01-01',
    endDate: '2026-02-28',
    dueDate: '2026-03-28',
    status: 'due',
    gstAmount: 6450,
    payeAmount: 3200,
    totalAmount: 9650,
    filedAt: null,
  },
  {
    id: 'as-2025-11',
    period: 'Nov-Dec 2025',
    startDate: '2025-11-01',
    endDate: '2025-12-31',
    dueDate: '2026-01-28',
    status: 'overdue',
    gstAmount: 6300,
    payeAmount: 3100,
    totalAmount: 9400,
    filedAt: null,
  },
  {
    id: 'as-2025-09',
    period: 'Sep-Oct 2025',
    startDate: '2025-09-01',
    endDate: '2025-10-31',
    dueDate: '2025-11-28',
    status: 'filed',
    gstAmount: 7650,
    payeAmount: 3400,
    totalAmount: 11050,
    filedAt: '2025-11-20T10:00:00Z',
  },
  {
    id: 'as-2025-07',
    period: 'Jul-Aug 2025',
    startDate: '2025-07-01',
    endDate: '2025-08-31',
    dueDate: '2025-09-28',
    status: 'filed',
    gstAmount: 4635,
    payeAmount: 2800,
    totalAmount: 7435,
    filedAt: '2025-09-22T10:00:00Z',
  },
];

async function fetchActivityStatements(): Promise<ActivityStatement[]> {
  try {
    return await apiFetch<ActivityStatement[]>('/tax/activity-statements');
  } catch {
    return FALLBACK_STATEMENTS;
  }
}

export function useActivityStatements() {
  return useQuery({
    queryKey: [...taxKeys.all, 'activity-statements'],
    queryFn: fetchActivityStatements,
    staleTime: 5 * 60 * 1000,
  });
}
