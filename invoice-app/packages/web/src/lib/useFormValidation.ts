import { useState, useCallback } from 'react';

interface UseFormValidationReturn {
  touchField: (field: string) => void;
  isTouched: (field: string) => boolean;
  resetTouched: () => void;
  touchedFields: Set<string>;
}

export function useFormValidation(): UseFormValidationReturn {
  const [touchedFields, setTouchedFields] = useState<Set<string>>(new Set());

  const touchField = useCallback((field: string) => {
    setTouchedFields((prev) => {
      if (prev.has(field)) return prev;
      const next = new Set(prev);
      next.add(field);
      return next;
    });
  }, []);

  const isTouched = useCallback((field: string) => {
    return touchedFields.has(field);
  }, [touchedFields]);

  const resetTouched = useCallback(() => {
    setTouchedFields(new Set());
  }, []);

  return { touchField, isTouched, resetTouched, touchedFields };
}
