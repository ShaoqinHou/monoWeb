import { useCallback, useState } from 'react';
import type { Contact } from '@shared/schemas/contact';

export interface ContactCsvRow {
  name: string;
  email: string;
  phone: string;
  type: string;
  city: string;
  country: string;
  outstandingBalance: string;
}

const CSV_HEADERS = ['Name', 'Email', 'Phone', 'Type', 'City', 'Country', 'Outstanding Balance'];

function escapeCsvField(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return `"${value}"`;
}

function contactToCsvRow(contact: Contact): string {
  const fields = [
    contact.name,
    contact.email ?? '',
    contact.phone ?? '',
    contact.type,
    '', // city — not in schema
    '', // country — not in schema
    String(contact.outstandingBalance),
  ];
  return fields.map(escapeCsvField).join(',');
}

export function buildContactsCsv(contacts: Contact[]): string {
  const headerRow = CSV_HEADERS.join(',');
  const dataRows = contacts.map(contactToCsvRow);
  return [headerRow, ...dataRows].join('\n');
}

export function useExportContactsCsv() {
  const [isExporting, setIsExporting] = useState(false);

  const exportCsv = useCallback((contacts: Contact[]) => {
    setIsExporting(true);

    const csv = buildContactsCsv(contacts);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'contacts-export.csv';
    link.click();
    URL.revokeObjectURL(url);

    // Brief "exporting" state for UI feedback
    setTimeout(() => setIsExporting(false), 500);
  }, []);

  return { exportCsv, isExporting };
}
