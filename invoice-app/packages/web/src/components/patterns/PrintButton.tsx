import { Printer } from 'lucide-react';
import { Button } from '../ui/Button';

interface PrintButtonProps {
  label?: string;
  className?: string;
}

export function PrintButton({ label = 'Print', className }: PrintButtonProps) {
  return (
    <Button
      variant="secondary"
      size="sm"
      onClick={() => window.print()}
      className={className}
      data-testid="print-button"
    >
      <Printer className="h-4 w-4 mr-1" />
      {label}
    </Button>
  );
}

export type { PrintButtonProps };
