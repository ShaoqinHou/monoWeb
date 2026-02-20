import { Button } from '../../../components/ui/Button';
import { Select } from '../../../components/ui/Select';
import { Input } from '../../../components/ui/Input';
import type { SmartListFilter, SmartListField, SmartListOperator } from '../hooks/useSmartLists';

const FIELD_OPTIONS = [
  { value: 'contactType', label: 'Contact Type' },
  { value: 'name', label: 'Name' },
  { value: 'email', label: 'Email' },
  { value: 'city', label: 'City' },
  { value: 'outstandingBalance', label: 'Outstanding Balance' },
  { value: 'overdueBalance', label: 'Overdue Balance' },
  { value: 'lastActivityDate', label: 'Last Activity Date' },
  { value: 'isArchived', label: 'Is Archived' },
];

const OPERATOR_OPTIONS = [
  { value: 'equals', label: 'Equals' },
  { value: 'contains', label: 'Contains' },
  { value: 'greaterThan', label: 'Greater Than' },
  { value: 'lessThan', label: 'Less Than' },
];

interface SmartListBuilderProps {
  filters: SmartListFilter[];
  onChange: (filters: SmartListFilter[]) => void;
}

export function SmartListBuilder({ filters, onChange }: SmartListBuilderProps) {
  function addFilter() {
    onChange([
      ...filters,
      { field: 'name', operator: 'contains', value: '' },
    ]);
  }

  function removeFilter(index: number) {
    onChange(filters.filter((_, i) => i !== index));
  }

  function updateFilter(index: number, patch: Partial<SmartListFilter>) {
    onChange(filters.map((f, i) => (i === index ? { ...f, ...patch } : f)));
  }

  return (
    <div className="space-y-3" data-testid="smart-list-builder">
      {filters.map((filter, index) => (
        <div key={index} className="flex items-end gap-2" data-testid={`filter-row-${index}`}>
          <Select
            label={index === 0 ? 'Field' : undefined}
            options={FIELD_OPTIONS}
            value={filter.field}
            onChange={(e) =>
              updateFilter(index, { field: e.target.value as SmartListField })
            }
            selectId={`filter-field-${index}`}
            data-testid={`filter-field-${index}`}
          />
          <Select
            label={index === 0 ? 'Operator' : undefined}
            options={OPERATOR_OPTIONS}
            value={filter.operator}
            onChange={(e) =>
              updateFilter(index, { operator: e.target.value as SmartListOperator })
            }
            selectId={`filter-op-${index}`}
            data-testid={`filter-op-${index}`}
          />
          <Input
            label={index === 0 ? 'Value' : undefined}
            placeholder="Filter value"
            value={filter.value}
            onChange={(e) => updateFilter(index, { value: e.target.value })}
            inputId={`filter-value-${index}`}
            data-testid={`filter-value-${index}`}
          />
          <Button
            variant="ghost"
            size="sm"
            onClick={() => removeFilter(index)}
            aria-label={`Remove filter ${index}`}
            data-testid={`filter-remove-${index}`}
          >
            Remove
          </Button>
        </div>
      ))}
      <Button
        variant="outline"
        size="sm"
        onClick={addFilter}
        data-testid="add-filter-btn"
      >
        Add Filter
      </Button>
    </div>
  );
}
