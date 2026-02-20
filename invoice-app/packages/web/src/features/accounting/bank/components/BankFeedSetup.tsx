// @stub - CSV upload only. No Plaid/Yodlee live bank feeds.
import { useState, type ChangeEvent } from 'react';
import { Button } from '../../../../components/ui/Button';
import { Select } from '../../../../components/ui/Select';
import { useImportTransactions } from '../hooks/useImportTransactions';
import { parseCSV, validateParsedRows } from './CsvParser';
import type { ImportTransactionRow } from '../types';

const NZ_BANKS = [
  { value: 'anz', label: 'ANZ' },
  { value: 'asb', label: 'ASB' },
  { value: 'bnz', label: 'BNZ' },
  { value: 'westpac', label: 'Westpac' },
  { value: 'kiwibank', label: 'Kiwibank' },
];

export type SetupStep = 'upload' | 'preview' | 'importing' | 'success';

export interface BankFeedSetupProps {
  onComplete?: (bankName: string) => void;
  accountId?: string;
}

export function BankFeedSetup({ onComplete, accountId }: BankFeedSetupProps) {
  const [step, setStep] = useState<SetupStep>('upload');
  const [selectedBank, setSelectedBank] = useState('');
  const [parsedRows, setParsedRows] = useState<ImportTransactionRow[]>([]);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const importMutation = useImportTransactions();

  const bankLabel = NZ_BANKS.find((b) => b.value === selectedBank)?.label ?? '';

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const rows = parseCSV(text);
      const { valid, errors } = validateParsedRows(rows);
      setParsedRows(valid);
      setValidationErrors(errors);
      if (valid.length > 0) {
        setStep('preview');
      }
    };
    reader.readAsText(file);
  };

  const handleImport = () => {
    if (parsedRows.length === 0 || !accountId) return;
    setStep('importing');
    importMutation.mutate(
      { accountId, transactions: parsedRows },
      {
        onSuccess: () => {
          setStep('success');
          onComplete?.(bankLabel || 'CSV Import');
        },
        onError: () => {
          setStep('preview');
        },
      },
    );
  };

  const handleBack = () => {
    setParsedRows([]);
    setValidationErrors([]);
    setStep('upload');
  };

  if (step === 'success') {
    return (
      <div className="rounded border border-green-200 bg-green-50 p-6 text-center" data-testid="setup-success">
        <div className="mb-2 text-2xl">&#10003;</div>
        <h3 className="text-lg font-semibold text-green-800">Import Complete</h3>
        <p className="mt-1 text-sm text-green-700">
          Successfully imported {parsedRows.length} transaction{parsedRows.length !== 1 ? 's' : ''}.
        </p>
      </div>
    );
  }

  if (step === 'importing') {
    return (
      <div className="flex flex-col items-center gap-4 p-6" data-testid="setup-importing">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#0078c8] border-t-transparent" />
        <p className="text-sm text-[#6b7280]">Importing transactions...</p>
      </div>
    );
  }

  if (step === 'preview') {
    return (
      <div className="space-y-4 p-4" data-testid="setup-preview">
        <h3 className="text-lg font-semibold text-[#1a1a2e]">Review Transactions</h3>

        {validationErrors.length > 0 && (
          <div className="rounded bg-yellow-50 p-3 text-sm text-yellow-800" data-testid="validation-warnings">
            <p className="font-medium mb-1">Warnings:</p>
            <ul className="list-disc list-inside">
              {validationErrors.map((err, i) => (
                <li key={i}>{err}</li>
              ))}
            </ul>
          </div>
        )}

        <p className="text-sm text-green-700 font-medium" data-testid="preview-count">
          {parsedRows.length} transaction{parsedRows.length !== 1 ? 's' : ''} ready to import
        </p>

        <div className="max-h-48 overflow-y-auto rounded border border-gray-200">
          <table className="w-full text-sm" data-testid="preview-table">
            <thead>
              <tr className="bg-gray-50 border-b">
                <th className="text-left px-3 py-2">Date</th>
                <th className="text-left px-3 py-2">Description</th>
                <th className="text-right px-3 py-2">Amount</th>
              </tr>
            </thead>
            <tbody>
              {parsedRows.map((row, i) => (
                <tr key={i} className="border-b border-gray-100">
                  <td className="px-3 py-1.5">{row.date}</td>
                  <td className="px-3 py-1.5">{row.description}</td>
                  <td className={`px-3 py-1.5 text-right ${row.amount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {row.amount.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {importMutation.isError && (
          <p className="text-sm text-red-600" data-testid="import-error">
            Import failed: {importMutation.error?.message ?? 'Unknown error'}
          </p>
        )}

        <div className="flex gap-2">
          <Button variant="secondary" onClick={handleBack} data-testid="setup-back-btn">
            Back
          </Button>
          <Button
            variant="primary"
            onClick={handleImport}
            disabled={parsedRows.length === 0 || !accountId}
            data-testid="setup-import-btn"
          >
            Import {parsedRows.length} Transactions
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4" data-testid="setup-upload">
      <h3 className="text-lg font-semibold text-[#1a1a2e]">Import Bank Transactions</h3>
      <p className="text-sm text-[#6b7280]">
        Select your bank and upload a CSV file to import transactions.
      </p>

      <Select
        label="Select your bank"
        options={NZ_BANKS}
        placeholder="Choose a bank..."
        value={selectedBank}
        onChange={(e) => setSelectedBank(e.target.value)}
        selectId="bank-select"
      />

      <div>
        <label
          htmlFor="bank-csv-upload"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Upload CSV File
        </label>
        <input
          id="bank-csv-upload"
          type="file"
          accept=".csv,.ofx"
          onChange={handleFileChange}
          data-testid="csv-file-input"
          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
        />
      </div>
    </div>
  );
}
