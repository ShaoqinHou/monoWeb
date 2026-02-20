import { useState, useEffect } from 'react';

export function usePrintMode(): { isPrinting: boolean } {
  const [isPrinting, setIsPrinting] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('print');

    function handleChange(e: MediaQueryListEvent) {
      setIsPrinting(e.matches);
    }

    // Handle beforeprint/afterprint for broader browser support
    function handleBeforePrint() {
      setIsPrinting(true);
    }

    function handleAfterPrint() {
      setIsPrinting(false);
    }

    mediaQuery.addEventListener('change', handleChange);
    window.addEventListener('beforeprint', handleBeforePrint);
    window.addEventListener('afterprint', handleAfterPrint);

    return () => {
      mediaQuery.removeEventListener('change', handleChange);
      window.removeEventListener('beforeprint', handleBeforePrint);
      window.removeEventListener('afterprint', handleAfterPrint);
    };
  }, []);

  return { isPrinting };
}
