import { useState, useCallback, useMemo } from 'react';
import { Select } from '../../../components/ui/Select';
import { Input } from '../../../components/ui/Input';
import type { DateRange, DateRangePreset } from '../types';

interface DateRangePickerProps {
  value: DateRange;
  onChange: (range: DateRange) => void;
}

const PRESET_OPTIONS = [
  { value: 'this-month', label: 'This Month' },
  { value: 'last-month', label: 'Last Month' },
  { value: 'this-quarter', label: 'This Quarter' },
  { value: 'last-quarter', label: 'Last Quarter' },
  { value: 'this-year', label: 'This Year' },
  { value: 'last-year', label: 'Last Year' },
  { value: 'custom', label: 'Custom' },
];

function getPresetRange(preset: DateRangePreset): DateRange {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth(); // 0-indexed

  switch (preset) {
    case 'this-month':
      return {
        from: new Date(year, month, 1).toISOString().slice(0, 10),
        to: new Date(year, month + 1, 0).toISOString().slice(0, 10),
      };
    case 'last-month':
      return {
        from: new Date(year, month - 1, 1).toISOString().slice(0, 10),
        to: new Date(year, month, 0).toISOString().slice(0, 10),
      };
    case 'this-quarter': {
      const qStart = Math.floor(month / 3) * 3;
      return {
        from: new Date(year, qStart, 1).toISOString().slice(0, 10),
        to: new Date(year, qStart + 3, 0).toISOString().slice(0, 10),
      };
    }
    case 'last-quarter': {
      const lastQStart = Math.floor(month / 3) * 3 - 3;
      const lqYear = lastQStart < 0 ? year - 1 : year;
      const lqMonth = lastQStart < 0 ? lastQStart + 12 : lastQStart;
      return {
        from: new Date(lqYear, lqMonth, 1).toISOString().slice(0, 10),
        to: new Date(lqYear, lqMonth + 3, 0).toISOString().slice(0, 10),
      };
    }
    case 'this-year':
      return {
        from: `${year}-01-01`,
        to: `${year}-12-31`,
      };
    case 'last-year':
      return {
        from: `${year - 1}-01-01`,
        to: `${year - 1}-12-31`,
      };
    case 'custom':
    default:
      return {
        from: `${year}-01-01`,
        to: `${year}-12-31`,
      };
  }
}

/**
 * Detect which preset (if any) matches the current DateRange.
 */
function detectPreset(range: DateRange): DateRangePreset {
  const presets: DateRangePreset[] = [
    'this-month',
    'last-month',
    'this-quarter',
    'last-quarter',
    'this-year',
    'last-year',
  ];
  for (const p of presets) {
    const r = getPresetRange(p);
    if (r.from === range.from && r.to === range.to) return p;
  }
  return 'custom';
}

/**
 * Date range selector with preset options and custom date inputs.
 */
export function DateRangePicker({ value, onChange }: DateRangePickerProps) {
  const detectedPreset = useMemo(() => detectPreset(value), [value]);
  const [preset, setPreset] = useState<DateRangePreset>(detectedPreset);

  const handlePresetChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const newPreset = e.target.value as DateRangePreset;
      setPreset(newPreset);
      if (newPreset !== 'custom') {
        onChange(getPresetRange(newPreset));
      }
    },
    [onChange],
  );

  const handleFromChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onChange({ ...value, from: e.target.value });
    },
    [value, onChange],
  );

  const handleToChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onChange({ ...value, to: e.target.value });
    },
    [value, onChange],
  );

  return (
    <div className="flex items-end gap-3" data-testid="date-range-picker">
      <div className="w-44">
        <Select
          label="Period"
          selectId="report-period"
          options={PRESET_OPTIONS}
          value={preset}
          onChange={handlePresetChange}
        />
      </div>
      {preset === 'custom' && (
        <>
          <div className="w-40">
            <Input
              label="From"
              inputId="report-from"
              type="date"
              value={value.from}
              onChange={handleFromChange}
            />
          </div>
          <div className="w-40">
            <Input
              label="To"
              inputId="report-to"
              type="date"
              value={value.to}
              onChange={handleToChange}
            />
          </div>
        </>
      )}
    </div>
  );
}

export { getPresetRange };
