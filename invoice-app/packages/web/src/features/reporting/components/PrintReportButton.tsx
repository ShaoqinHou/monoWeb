import { Printer } from 'lucide-react';
import { Button } from '../../../components/ui/Button';

interface PrintReportButtonProps {
  onPrint: () => void;
  preparing?: boolean;
}

/**
 * Button that triggers report printing.
 * Shows "Preparing..." briefly before the print dialog appears.
 */
export function PrintReportButton({ onPrint, preparing = false }: PrintReportButtonProps) {
  return (
    <Button
      variant="secondary"
      size="sm"
      onClick={onPrint}
      disabled={preparing}
      data-testid="print-report-button"
    >
      <Printer className="h-4 w-4" />
      {preparing ? 'Preparing...' : 'Print'}
    </Button>
  );
}
