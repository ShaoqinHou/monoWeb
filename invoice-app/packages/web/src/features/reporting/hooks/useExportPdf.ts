import { useCallback } from 'react';

export function useExportPdf() {
  return useCallback(() => {
    window.print();
  }, []);
}
