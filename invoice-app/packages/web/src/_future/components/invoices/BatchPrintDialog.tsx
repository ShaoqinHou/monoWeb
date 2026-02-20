import { useState } from 'react';
import { Dialog } from '../../../components/ui/Dialog';
import { Button } from '../../../components/ui/Button';
import { useBatchPrint, useBatchDownloadPdf, type PrintableEntityType } from '../hooks/useBatchPrint';

export interface PrintableItem {
  id: string;
  documentNumber: string;
  contactName: string;
  total: number;
}

export interface BatchPrintDialogProps {
  open: boolean;
  onClose: () => void;
  items: PrintableItem[];
  entityType: PrintableEntityType;
}

export function BatchPrintDialog({ open, onClose, items, entityType }: BatchPrintDialogProps) {
  const [printing, setPrinting] = useState(false);
  const printMutation = useBatchPrint();
  const pdfMutation = useBatchDownloadPdf();

  const estimatedPages = items.length; // ~1 page per document

  const handlePrint = async () => {
    setPrinting(true);
    try {
      await printMutation.mutateAsync({
        ids: items.map(i => i.id),
        entityType,
      });
    } catch {
      // print failed silently
    } finally {
      setPrinting(false);
    }
  };

  const handleDownloadPdf = async () => {
    try {
      await pdfMutation.mutateAsync({
        ids: items.map(i => i.id),
        entityType,
      });
    } catch {
      // download failed silently
    }
  };

  return (
    <Dialog open={open} onClose={onClose} title="Batch Print" className="max-w-lg">
      <div className="space-y-4">
        <p className="text-sm text-[#6b7280]">
          {items.length} document{items.length !== 1 ? 's' : ''} selected for printing
        </p>

        <div className="border rounded divide-y max-h-60 overflow-y-auto">
          {items.map(item => (
            <div key={item.id} className="px-3 py-2 text-sm flex justify-between items-center">
              <div>
                <span className="font-medium">{item.documentNumber}</span>
                <span className="text-[#6b7280] ml-2">{item.contactName}</span>
              </div>
              <span>${item.total.toFixed(2)}</span>
            </div>
          ))}
        </div>

        <p className="text-sm text-[#6b7280]">
          Estimated pages: {estimatedPages}
        </p>
      </div>

      <div className="flex justify-between mt-4 pt-4 border-t border-[#e5e7eb]">
        <Button variant="ghost" onClick={onClose}>
          Cancel
        </Button>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleDownloadPdf}
            loading={pdfMutation.isPending}
            data-testid="batch-download-pdf"
          >
            Download PDF
          </Button>
          <Button
            onClick={handlePrint}
            loading={printing}
            data-testid="batch-print-button"
          >
            Print All
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
