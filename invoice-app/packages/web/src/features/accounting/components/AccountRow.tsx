import { formatCurrency } from '../../../../../shared/calc/currency';
import { TableRow, TableCell } from '../../../components/ui/Table';
import type { AccountWithBalance } from '../types';

interface AccountRowProps {
  account: AccountWithBalance;
}

export function AccountRow({ account }: AccountRowProps) {
  return (
    <TableRow>
      <TableCell className="w-24 font-mono text-sm text-gray-500">
        {account.code}
      </TableCell>
      <TableCell className="font-medium">
        {account.name}
      </TableCell>
      <TableCell className="text-right font-mono">
        {formatCurrency(account.balance)}
      </TableCell>
    </TableRow>
  );
}
