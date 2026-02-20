import { useMemo } from 'react';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '../../../components/ui/Table';
import { formatCurrency } from '@shared/calc/currency';
import type { PayItem, PayItemType } from '../hooks/usePayItems';

interface PayItemListProps {
  items: PayItem[];
  onEdit?: (item: PayItem) => void;
}

const TYPE_ORDER: PayItemType[] = ['earnings', 'deduction', 'reimbursement', 'tax'];

const TYPE_LABELS: Record<PayItemType, string> = {
  earnings: 'Earnings',
  deduction: 'Deductions',
  reimbursement: 'Reimbursements',
  tax: 'Tax',
};

const TYPE_COLORS: Record<PayItemType, string> = {
  earnings: 'text-green-700 bg-green-50',
  deduction: 'text-red-700 bg-red-50',
  reimbursement: 'text-blue-700 bg-blue-50',
  tax: 'text-gray-700 bg-gray-50',
};

const RATE_TYPE_LABELS: Record<string, string> = {
  fixed: 'Fixed',
  per_hour: 'Per Hour',
  percentage: 'Percentage',
};

export function PayItemList({ items, onEdit }: PayItemListProps) {
  const grouped = useMemo(() => {
    const groups: Record<string, PayItem[]> = {};
    for (const item of items) {
      if (!groups[item.type]) groups[item.type] = [];
      groups[item.type].push(item);
    }
    return groups;
  }, [items]);

  return (
    <div className="space-y-6" data-testid="pay-item-list">
      {items.length === 0 ? (
        <div className="px-4 py-8 text-center text-[#6b7280]">
          No pay items found
        </div>
      ) : (
        TYPE_ORDER.map((type) => {
          const group = grouped[type];
          if (!group || group.length === 0) return null;

          return (
            <div key={type}>
              <h3 className={`text-sm font-semibold uppercase tracking-wide mb-2 px-1 ${TYPE_COLORS[type].split(' ')[0]}`}>
                {TYPE_LABELS[type]} ({group.length})
              </h3>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Rate Type</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead>Account Code</TableHead>
                    <TableHead>Default</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {group.map((item) => (
                    <TableRow
                      key={item.id}
                      className={onEdit ? 'cursor-pointer' : ''}
                      onClick={() => onEdit?.(item)}
                    >
                      <TableCell className="font-medium">{item.name}</TableCell>
                      <TableCell>{RATE_TYPE_LABELS[item.rateType] ?? item.rateType}</TableCell>
                      <TableCell className="text-right tabular-nums">
                        {item.rateType === 'percentage'
                          ? `${item.amount}%`
                          : formatCurrency(item.amount)}
                      </TableCell>
                      <TableCell>{item.accountCode ?? '-'}</TableCell>
                      <TableCell>
                        {item.isDefault ? (
                          <span className="text-green-600 font-medium">Yes</span>
                        ) : (
                          <span className="text-[#6b7280]">No</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            item.isActive
                              ? 'bg-green-100 text-green-700'
                              : 'bg-gray-100 text-gray-500'
                          }`}
                        >
                          {item.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          );
        })
      )}
    </div>
  );
}
