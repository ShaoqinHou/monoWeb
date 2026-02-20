import type { CompareMode } from '../hooks/useReportComparison';

interface PeriodCompareToggleProps {
  enabled: boolean;
  onChange: (enabled: boolean) => void;
  compareMode?: CompareMode;
  onCompareModeChange?: (mode: CompareMode) => void;
}

export function PeriodCompareToggle({
  enabled,
  onChange,
  compareMode = 'prior-period',
  onCompareModeChange,
}: PeriodCompareToggleProps) {
  return (
    <div className="inline-flex items-center gap-3" data-testid="period-compare-toggle">
      <label className="inline-flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={enabled}
          onChange={(e) => onChange(e.target.checked)}
          className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          data-testid="compare-checkbox"
        />
        <span className="text-sm text-gray-700">Compare</span>
      </label>
      {enabled && (
        <select
          value={compareMode}
          onChange={(e) => onCompareModeChange?.(e.target.value as CompareMode)}
          className="text-sm border border-gray-300 rounded-md px-2 py-1 bg-white text-gray-700"
          data-testid="compare-mode-select"
        >
          <option value="prior-period">vs Prior Period</option>
          <option value="same-period-last-year">vs Same Period Last Year</option>
        </select>
      )}
    </div>
  );
}
