import { useState, useCallback, type ChangeEvent } from 'react';
import { Dialog } from '../../../../components/ui/Dialog';
import { Button } from '../../../../components/ui/Button';
import { useImportTransactions } from '../hooks/useBank';
import { detectCsvFormat, parseCSV, validateParsedRows, autoDetectMapping } from './CsvParser';
import { ColumnMappingStep } from './ColumnMappingStep';
import type { CsvColumnMapping } from './CsvParser';
import type { ImportTransactionRow } from '../types';

interface ImportWizardProps {
  open: boolean;
  onClose: () => void;
  accountId: string;
}

type WizardStep = 1 | 2 | 3 | 4;

const STEP_LABELS: Record<WizardStep, string> = {
  1: 'Upload',
  2: 'Column Mapping',
  3: 'Review',
  4: 'Confirm',
};

export function ImportWizard({ open, onClose, accountId }: ImportWizardProps) {
  const [step, setStep] = useState<WizardStep>(1);
  const [csvText, setCsvText] = useState('');
  const [headers, setHeaders] = useState<string[]>([]);
  const [sampleRows, setSampleRows] = useState<string[][]>([]);
  const [mapping, setMapping] = useState<CsvColumnMapping>({ date: 0, description: 1, amount: 2 });
  const [parsedRows, setParsedRows] = useState<ImportTransactionRow[]>([]);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const importMutation = useImportTransactions();

  const reset = useCallback(() => {
    setStep(1);
    setCsvText('');
    setHeaders([]);
    setSampleRows([]);
    setMapping({ date: 0, description: 1, amount: 2 });
    setParsedRows([]);
    setValidationErrors([]);
    importMutation.reset();
  }, [importMutation]);

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleTextChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    setCsvText(e.target.value);
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      setCsvText(text);
    };
    reader.readAsText(file);
  };

  const handleNext = () => {
    if (step === 1) {
      // Parse CSV format and advance to column mapping
      const detected = detectCsvFormat(csvText);
      const allRows = detected.sampleRows;
      if (detected.hasHeader && allRows.length > 0) {
        setHeaders(allRows[0]);
        setSampleRows(allRows.slice(1));
        setMapping(autoDetectMapping(allRows[0]));
      } else if (allRows.length > 0) {
        // Generate generic headers
        const genericHeaders = allRows[0].map((_, i) => `Column ${i + 1}`);
        setHeaders(genericHeaders);
        setSampleRows(allRows);
        setMapping({ date: 0, description: 1, amount: 2 });
      }
      setStep(2);
    } else if (step === 2) {
      // Parse with current mapping and advance to review
      const rows = parseCSV(csvText, { columnMapping: mapping });
      const { valid, errors } = validateParsedRows(rows);
      setParsedRows(valid);
      setValidationErrors(errors);
      setStep(3);
    } else if (step === 3) {
      setStep(4);
    }
  };

  const handleBack = () => {
    if (step === 2) setStep(1);
    else if (step === 3) setStep(2);
    else if (step === 4) setStep(3);
  };

  const handleImport = () => {
    if (parsedRows.length === 0 || !accountId) return;
    importMutation.mutate(
      { accountId, transactions: parsedRows },
      {
        onSuccess: () => {
          handleClose();
        },
      },
    );
  };

  const canAdvance = (): boolean => {
    if (step === 1) return csvText.trim().length > 0;
    if (step === 2) return true;
    if (step === 3) return parsedRows.length > 0;
    return false;
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      title="Smart Import"
      className="max-w-2xl"
      footer={
        <div className="flex items-center justify-between w-full">
          <Button variant="secondary" onClick={handleClose}>
            Cancel
          </Button>
          <div className="flex gap-2">
            {step > 1 && (
              <Button
                variant="outline"
                onClick={handleBack}
                data-testid="wizard-back-btn"
              >
                Back
              </Button>
            )}
            {step < 4 ? (
              <Button
                variant="primary"
                onClick={handleNext}
                disabled={!canAdvance()}
                data-testid="wizard-next-btn"
              >
                Next
              </Button>
            ) : (
              <Button
                variant="primary"
                onClick={handleImport}
                loading={importMutation.isPending}
                disabled={parsedRows.length === 0}
                data-testid="wizard-import-btn"
              >
                Import {parsedRows.length} Transactions
              </Button>
            )}
          </div>
        </div>
      }
    >
      <div className="space-y-4">
        {/* Step indicator */}
        <div className="flex items-center gap-2 text-sm">
          {([1, 2, 3, 4] as WizardStep[]).map((s) => (
            <div
              key={s}
              data-testid={s === step ? `wizard-step-${s}-active` : `wizard-step-${s}`}
              className={`flex items-center gap-1 ${
                s === step ? 'text-blue-600 font-semibold' : 'text-gray-400'
              }`}
            >
              <span
                className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs ${
                  s === step
                    ? 'bg-blue-600 text-white'
                    : s < step
                      ? 'bg-green-500 text-white'
                      : 'bg-gray-200 text-gray-500'
                }`}
              >
                {s}
              </span>
              <span className="hidden sm:inline">
                Step {s}: {STEP_LABELS[s]}
              </span>
              {s < 4 && <span className="text-gray-300 mx-1">/</span>}
            </div>
          ))}
        </div>

        {/* Step 1: Upload */}
        {step === 1 && (
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-gray-900">Upload CSV File or Paste Data</h3>
            <div>
              <label
                htmlFor="wizard-file-input"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Upload CSV File
              </label>
              <input
                id="wizard-file-input"
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
            </div>
            <div>
              <label
                htmlFor="wizard-csv-text"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Or paste CSV data
              </label>
              <textarea
                id="wizard-csv-text"
                data-testid="csv-text-input"
                className="w-full rounded border border-gray-300 px-3 py-2 text-sm font-mono"
                rows={8}
                placeholder="Date,Description,Amount&#10;2026-02-15,Payment from Client,1500&#10;2026-02-16,Office rent,-2000"
                value={csvText}
                onChange={handleTextChange}
              />
            </div>
          </div>
        )}

        {/* Step 2: Column Mapping */}
        {step === 2 && (
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-gray-900">Column Mapping</h3>
            <p className="text-sm text-gray-500">
              Map your CSV columns to the required fields. We auto-detected the mapping below.
            </p>
            <ColumnMappingStep
              headers={headers}
              sampleRows={sampleRows}
              mapping={mapping}
              onMappingChange={setMapping}
            />
          </div>
        )}

        {/* Step 3: Review */}
        {step === 3 && (
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-gray-900">Review Transactions</h3>

            {validationErrors.length > 0 && (
              <div className="rounded bg-yellow-50 p-3 text-sm text-yellow-800">
                <p className="font-medium mb-1">Validation warnings:</p>
                <ul className="list-disc list-inside">
                  {validationErrors.map((err, i) => (
                    <li key={i}>{err}</li>
                  ))}
                </ul>
              </div>
            )}

            {parsedRows.length > 0 ? (
              <div className="max-h-60 overflow-y-auto rounded border border-gray-200">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b">
                      <th className="text-left px-3 py-2">Date</th>
                      <th className="text-left px-3 py-2">Description</th>
                      <th className="text-right px-3 py-2">Amount</th>
                      <th className="text-left px-3 py-2">Reference</th>
                    </tr>
                  </thead>
                  <tbody>
                    {parsedRows.map((row, i) => (
                      <tr key={i} className="border-b border-gray-100">
                        <td className="px-3 py-1.5">{row.date}</td>
                        <td className="px-3 py-1.5">{row.description}</td>
                        <td
                          className={`px-3 py-1.5 text-right ${
                            row.amount >= 0 ? 'text-green-600' : 'text-red-600'
                          }`}
                        >
                          {row.amount.toFixed(2)}
                        </td>
                        <td className="px-3 py-1.5 text-gray-500">{row.reference ?? ''}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-sm text-red-600">No valid transactions found. Go back and adjust the column mapping.</p>
            )}

            <p className="text-sm text-gray-500">
              {parsedRows.length} valid transaction{parsedRows.length !== 1 ? 's' : ''} ready to import.
            </p>
          </div>
        )}

        {/* Step 4: Confirm */}
        {step === 4 && (
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-gray-900">Confirm Import</h3>
            <div className="rounded bg-blue-50 p-4">
              <p className="text-sm text-blue-900">
                Ready to import <strong>{parsedRows.length} transaction{parsedRows.length !== 1 ? 's' : ''}</strong> into
                your bank account.
              </p>
            </div>

            <div className="text-sm text-gray-600 space-y-1">
              <p>
                <span className="font-medium">Total money in:</span>{' '}
                {parsedRows
                  .filter((r) => r.amount > 0)
                  .reduce((sum, r) => sum + r.amount, 0)
                  .toFixed(2)}
              </p>
              <p>
                <span className="font-medium">Total money out:</span>{' '}
                {parsedRows
                  .filter((r) => r.amount < 0)
                  .reduce((sum, r) => sum + Math.abs(r.amount), 0)
                  .toFixed(2)}
              </p>
            </div>

            {importMutation.isError && (
              <p className="text-sm text-red-600">
                Import failed: {importMutation.error?.message ?? 'Unknown error'}
              </p>
            )}
          </div>
        )}
      </div>
    </Dialog>
  );
}
