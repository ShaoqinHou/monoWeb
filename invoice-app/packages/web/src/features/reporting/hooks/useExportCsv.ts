import { useCallback } from 'react';
import type { ReportSection } from '../types';

/** Escape a value for CSV: wrap in quotes if it contains comma, newline, or quotes */
function escapeCsvValue(value: string): string {
  if (value.includes(',') || value.includes('\n') || value.includes('"')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

/** Convert report sections to CSV string */
export function reportSectionsToCsv(sections: ReportSection[]): string {
  const lines: string[] = ['Label,Amount'];
  for (const section of sections) {
    for (const row of section.rows) {
      const label = escapeCsvValue(row.label);
      const amount = row.amount !== undefined ? row.amount.toFixed(2) : '';
      lines.push(`${label},${amount}`);
    }
  }
  return lines.join('\n');
}

/** Convert aged report buckets to CSV string */
export function agedReportToCsv(
  buckets: Array<{ label: string; amount: number; count: number }>,
  total: number,
): string {
  const lines: string[] = ['Bucket,Amount,Count'];
  for (const bucket of buckets) {
    lines.push(`${escapeCsvValue(bucket.label)},${bucket.amount.toFixed(2)},${bucket.count}`);
  }
  lines.push(`Total,${total.toFixed(2)},`);
  return lines.join('\n');
}

/** Trigger a CSV file download in the browser */
export function downloadCsv(csvContent: string, filename: string): void {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/** Hook that returns a CSV download function for report sections */
export function useExportCsv(sections: ReportSection[], filename: string) {
  return useCallback(() => {
    const csv = reportSectionsToCsv(sections);
    downloadCsv(csv, filename);
  }, [sections, filename]);
}
