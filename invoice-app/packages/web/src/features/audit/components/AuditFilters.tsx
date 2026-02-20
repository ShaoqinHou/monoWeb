import { X } from 'lucide-react';

const ENTITY_TYPE_OPTIONS = [
  { value: '', label: 'All Types' },
  { value: 'invoice', label: 'Invoice' },
  { value: 'bill', label: 'Bill' },
  { value: 'contact', label: 'Contact' },
  { value: 'quote', label: 'Quote' },
  { value: 'credit-note', label: 'Credit Note' },
  { value: 'purchase-order', label: 'Purchase Order' },
  { value: 'payment', label: 'Payment' },
  { value: 'account', label: 'Account' },
  { value: 'journal', label: 'Journal' },
];

const ACTION_OPTIONS = [
  { value: '', label: 'All Actions' },
  { value: 'created', label: 'Created' },
  { value: 'updated', label: 'Updated' },
  { value: 'deleted', label: 'Deleted' },
  { value: 'status_changed', label: 'Status Changed' },
  { value: 'payment_recorded', label: 'Payment Recorded' },
  { value: 'sent', label: 'Sent' },
  { value: 'voided', label: 'Voided' },
  { value: 'approved', label: 'Approved' },
];

interface AuditFiltersProps {
  entityType: string;
  action: string;
  dateRange: { start: string; end: string };
  onEntityTypeChange: (type: string) => void;
  onActionChange: (action: string) => void;
  onDateRangeChange: (range: { start: string; end: string }) => void;
  onClear: () => void;
}

export function AuditFilters({
  entityType,
  action,
  dateRange,
  onEntityTypeChange,
  onActionChange,
  onDateRangeChange,
  onClear,
}: AuditFiltersProps) {
  return (
    <div className="flex items-center gap-3 flex-wrap py-3 px-4 bg-gray-50 rounded-lg border border-gray-200">
      {/* Entity Type */}
      <select
        data-testid="filter-entity-type"
        value={entityType}
        onChange={(e) => onEntityTypeChange(e.target.value)}
        className="rounded border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#0078c8]/20 focus:border-[#0078c8]"
      >
        {ENTITY_TYPE_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>

      {/* Action */}
      <select
        data-testid="filter-action"
        value={action}
        onChange={(e) => onActionChange(e.target.value)}
        className="rounded border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#0078c8]/20 focus:border-[#0078c8]"
      >
        {ACTION_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>

      {/* Date Range */}
      <div className="flex items-center gap-1.5">
        <label className="text-xs text-gray-500">From</label>
        <input
          data-testid="filter-start-date"
          type="date"
          value={dateRange.start}
          onChange={(e) => onDateRangeChange({ ...dateRange, start: e.target.value })}
          className="rounded border border-gray-300 bg-white px-2 py-1.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#0078c8]/20 focus:border-[#0078c8]"
        />
        <label className="text-xs text-gray-500">To</label>
        <input
          data-testid="filter-end-date"
          type="date"
          value={dateRange.end}
          onChange={(e) => onDateRangeChange({ ...dateRange, end: e.target.value })}
          className="rounded border border-gray-300 bg-white px-2 py-1.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#0078c8]/20 focus:border-[#0078c8]"
        />
      </div>

      {/* Clear button */}
      <button
        data-testid="clear-filters-btn"
        onClick={onClear}
        className="inline-flex items-center gap-1 rounded px-2 py-1.5 text-xs text-gray-500 hover:text-gray-700 hover:bg-gray-200 transition-colors"
      >
        <X className="w-3 h-3" />
        Clear
      </button>
    </div>
  );
}
