import { useState, useCallback, useRef } from 'react';
import { Button } from '../../../components/ui/Button';
import { Select } from '../../../components/ui/Select';
import { Dialog } from '../../../components/ui/Dialog';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '../../../components/ui/Table';
import type { SelectOption } from '../../../components/ui/Select';

interface ImportCOADialogProps {
  open: boolean;
  onClose: () => void;
  onImport?: (rows: ImportedAccount[]) => void;
}

export interface ImportedAccount {
  code: string;
  name: string;
  type: string;
}

interface ParsedCSV {
  headers: string[];
  rows: string[][];
}

const REQUIRED_FIELDS = ['code', 'name', 'type'] as const;

function parseCSV(text: string): ParsedCSV {
  const lines = text.trim().split('\n');
  if (lines.length === 0) return { headers: [], rows: [] };

  const headers = lines[0].split(',').map((h) => h.trim().replace(/^"|"$/g, ''));
  const rows = lines.slice(1).map((line) =>
    line.split(',').map((cell) => cell.trim().replace(/^"|"$/g, '')),
  );

  return { headers, rows };
}

export function ImportCOADialog({ open, onClose, onImport }: ImportCOADialogProps) {
  const [csv, setCSV] = useState<ParsedCSV | null>(null);
  const [mapping, setMapping] = useState<Record<string, string>>({
    code: '',
    name: '',
    type: '',
  });
  const [step, setStep] = useState<'upload' | 'map' | 'preview'>('upload');
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result;
      if (typeof text === 'string') {
        const parsed = parseCSV(text);
        setCSV(parsed);
        // Auto-map by matching header names
        const autoMapping: Record<string, string> = { code: '', name: '', type: '' };
        for (const field of REQUIRED_FIELDS) {
          const match = parsed.headers.find(
            (h) => h.toLowerCase() === field.toLowerCase(),
          );
          if (match) autoMapping[field] = match;
        }
        setMapping(autoMapping);
        setStep('map');
      }
    };
    reader.readAsText(file);
  }, []);

  const headerOptions: SelectOption[] = csv
    ? csv.headers.map((h) => ({ value: h, label: h }))
    : [];

  const allMapped = REQUIRED_FIELDS.every((f) => mapping[f] !== '');

  const previewRows: ImportedAccount[] = (() => {
    if (!csv || !allMapped) return [];
    return csv.rows.slice(0, 10).map((row) => ({
      code: row[csv.headers.indexOf(mapping.code)] ?? '',
      name: row[csv.headers.indexOf(mapping.name)] ?? '',
      type: row[csv.headers.indexOf(mapping.type)] ?? '',
    }));
  })();

  const allRows: ImportedAccount[] = (() => {
    if (!csv || !allMapped) return [];
    return csv.rows.map((row) => ({
      code: row[csv.headers.indexOf(mapping.code)] ?? '',
      name: row[csv.headers.indexOf(mapping.name)] ?? '',
      type: row[csv.headers.indexOf(mapping.type)] ?? '',
    }));
  })();

  const handleImport = () => {
    onImport?.(allRows);
    handleClose();
  };

  const handleClose = () => {
    setCSV(null);
    setMapping({ code: '', name: '', type: '' });
    setStep('upload');
    if (fileRef.current) fileRef.current.value = '';
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      title="Import Chart of Accounts"
      className="max-w-2xl"
      footer={
        step === 'preview' ? (
          <>
            <Button variant="ghost" onClick={() => setStep('map')}>
              Back
            </Button>
            <Button onClick={handleImport} data-testid="confirm-import-btn">
              Import {allRows.length} Accounts
            </Button>
          </>
        ) : step === 'map' ? (
          <>
            <Button variant="ghost" onClick={handleClose}>
              Cancel
            </Button>
            <Button
              disabled={!allMapped}
              onClick={() => setStep('preview')}
              data-testid="preview-import-btn"
            >
              Preview
            </Button>
          </>
        ) : undefined
      }
    >
      {step === 'upload' && (
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Upload a CSV file with your chart of accounts. The file should include
            columns for account code, name, and type.
          </p>
          <input
            ref={fileRef}
            type="file"
            accept=".csv"
            onChange={handleFileChange}
            data-testid="csv-file-input"
            className="block w-full text-sm text-gray-500 file:mr-4 file:rounded file:border-0 file:bg-blue-50 file:px-4 file:py-2 file:text-sm file:font-medium file:text-blue-700 hover:file:bg-blue-100"
          />
        </div>
      )}

      {step === 'map' && csv && (
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Map your CSV columns to the required fields.
          </p>
          {REQUIRED_FIELDS.map((field) => (
            <Select
              key={field}
              label={`${field.charAt(0).toUpperCase() + field.slice(1)} Column`}
              options={headerOptions}
              value={mapping[field]}
              onChange={(e) =>
                setMapping((prev) => ({ ...prev, [field]: e.target.value }))
              }
              placeholder={`Select ${field} column`}
              data-testid={`map-${field}`}
            />
          ))}
        </div>
      )}

      {step === 'preview' && (
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Preview of first {previewRows.length} accounts (total: {allRows.length}).
          </p>
          <Table data-testid="import-preview-table">
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Type</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {previewRows.map((row, i) => (
                <TableRow key={i}>
                  <TableCell>{row.code}</TableCell>
                  <TableCell>{row.name}</TableCell>
                  <TableCell>{row.type}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </Dialog>
  );
}
