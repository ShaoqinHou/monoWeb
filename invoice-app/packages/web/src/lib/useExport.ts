import { useState, useCallback } from "react";

export interface ExportColumn {
  key: string;
  header: string;
  format?: (value: unknown) => string;
}

function escapeCsvCell(value: string): string {
  if (
    value.includes(",") ||
    value.includes('"') ||
    value.includes("\n") ||
    value.includes("\r")
  ) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function formatCellValue(value: unknown, format?: (v: unknown) => string): string {
  if (format) return format(value);
  if (value === null || value === undefined) return "";
  if (value instanceof Date) return value.toISOString().split("T")[0];
  if (typeof value === "number") return String(value);
  return String(value);
}

export function generateCsv(
  data: Record<string, unknown>[],
  columns: ExportColumn[],
): string {
  const header = columns.map((col) => escapeCsvCell(col.header)).join(",");
  const rows = data.map((row) =>
    columns
      .map((col) => escapeCsvCell(formatCellValue(row[col.key], col.format)))
      .join(","),
  );
  return [header, ...rows].join("\n");
}

function downloadBlob(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export interface ExportState {
  exporting: boolean;
  exportCsv: () => void;
  exportPdfMock: () => void;
}

export function useExport(
  data: Record<string, unknown>[],
  columns: ExportColumn[],
  filename: string,
): ExportState {
  const [exporting, setExporting] = useState(false);

  const exportCsv = useCallback(() => {
    setExporting(true);
    try {
      const csv = generateCsv(data, columns);
      downloadBlob(csv, `${filename}.csv`, "text/csv;charset=utf-8;");
    } finally {
      setExporting(false);
    }
  }, [data, columns, filename]);

  const exportPdfMock = useCallback(() => {
    setExporting(true);
    try {
      const csv = generateCsv(data, columns);
      downloadBlob(csv, `${filename}.pdf`, "application/pdf");
    } finally {
      setExporting(false);
    }
  }, [data, columns, filename]);

  return { exporting, exportCsv, exportPdfMock };
}
