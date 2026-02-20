import { Combobox } from '../../../../components/ui/Combobox';
import { TableRow, TableCell } from '../../../../components/ui/Table';
import { formatCurrency } from '@shared/calc/currency';
import type { BankTransaction } from '../types';

interface CashCodingRowProps {
  transaction: BankTransaction;
  accountCode: string;
  taxRate: string;
  onChange: (transactionId: string, field: 'accountCode' | 'taxRate', value: string) => void;
}

const ACCOUNT_CODE_OPTIONS = [
  { value: '', label: '-- Select --' },
  { value: '200', label: '200 - Sales' },
  { value: '260', label: '260 - Other Revenue' },
  { value: '400', label: '400 - Advertising' },
  { value: '404', label: '404 - Bank Fees' },
  { value: '408', label: '408 - Cleaning' },
  { value: '412', label: '412 - Consulting' },
  { value: '420', label: '420 - Entertainment' },
  { value: '429', label: '429 - General Expenses' },
  { value: '461', label: '461 - Printing' },
  { value: '469', label: '469 - Rent' },
  { value: '473', label: '473 - Stationery' },
  { value: '477', label: '477 - Telephone' },
  { value: '489', label: '489 - Travel' },
];

const TAX_RATE_OPTIONS = [
  { value: '', label: '-- Select --' },
  { value: '0', label: 'No Tax (0%)' },
  { value: '15', label: 'GST (15%)' },
  { value: '9', label: 'GST on Imports (9%)' },
];

export function CashCodingRow({ transaction, accountCode, taxRate, onChange }: CashCodingRowProps) {
  const isInflow = transaction.amount > 0;

  return (
    <TableRow data-testid={`cashcoding-row-${transaction.id}`}>
      <TableCell className="text-sm">{transaction.date}</TableCell>
      <TableCell className="text-sm font-medium">{transaction.description}</TableCell>
      <TableCell className="text-right text-sm">
        {isInflow ? (
          <span className="text-green-600">{formatCurrency(transaction.amount)}</span>
        ) : (
          <span className="text-red-600">{formatCurrency(Math.abs(transaction.amount))}</span>
        )}
      </TableCell>
      <TableCell>
        <Combobox
          options={ACCOUNT_CODE_OPTIONS}
          value={accountCode}
          onChange={(v) => onChange(transaction.id, 'accountCode', v)}
          data-testid={`cashcoding-account-${transaction.id}`}
        />
      </TableCell>
      <TableCell>
        <Combobox
          options={TAX_RATE_OPTIONS}
          value={taxRate}
          onChange={(v) => onChange(transaction.id, 'taxRate', v)}
          data-testid={`cashcoding-tax-${transaction.id}`}
        />
      </TableCell>
    </TableRow>
  );
}
