import { useCallback, useState } from 'react';
import { apiPost } from '../../../lib/api-helpers';
import type { Contact } from '@shared/schemas/contact';

export interface CsvContactRow {
  name: string;
  email?: string;
  phone?: string;
  type?: string;
  taxNumber?: string;
}

export function useExportContacts() {
  const exportCsv = useCallback((contacts: Contact[]) => {
    const headers = ['Name', 'Email', 'Phone', 'Type', 'Tax Number', 'Outstanding', 'Overdue'];
    const rows = contacts.map((c) => [
      c.name,
      c.email ?? '',
      c.phone ?? '',
      c.type,
      c.taxNumber ?? '',
      String(c.outstandingBalance),
      String(c.overdueBalance),
    ]);

    const csv = [headers.join(','), ...rows.map((r) => r.map((v) => `"${v}"`).join(','))].join(
      '\n',
    );

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'contacts-export.csv';
    link.click();
    URL.revokeObjectURL(url);
  }, []);

  return { exportCsv };
}

export function useImportContacts() {
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mutate = useCallback(async (rows: CsvContactRow[]) => {
    setIsPending(true);
    setError(null);
    try {
      const results = await apiPost<Contact[]>('/contacts/import', { contacts: rows });
      setIsPending(false);
      return results;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Import failed');
      setIsPending(false);
      throw err;
    }
  }, []);

  return { mutate, isPending, error };
}

export function parseCsvText(text: string): CsvContactRow[] {
  const lines = text.trim().split('\n');
  if (lines.length < 2) return [];

  const headers = lines[0].split(',').map((h) => h.trim().replace(/^"|"$/g, '').toLowerCase());

  const nameIdx = headers.indexOf('name');
  const emailIdx = headers.indexOf('email');
  const phoneIdx = headers.indexOf('phone');
  const typeIdx = headers.indexOf('type');
  const taxIdx = headers.findIndex((h) => h.includes('tax'));

  if (nameIdx === -1) return [];

  return lines.slice(1).map((line) => {
    const cols = line.split(',').map((c) => c.trim().replace(/^"|"$/g, ''));
    return {
      name: cols[nameIdx] ?? '',
      email: emailIdx >= 0 ? cols[emailIdx] : undefined,
      phone: phoneIdx >= 0 ? cols[phoneIdx] : undefined,
      type: typeIdx >= 0 ? cols[typeIdx] : undefined,
      taxNumber: taxIdx >= 0 ? cols[taxIdx] : undefined,
    };
  }).filter((r) => r.name.length > 0);
}
