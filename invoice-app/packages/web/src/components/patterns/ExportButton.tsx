import { useState } from "react";
import { Button } from "../ui/Button";
import { Download, FileText, FileSpreadsheet } from "lucide-react";
import type { ExportState } from "../../lib/useExport";

export interface ExportButtonProps {
  exportState: ExportState;
}

export function ExportButton({ exportState }: ExportButtonProps) {
  const { exporting, exportCsv, exportPdfMock } = exportState;
  const [open, setOpen] = useState(false);

  return (
    <div className="relative" data-testid="export-button">
      <Button
        size="sm"
        variant="outline"
        onClick={() => setOpen(!open)}
        loading={exporting}
        data-testid="export-toggle"
      >
        <Download className="h-3 w-3 mr-1" />
        {exporting ? "Exporting..." : "Export"}
      </Button>

      {open && !exporting && (
        <div
          className="absolute right-0 top-full z-10 mt-1 w-48 rounded-lg border border-[#e5e7eb] bg-white shadow-lg"
          data-testid="export-dropdown"
        >
          <ul className="py-1">
            <li>
              <button
                className="flex w-full items-center gap-2 px-4 py-2 text-sm text-[#1a1a2e] hover:bg-gray-50"
                onClick={() => {
                  exportCsv();
                  setOpen(false);
                }}
                data-testid="export-csv"
              >
                <FileSpreadsheet className="h-4 w-4 text-[#14b8a6]" />
                Export as CSV
              </button>
            </li>
            <li>
              <button
                className="flex w-full items-center gap-2 px-4 py-2 text-sm text-[#1a1a2e] hover:bg-gray-50"
                onClick={() => {
                  exportPdfMock();
                  setOpen(false);
                }}
                data-testid="export-pdf"
              >
                <FileText className="h-4 w-4 text-[#ef4444]" />
                Export as PDF
              </button>
            </li>
          </ul>
        </div>
      )}
    </div>
  );
}
