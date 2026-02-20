import { Input } from '../../../components/ui/Input';
import { Combobox } from '../../../components/ui/Combobox';
import type { ComboboxOption } from '../../../components/ui/Combobox';
import { Button } from '../../../components/ui/Button';
import { Trash2 } from 'lucide-react';
import { useNavigate } from '@tanstack/react-router';

interface JournalLineProps {
  index: number;
  accountId: string;
  description: string;
  debit: string;
  credit: string;
  accountOptions: ComboboxOption[];
  onAccountChange: (index: number, value: string) => void;
  onDescriptionChange: (index: number, value: string) => void;
  onDebitChange: (index: number, value: string) => void;
  onCreditChange: (index: number, value: string) => void;
  onRemove: (index: number) => void;
  canRemove: boolean;
}

export function JournalLine({
  index,
  accountId,
  description,
  debit,
  credit,
  accountOptions,
  onAccountChange,
  onDescriptionChange,
  onDebitChange,
  onCreditChange,
  onRemove,
  canRemove,
}: JournalLineProps) {
  const navigate = useNavigate();
  return (
    <tr className="border-b border-gray-100">
      <td className="px-2 py-2">
        <Combobox
          options={accountOptions}
          value={accountId}
          onChange={(val) => onAccountChange(index, val)}
          placeholder="Select account"
          onCreateNew={() => navigate({ to: '/accounting/chart-of-accounts/new' })}
          data-testid={`line-account-${index}`}
        />
      </td>
      <td className="px-2 py-2">
        <Input
          value={description}
          onChange={(e) => onDescriptionChange(index, e.target.value)}
          placeholder="Description"
          aria-label={`Line ${index + 1} description`}
        />
      </td>
      <td className="px-2 py-2">
        <Input
          type="number"
          value={debit}
          onChange={(e) => onDebitChange(index, e.target.value)}
          placeholder="0.00"
          aria-label={`Line ${index + 1} debit`}
          min="0"
          step="0.01"
        />
      </td>
      <td className="px-2 py-2">
        <Input
          type="number"
          value={credit}
          onChange={(e) => onCreditChange(index, e.target.value)}
          placeholder="0.00"
          aria-label={`Line ${index + 1} credit`}
          min="0"
          step="0.01"
        />
      </td>
      <td className="px-2 py-2 text-center">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onRemove(index)}
          disabled={!canRemove}
          aria-label={`Remove line ${index + 1}`}
        >
          <Trash2 className="h-4 w-4 text-gray-400" />
        </Button>
      </td>
    </tr>
  );
}
