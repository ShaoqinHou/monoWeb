import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '../../../lib/api-helpers';

export interface DueBill {
  id: string;
  billNumber: string;
  contactName: string;
  total: number;
  amountDue: number;
  currency: string;
  dueDate: string;
}

export interface BillsDueGrouped {
  today: DueBill[];
  thisWeek: DueBill[];
  thisMonth: DueBill[];
}

export function useBillsDue() {
  return useQuery({
    queryKey: ['bills', 'due'],
    queryFn: async () => {
      return apiFetch<BillsDueGrouped>('/bills/due');
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function computeBillsDueTotals(group: DueBill[]): { count: number; total: number } {
  return {
    count: group.length,
    total: group.reduce((sum, b) => sum + b.amountDue, 0),
  };
}
