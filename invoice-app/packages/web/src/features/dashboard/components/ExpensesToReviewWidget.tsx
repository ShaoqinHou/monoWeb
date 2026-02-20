import { Card, CardHeader, CardContent } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { formatCurrency } from '@shared/calc/currency';
import { Receipt, User } from 'lucide-react';

interface ExpenseUser {
  name: string;
  count: number;
  total: number;
}

interface ExpensesToReviewData {
  total: number;
  toReview: number;
  toPay: number;
  currency: string;
  byUser: ExpenseUser[];
}

// Mock data - in production would come from useDashboardData
const MOCK_DATA: ExpensesToReviewData = {
  total: 2450.0,
  toReview: 5,
  toPay: 3,
  currency: 'NZD',
  byUser: [
    { name: 'Sarah Chen', count: 3, total: 1200.0 },
    { name: 'James Wilson', count: 2, total: 850.0 },
    { name: 'Emily Taylor', count: 3, total: 400.0 },
  ],
};

export function ExpensesToReviewWidget() {
  const data = MOCK_DATA;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Receipt className="h-4 w-4 text-[#6b7280]" aria-hidden="true" />
            <h2 className="text-sm font-semibold text-[#1a1a2e]">Expenses to review</h2>
          </div>
          <span className="text-lg font-bold text-[#1a1a2e]">
            {formatCurrency(data.total, data.currency)}
          </span>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Summary counts */}
          <div className="flex gap-4" data-testid="expenses-summary">
            <div className="flex items-center gap-1.5">
              <Badge variant="warning">{data.toReview}</Badge>
              <span className="text-sm text-[#6b7280]">to review</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Badge variant="info">{data.toPay}</Badge>
              <span className="text-sm text-[#6b7280]">to pay</span>
            </div>
          </div>

          {/* By-user table */}
          <div className="space-y-2" data-testid="expenses-by-user">
            {data.byUser.map((user) => (
              <div
                key={user.name}
                className="flex items-center justify-between py-1.5 border-b border-[#e5e7eb] last:border-0"
                data-testid={`expense-user-${user.name.toLowerCase().replace(/\s+/g, '-')}`}
              >
                <div className="flex items-center gap-2">
                  <div className="h-6 w-6 rounded-full bg-[#0078c8]/10 flex items-center justify-center">
                    <User className="h-3 w-3 text-[#0078c8]" />
                  </div>
                  <span className="text-sm text-[#1a1a2e]">{user.name}</span>
                  <Badge variant="default">{user.count}</Badge>
                </div>
                <span className="text-sm font-medium text-[#1a1a2e]">
                  {formatCurrency(user.total, data.currency)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
