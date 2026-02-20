import type { ReactNode } from 'react';
import { Button } from '../../../components/ui/Button';
import { Download } from 'lucide-react';

interface ReportHeaderProps {
  title: string;
  subtitle: string;
  children?: ReactNode;
  onExport?: () => void;
}

/**
 * Report page header with title, subtitle, optional controls (e.g. DateRangePicker),
 * and an Export button.
 */
export function ReportHeader({ subtitle, children, onExport }: ReportHeaderProps) {
  return (
    <div className="mb-6">
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-sm text-gray-500">{subtitle}</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={onExport}
          aria-label="Export report"
        >
          <Download className="w-4 h-4" />
          Export
        </Button>
      </div>
      {children && <div className="mb-4">{children}</div>}
    </div>
  );
}
