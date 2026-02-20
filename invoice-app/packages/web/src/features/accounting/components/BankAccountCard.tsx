import { Link } from '@tanstack/react-router';
import { formatCurrency } from '../../../../../shared/calc/currency';
import { Card, CardHeader, CardContent, CardFooter } from '../../../components/ui/Card';
import type { BankAccount } from '../types';

interface BankAccountCardProps {
  account: BankAccount;
}

export function BankAccountCard({ account }: BankAccountCardProps) {
  return (
    <Card>
      <CardHeader>
        <h3 className="text-base font-semibold text-gray-900">{account.name}</h3>
        <p className="text-sm text-gray-500">{account.accountNumber}</p>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-1">
          <span className="text-sm text-gray-500">Current Balance</span>
          <span
            className={`text-2xl font-bold ${account.balance < 0 ? 'text-red-600' : 'text-gray-900'}`}
          >
            {formatCurrency(account.balance)}
          </span>
        </div>
        <p className="mt-2 text-sm text-gray-500">
          {account.recentTransactionCount} recent transaction{account.recentTransactionCount !== 1 ? 's' : ''}
        </p>
      </CardContent>
      <CardFooter>
        <Link
          to="/bank"
          title="Bank account detail — not yet implemented"
          className="text-sm font-medium text-[#0078c8] hover:underline"
        >
          Go to account
        </Link>
      </CardFooter>
    </Card>
  );
}
