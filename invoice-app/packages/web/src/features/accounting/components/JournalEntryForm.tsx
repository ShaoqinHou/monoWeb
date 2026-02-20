import { useState, useCallback } from 'react';
import { Input } from '../../../components/ui/Input';
import { Button } from '../../../components/ui/Button';
import { JournalLine } from './JournalLine';
import { formatCurrency } from '../../../../../shared/calc/currency';
import type { ComboboxOption } from '../../../components/ui/Combobox';

interface LineState {
  accountId: string;
  description: string;
  debit: string;
  credit: string;
}

interface JournalEntryFormProps {
  accountOptions: ComboboxOption[];
  onSubmit: (data: {
    date: string;
    narration: string;
    autoReversingDate?: string;
    isCashBasis?: boolean;
    status: 'draft' | 'posted';
    lines: Array<{
      accountId: string;
      description: string;
      debit: number;
      credit: number;
    }>;
  }) => void;
  onCancel: () => void;
  loading?: boolean;
}

function emptyLine(): LineState {
  return { accountId: '', description: '', debit: '', credit: '' };
}

export function JournalEntryForm({
  accountOptions,
  onSubmit,
  onCancel,
  loading = false,
}: JournalEntryFormProps) {
  const [date, setDate] = useState('');
  const [narration, setNarration] = useState('');
  const [autoReversingDate, setAutoReversingDate] = useState('');
  const [isCashBasis, setIsCashBasis] = useState(false);
  const [lines, setLines] = useState<LineState[]>([emptyLine(), emptyLine()]);

  const totalDebits = lines.reduce((sum, l) => sum + (parseFloat(l.debit) || 0), 0);
  const totalCredits = lines.reduce((sum, l) => sum + (parseFloat(l.credit) || 0), 0);
  const isBalanced = Math.abs(totalDebits - totalCredits) < 0.005;
  const hasLines = lines.some((l) => l.accountId && (parseFloat(l.debit) || parseFloat(l.credit)));

  const updateLine = useCallback(
    (index: number, field: keyof LineState, value: string) => {
      setLines((prev) => {
        const next = [...prev];
        next[index] = { ...next[index], [field]: value };
        return next;
      });
    },
    [],
  );

  const addLine = () => {
    setLines((prev) => [...prev, emptyLine()]);
  };

  const removeLine = (index: number) => {
    setLines((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent, status: 'draft' | 'posted') => {
    e.preventDefault();
    if (!date || !narration || !isBalanced || !hasLines) return;

    onSubmit({
      date,
      narration,
      autoReversingDate: autoReversingDate || undefined,
      isCashBasis,
      status,
      lines: lines
        .filter((l) => l.accountId)
        .map((l) => ({
          accountId: l.accountId,
          description: l.description,
          debit: parseFloat(l.debit) || 0,
          credit: parseFloat(l.credit) || 0,
        })),
    });
  };

  return (
    <form className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Narration"
          value={narration}
          onChange={(e) => setNarration(e.target.value)}
          placeholder="Description of the journal entry"
          inputId="journal-narration"
        />
        <Input
          label="Date"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          inputId="journal-date"
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Auto Reversing Date (optional)"
          type="date"
          value={autoReversingDate}
          onChange={(e) => setAutoReversingDate(e.target.value)}
          inputId="journal-auto-reversing-date"
        />
        <div className="flex flex-col gap-2 pt-6">
          <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
            <input
              type="checkbox"
              checked={isCashBasis}
              onChange={(e) => setIsCashBasis(e.target.checked)}
              id="journal-cash-basis"
            />
            Show journal on cash basis reports
          </label>
        </div>
      </div>

      <div className="rounded-lg border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-2 py-2 text-left font-semibold text-gray-600 w-1/4">Account</th>
              <th className="px-2 py-2 text-left font-semibold text-gray-600 w-1/4">Description</th>
              <th className="px-2 py-2 text-left font-semibold text-gray-600 w-1/5">Debit</th>
              <th className="px-2 py-2 text-left font-semibold text-gray-600 w-1/5">Credit</th>
              <th className="px-2 py-2 w-12" />
            </tr>
          </thead>
          <tbody>
            {lines.map((line, index) => (
              <JournalLine
                key={index}
                index={index}
                accountId={line.accountId}
                description={line.description}
                debit={line.debit}
                credit={line.credit}
                accountOptions={accountOptions}
                onAccountChange={(i, v) => updateLine(i, 'accountId', v)}
                onDescriptionChange={(i, v) => updateLine(i, 'description', v)}
                onDebitChange={(i, v) => updateLine(i, 'debit', v)}
                onCreditChange={(i, v) => updateLine(i, 'credit', v)}
                onRemove={removeLine}
                canRemove={lines.length > 2}
              />
            ))}
          </tbody>
          <tfoot className="bg-gray-50">
            <tr>
              <td colSpan={2} className="px-2 py-2 text-right font-semibold text-gray-700">
                Totals
              </td>
              <td className="px-2 py-2 font-mono font-semibold" data-testid="total-debits">
                {formatCurrency(totalDebits)}
              </td>
              <td className="px-2 py-2 font-mono font-semibold" data-testid="total-credits">
                {formatCurrency(totalCredits)}
              </td>
              <td />
            </tr>
          </tfoot>
        </table>
      </div>

      <div className="flex items-center justify-between">
        <Button type="button" variant="ghost" onClick={addLine}>
          + Add Line
        </Button>
        <div className="flex items-center gap-3">
          {!isBalanced && hasLines && (
            <span className="text-sm text-red-600" role="alert">
              Debits and credits must be equal
            </span>
          )}
          <span
            className={`text-sm font-medium ${isBalanced ? 'text-green-600' : 'text-red-600'}`}
            data-testid="balance-indicator"
          >
            Difference: {formatCurrency(Math.abs(totalDebits - totalCredits))}
          </span>
        </div>
      </div>

      <div className="flex justify-end gap-3 border-t border-gray-200 pt-4">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={!date || !narration || !isBalanced || !hasLines || loading}
          loading={loading}
          onClick={(e) => handleSubmit(e as unknown as React.FormEvent, 'draft')}
          data-testid="save-draft-btn"
        >
          Save as draft
        </Button>
        <Button
          type="button"
          disabled={!date || !narration || !isBalanced || !hasLines || loading}
          loading={loading}
          onClick={(e) => handleSubmit(e as unknown as React.FormEvent, 'posted')}
          data-testid="post-btn"
        >
          Post
        </Button>
      </div>
    </form>
  );
}
