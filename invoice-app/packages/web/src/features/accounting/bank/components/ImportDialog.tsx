import { useState, type ChangeEvent } from 'react';
import { Dialog } from '../../../../components/ui/Dialog';
import { Button } from '../../../../components/ui/Button';
import { Input } from '../../../../components/ui/Input';
import { useImportTransactions } from '../hooks/useBank';
import { showToast } from '../../../dashboard/components/ToastContainer';
import type { ImportTransactionRow } from '../types';

interface ImportDialogProps {
  open: boolean;
  onClose: () => void;
  accountId: string;
}

/** Parse simple CSV text (date,description,amount) into transaction rows */
function parseCSV(text: string): ImportTransactionRow[] {
  const lines = text.trim().split('\n');
  const rows: ImportTransactionRow[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // Skip header row if it looks like headers
    if (i === 0 && /^date/i.test(line)) continue;

    const parts = line.split(',').map((s) => s.trim());
    if (parts.length < 3) continue;

    const amount = parseFloat(parts[2]);
    if (isNaN(amount)) continue;

    rows.push({
      date: parts[0],
      description: parts[1],
      amount,
      reference: parts[3] || undefined,
    });
  }

  return rows;
}

export function ImportDialog({ open, onClose, accountId }: ImportDialogProps) {
  const [csvText, setCsvText] = useState('');
  const [parsedRows, setParsedRows] = useState<ImportTransactionRow[]>([]);
  const [parseError, setParseError] = useState('');
  const importMutation = useImportTransactions();

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      setCsvText(text);
      handleParse(text);
    };
    reader.readAsText(file);
  };

  const handleTextChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    setCsvText(e.target.value);
  };

  const handleParse = (text?: string) => {
    const input = text ?? csvText;
    const rows = parseCSV(input);
    if (rows.length === 0) {
      setParseError('No valid rows found. Format: date,description,amount');
      setParsedRows([]);
    } else {
      setParseError('');
      setParsedRows(rows);
    }
  };

  const handleImport = () => {
    if (parsedRows.length === 0 || !accountId) return;
    importMutation.mutate(
      { accountId, transactions: parsedRows },
      {
        onSuccess: () => {
          setCsvText('');
          setParsedRows([]);
          setParseError('');
          onClose();
        },
      },
    );
  };

  const handleClose = () => {
    setCsvText('');
    setParsedRows([]);
    setParseError('');
    importMutation.reset();
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      title="Import Bank Transactions"
      footer={
        <>
          <Button variant="secondary" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleImport}
            loading={importMutation.isPending}
            disabled={parsedRows.length === 0}
            data-testid="import-submit-btn"
          >
            Import {parsedRows.length > 0 ? `(${parsedRows.length} rows)` : ''}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {/* File upload */}
        <div>
          <Input
            type="file"
            label="Upload CSV File"
            inputId="csv-file-input"
            accept=".csv"
            onChange={handleFileChange}
          />
        </div>

        {/* Manual paste */}
        <div>
          <label htmlFor="csv-text" className="block text-sm font-medium text-gray-700 mb-1">
            Or paste CSV data
          </label>
          <textarea
            id="csv-text"
            data-testid="csv-text-input"
            className="w-full rounded border border-gray-300 px-3 py-2 text-sm font-mono"
            rows={6}
            placeholder="date,description,amount&#10;2026-02-15,Payment from Client,1500&#10;2026-02-16,Office rent,-2000"
            value={csvText}
            onChange={handleTextChange}
          />
        </div>

        {/* Parse button */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleParse()}
          data-testid="parse-csv-btn"
        >
          Parse CSV
        </Button>

        {/* Parse error */}
        {parseError && (
          <p className="text-sm text-red-600" data-testid="parse-error">
            {parseError}
          </p>
        )}

        {/* Parsed preview */}
        {parsedRows.length > 0 && (
          <div data-testid="parsed-preview">
            <p className="text-sm text-green-700 font-medium">
              {parsedRows.length} transaction{parsedRows.length !== 1 ? 's' : ''} ready to import
            </p>
            <div className="mt-2 max-h-40 overflow-y-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-1">Date</th>
                    <th className="text-left py-1">Description</th>
                    <th className="text-right py-1">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {parsedRows.map((row, i) => (
                    <tr key={i} className="border-b border-gray-100">
                      <td className="py-1">{row.date}</td>
                      <td className="py-1">{row.description}</td>
                      <td className={`py-1 text-right ${row.amount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {row.amount.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Import success */}
        {importMutation.isSuccess && (
          <p className="text-sm text-green-700" data-testid="import-success">
            Successfully imported transactions.
          </p>
        )}

        {/* Import error */}
        {importMutation.isError && (
          <p className="text-sm text-red-600" data-testid="import-error">
            Import failed: {importMutation.error?.message ?? 'Unknown error'}
          </p>
        )}
      </div>
    </Dialog>
  );
}
