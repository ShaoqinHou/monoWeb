import { useRef } from "react";
import { Dialog } from "../../../components/ui/Dialog";
import { Button } from "../../../components/ui/Button";
import { Badge } from "../../../components/ui/Badge";
import { Upload, CheckCircle, AlertCircle } from "lucide-react";
import type { ImportJournalsHook } from "../hooks/useImportJournals";

export interface ImportJournalsDialogProps {
  open: boolean;
  onClose: () => void;
  importState: ImportJournalsHook;
}

export function ImportJournalsDialog({
  open,
  onClose,
  importState,
}: ImportJournalsDialogProps) {
  const {
    step,
    setStep,
    csvRows,
    mapping,
    setMapping,
    entries,
    groups,
    errors,
    importResult,
    parseCsv,
    applyMapping,
    runImport,
  } = importState;

  const fileRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      parseCsv(reader.result as string);
      setStep(2);
    };
    reader.readAsText(file);
  };

  const headers = csvRows[0] ?? [];

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={`Import Journal Entries - Step ${step} of 4`}
      className="max-w-2xl"
      footer={
        <div className="flex gap-2">
          {step > 1 && step < 4 && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setStep(step - 1)}
            >
              Back
            </Button>
          )}
          {step === 2 && (
            <Button
              size="sm"
              onClick={() => {
                applyMapping();
                setStep(3);
              }}
              data-testid="mapping-next"
            >
              Next
            </Button>
          )}
          {step === 3 && (
            <Button
              size="sm"
              onClick={async () => {
                await runImport();
                setStep(4);
              }}
              disabled={errors.length > 0}
              data-testid="import-start"
            >
              Import
            </Button>
          )}
          {step === 4 && (
            <Button size="sm" onClick={onClose}>
              Done
            </Button>
          )}
        </div>
      }
    >
      {step === 1 && (
        <div className="flex flex-col items-center gap-4 py-8" data-testid="import-step-1">
          <Upload className="h-12 w-12 text-[#6b7280]" />
          <p className="text-sm text-[#6b7280]">Upload a CSV file with journal entries</p>
          <input
            ref={fileRef}
            type="file"
            accept=".csv"
            className="hidden"
            onChange={handleFileUpload}
            data-testid="csv-file-input"
          />
          <Button
            size="sm"
            onClick={() => fileRef.current?.click()}
            data-testid="upload-button"
          >
            Choose File
          </Button>
        </div>
      )}

      {step === 2 && (
        <div className="flex flex-col gap-4" data-testid="import-step-2">
          <p className="text-sm text-[#6b7280]">
            Map CSV columns to journal entry fields. Found {csvRows.length} rows.
          </p>
          <div className="grid grid-cols-2 gap-3">
            {(
              ["date", "account", "debit", "credit", "description", "reference"] as const
            ).map((field) => (
              <div key={field} className="flex flex-col gap-1">
                <label className="text-sm font-medium text-[#1a1a2e] capitalize">
                  {field}
                </label>
                <select
                  value={mapping[field]}
                  onChange={(e) =>
                    setMapping({ ...mapping, [field]: parseInt(e.target.value) })
                  }
                  className="rounded border border-[#e5e7eb] px-3 py-2 text-sm"
                  data-testid={`mapping-${field}`}
                >
                  {headers.map((h, i) => (
                    <option key={i} value={i}>
                      Column {i}: {h}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="flex flex-col gap-4" data-testid="import-step-3">
          <p className="text-sm text-[#6b7280]">
            Preview: {entries.length} entries in {groups.length} journal(s)
          </p>
          {errors.length > 0 && (
            <div className="rounded border border-[#ef4444]/30 bg-[#ef4444]/5 p-3">
              <p className="text-sm font-medium text-[#ef4444] mb-2">
                Validation Errors ({errors.length})
              </p>
              <ul className="space-y-1">
                {errors.map((err, i) => (
                  <li key={i} className="text-sm text-[#ef4444]" data-testid="validation-error">
                    {err.message}
                  </li>
                ))}
              </ul>
            </div>
          )}
          <div className="max-h-48 overflow-y-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-[#6b7280]">
                  <th className="py-1 pr-2">Ref</th>
                  <th className="py-1 pr-2">Entries</th>
                  <th className="py-1 pr-2">Debits</th>
                  <th className="py-1 pr-2">Credits</th>
                  <th className="py-1">Status</th>
                </tr>
              </thead>
              <tbody>
                {groups.map((g) => (
                  <tr key={g.reference} className="border-b" data-testid="journal-group-row">
                    <td className="py-1 pr-2">{g.reference}</td>
                    <td className="py-1 pr-2">{g.entries.length}</td>
                    <td className="py-1 pr-2">{g.totalDebits.toFixed(2)}</td>
                    <td className="py-1 pr-2">{g.totalCredits.toFixed(2)}</td>
                    <td className="py-1">
                      {g.balanced ? (
                        <Badge variant="success">Balanced</Badge>
                      ) : (
                        <Badge variant="error">Unbalanced</Badge>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {step === 4 && importResult && (
        <div className="flex flex-col items-center gap-4 py-8" data-testid="import-step-4">
          {importResult.errorCount === 0 ? (
            <>
              <CheckCircle className="h-12 w-12 text-[#14b8a6]" />
              <p className="text-sm text-[#1a1a2e]">
                Successfully imported {importResult.successCount} journal(s)
              </p>
            </>
          ) : (
            <>
              <AlertCircle className="h-12 w-12 text-[#f59e0b]" />
              <p className="text-sm text-[#1a1a2e]">
                Imported {importResult.successCount} journal(s),{" "}
                {importResult.errorCount} failed
              </p>
            </>
          )}
        </div>
      )}
    </Dialog>
  );
}
