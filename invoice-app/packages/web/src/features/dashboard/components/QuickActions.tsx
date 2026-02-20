import { Link } from '@tanstack/react-router';
import { FileText, Receipt, Users, CreditCard } from 'lucide-react';
import { useDashboardSummary } from '../hooks/useDashboardData';

interface QuickActionProps {
  to: string;
  icon: typeof FileText;
  label: string;
}

function QuickActionButton({ to, icon: Icon, label }: QuickActionProps) {
  return (
    <Link
      to={to}
      className="flex items-center gap-2 rounded-lg border border-[#e5e7eb] bg-white px-4 py-3 text-sm font-medium text-[#1a1a2e] shadow-sm hover:bg-gray-50 transition-colors"
      data-testid={`quick-action-${label.toLowerCase().replace(/\s+/g, '-')}`}
    >
      <Icon className="h-4 w-4 text-[#0078c8]" aria-hidden="true" />
      {label}
    </Link>
  );
}

export function QuickActions() {
  const { data } = useDashboardSummary();

  // Find the last unpaid invoice for "Record Payment"
  const lastUnpaid = data?.recentInvoices.find(
    (inv) => inv.status !== 'paid' && inv.status !== 'voided' && inv.amountDue > 0,
  );
  const recordPaymentHref = lastUnpaid
    ? `/sales/invoices/${lastUnpaid.id}/payment`
    : '/sales/invoices';

  return (
    <div
      className="flex flex-wrap gap-3 mb-6"
      data-testid="quick-actions"
    >
      <QuickActionButton
        to="/sales/invoices/new"
        icon={FileText}
        label="New Invoice"
      />
      <QuickActionButton
        to="/purchases/bills/new"
        icon={Receipt}
        label="New Bill"
      />
      <QuickActionButton
        to="/contacts/new"
        icon={Users}
        label="New Contact"
      />
      <QuickActionButton
        to={recordPaymentHref}
        icon={CreditCard}
        label="Record Payment"
      />
    </div>
  );
}
