import { useState, useEffect, useRef } from 'react';

export function useDeferredFilter<T>(value: T, delayMs: number = 300): T {
  const [deferredValue, setDeferredValue] = useState(value);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      setDeferredValue(value);
    }, delayMs);

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [value, delayMs]);

  return deferredValue;
}
