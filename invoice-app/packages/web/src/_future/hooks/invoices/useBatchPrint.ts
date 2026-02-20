import { useMutation } from '@tanstack/react-query';
import { apiPost } from '../../../lib/api-helpers';

export type PrintableEntityType = 'invoices' | 'bills' | 'quotes';

export interface PrintPreviewData {
  id: string;
  documentNumber: string;
  contactName: string;
  total: number;
  date: string;
}

export interface BatchPrintRequest {
  ids: string[];
  entityType: PrintableEntityType;
}

export interface BatchPrintResult {
  documents: PrintPreviewData[];
  estimatedPages: number;
}

/** Prepare batch print view with all selected documents */
export function useBatchPrint() {
  return useMutation({
    mutationFn: (request: BatchPrintRequest) =>
      apiPost<BatchPrintResult>(`/${request.entityType}/batch-print-preview`, { ids: request.ids }),
    onSuccess: () => {
      window.print();
    },
  });
}

/** Batch PDF download is not available in the demo app */
export function useBatchDownloadPdf() {
  return useMutation({
    mutationFn: async (_request: BatchPrintRequest) => {
      // PDF generation is not available in the demo app
      return null;
    },
    onSuccess: () => {
      alert('PDF download is not available in the demo app. Use Print instead.');
    },
  });
}
