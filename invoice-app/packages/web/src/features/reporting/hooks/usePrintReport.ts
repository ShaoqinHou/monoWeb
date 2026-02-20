import { useRef, useCallback, useState } from 'react';

const PRINT_CLASS = 'xero-print-mode';

/**
 * Hook for printing a report container.
 * Returns a ref to attach to the report element and a handler to trigger print.
 */
export function usePrintReport() {
  const printRef = useRef<HTMLDivElement>(null);
  const [preparing, setPreparing] = useState(false);

  const handlePrint = useCallback(() => {
    const el = printRef.current;
    if (!el) return;

    setPreparing(true);
    el.classList.add(PRINT_CLASS);

    // Allow a brief tick so the UI can show "Preparing..." before the print dialog blocks
    requestAnimationFrame(() => {
      window.print();
      el.classList.remove(PRINT_CLASS);
      setPreparing(false);
    });
  }, []);

  return { printRef, handlePrint, preparing };
}

export { PRINT_CLASS };
