import { Card, CardContent } from '../../../components/ui/Card';
import { formatCurrency } from '@shared/calc/currency';
import { Calendar, Users, DollarSign, Receipt, CalendarDays } from 'lucide-react';
import type { PayrollSummary as PayrollSummaryData } from '../types';

interface PayrollSummaryProps {
  summary: PayrollSummaryData;
}

export function PayrollSummary({ summary }: PayrollSummaryProps) {
  const cards = [
    {
      title: 'Next Pay Run',
      value: formatDate(summary.nextPayRunDate),
      icon: Calendar,
      color: 'text-[#0078c8]',
      bgColor: 'bg-[#0078c8]/10',
    },
    {
      title: 'Total Employees',
      value: String(summary.totalEmployees),
      icon: Users,
      color: 'text-[#14b8a6]',
      bgColor: 'bg-[#14b8a6]/10',
    },
    {
      title: 'YTD Payroll Costs',
      value: formatCurrency(summary.ytdPayrollCosts),
      icon: DollarSign,
      color: 'text-[#f59e0b]',
      bgColor: 'bg-[#f59e0b]/10',
    },
    {
      title: 'Total Cost Last Month',
      value: formatCurrency(summary.totalCostLastMonth ?? 0),
      icon: Receipt,
      color: 'text-[#8b5cf6]',
      bgColor: 'bg-[#8b5cf6]/10',
    },
    {
      title: 'Total Tax Last Month',
      value: formatCurrency(summary.totalTaxLastMonth ?? 0),
      icon: DollarSign,
      color: 'text-[#ef4444]',
      bgColor: 'bg-[#ef4444]/10',
    },
    {
      title: 'Next Payment Date',
      value: summary.nextPaymentDate ? formatDate(summary.nextPaymentDate) : '--',
      icon: CalendarDays,
      color: 'text-[#0ea5e9]',
      bgColor: 'bg-[#0ea5e9]/10',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4" data-testid="payroll-summary">
      {cards.map((card) => (
        <Card key={card.title}>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className={`rounded-lg p-3 ${card.bgColor}`}>
                <card.icon className={`h-6 w-6 ${card.color}`} aria-hidden="true" />
              </div>
              <div>
                <p className="text-sm text-[#6b7280]">{card.title}</p>
                <p className="text-xl font-bold text-[#1a1a2e]">{card.value}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00');
  return date.toLocaleDateString('en-NZ', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}
