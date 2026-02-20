import { useState, useRef, type ChangeEvent } from 'react';
import { Dialog } from '../../../components/ui/Dialog';
import { Button } from '../../../components/ui/Button';
import { Select } from '../../../components/ui/Select';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '../../../components/ui/Table';
import { parseCsvText, type CsvContactRow } from '../hooks/useContactImportExport';

interface ContactImportDialogProps {
  open: boolean;
  onClose: () => void;
  onImport?: (rows: CsvContactRow[]) => void;
}

type Step = 'upload' | 'mapping' | 'preview';

const CONTACT_FIELDS = [
  { value: 'name', label: 'Name' },
  { value: 'email', label: 'Email' },
  { value: 'phone', label: 'Phone' },
  { value: 'type', label: 'Type' },
  { value: 'taxNumber', label: 'Tax Number' },
  { value: '', label: '-- Skip --' },
];

export function ContactImportDialog({ open, onClose, onImport }: ContactImportDialogProps) {
  const [step, setStep] = useState<Step>('upload');
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [csvRows, setCsvRows] = useState<string[][]>([]);
  const [columnMapping, setColumnMapping] = useState<Record<number, string>>({});
  const [parsedRows, setParsedRows] = useState<CsvContactRow[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function reset() {
    setStep('upload');
    setCsvHeaders([]);
    setCsvRows([]);
    setColumnMapping({});
    setParsedRows([]);
  }

  function handleClose() {
    reset();
    onClose();
  }

  function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target?.result as string;
      if (!text) return;

      const lines = text.trim().split('\n');
      if (lines.length < 2) return;

      const headers = lines[0].split(',').map((h) => h.trim().replace(/^"|"$/g, ''));
      setCsvHeaders(headers);

      const rows = lines.slice(1).map((line) =>
        line.split(',').map((c) => c.trim().replace(/^"|"$/g, '')),
      );
      setCsvRows(rows);

      // Auto-map columns by header name
      const autoMap: Record<number, string> = {};
      headers.forEach((h, i) => {
        const lower = h.toLowerCase();
        if (lower === 'name') autoMap[i] = 'name';
        else if (lower === 'email') autoMap[i] = 'email';
        else if (lower === 'phone') autoMap[i] = 'phone';
        else if (lower === 'type') autoMap[i] = 'type';
        else if (lower.includes('tax')) autoMap[i] = 'taxNumber';
      });
      setColumnMapping(autoMap);
      setStep('mapping');
    };
    reader.readAsText(file);
  }

  function handleMappingConfirm() {
    const mapped: CsvContactRow[] = csvRows
      .map((row) => {
        const entry: Record<string, string> = {};
        Object.entries(columnMapping).forEach(([colIdx, field]) => {
          if (field) {
            entry[field] = row[Number(colIdx)] ?? '';
          }
        });
        return entry as unknown as CsvContactRow;
      })
      .filter((r) => r.name && r.name.length > 0);

    setParsedRows(mapped);
    setStep('preview');
  }

  function handleImport() {
    onImport?.(parsedRows);
    handleClose();
  }

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      title="Import Contacts"
      className="max-w-3xl"
      footer={
        step === 'preview' ? (
          <>
            <Button variant="ghost" onClick={() => setStep('mapping')}>
              Back
            </Button>
            <Button
              variant="primary"
              onClick={handleImport}
              data-testid="import-confirm-btn"
            >
              Import {parsedRows.length} Contacts
            </Button>
          </>
        ) : step === 'mapping' ? (
          <>
            <Button variant="ghost" onClick={() => setStep('upload')}>
              Back
            </Button>
            <Button
              variant="primary"
              onClick={handleMappingConfirm}
              data-testid="mapping-confirm-btn"
            >
              Next
            </Button>
          </>
        ) : undefined
      }
    >
      {step === 'upload' && (
        <div className="py-8 text-center" data-testid="upload-step">
          <p className="mb-4 text-sm text-[#6b7280]">
            Upload a CSV file to import contacts.
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={handleFileChange}
            data-testid="csv-file-input"
            className="text-sm"
          />
        </div>
      )}

      {step === 'mapping' && (
        <div className="space-y-3" data-testid="mapping-step">
          <p className="text-sm text-[#6b7280]">
            Map CSV columns to contact fields:
          </p>
          {csvHeaders.map((header, i) => (
            <div key={i} className="flex items-center gap-3">
              <span className="w-32 text-sm font-medium truncate">{header}</span>
              <Select
                options={CONTACT_FIELDS}
                value={columnMapping[i] ?? ''}
                onChange={(e) =>
                  setColumnMapping((prev) => ({ ...prev, [i]: e.target.value }))
                }
                selectId={`map-col-${i}`}
                data-testid={`map-col-${i}`}
              />
            </div>
          ))}
        </div>
      )}

      {step === 'preview' && (
        <div data-testid="preview-step">
          <p className="mb-3 text-sm text-[#6b7280]">
            Preview: {parsedRows.length} contacts to import
          </p>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Type</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {parsedRows.slice(0, 5).map((row, i) => (
                <TableRow key={i} data-testid={`preview-row-${i}`}>
                  <TableCell>{row.name}</TableCell>
                  <TableCell>{row.email ?? ''}</TableCell>
                  <TableCell>{row.phone ?? ''}</TableCell>
                  <TableCell>{row.type ?? 'customer'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {parsedRows.length > 5 && (
            <p className="mt-2 text-xs text-[#6b7280]">
              ...and {parsedRows.length - 5} more
            </p>
          )}
        </div>
      )}
    </Dialog>
  );
}
