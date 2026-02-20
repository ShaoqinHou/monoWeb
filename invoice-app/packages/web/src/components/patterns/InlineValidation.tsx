import { AlertCircle } from 'lucide-react';

interface InlineValidationProps {
  error: string | null | undefined;
  touched?: boolean;
}

export function InlineValidation({ error, touched = true }: InlineValidationProps) {
  if (!error || !touched) return null;

  return (
    <div
      className="flex items-center gap-1 mt-1 text-sm text-red-600 animate-in fade-in duration-200"
      role="alert"
      data-testid="field-error"
    >
      <AlertCircle className="h-3.5 w-3.5 shrink-0" />
      <span>{error}</span>
    </div>
  );
}

export type { InlineValidationProps };
