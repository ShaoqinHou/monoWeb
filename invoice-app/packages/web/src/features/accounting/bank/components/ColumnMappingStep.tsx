import type { CsvColumnMapping } from './CsvParser';

interface ColumnMappingStepProps {
  headers: string[];
  sampleRows: string[][];
  mapping: CsvColumnMapping;
  onMappingChange: (mapping: CsvColumnMapping) => void;
}

interface MappingField {
  key: keyof CsvColumnMapping;
  label: string;
  required: boolean;
}

const MAPPING_FIELDS: MappingField[] = [
  { key: 'date', label: 'Date Column', required: true },
  { key: 'description', label: 'Description Column', required: true },
  { key: 'amount', label: 'Amount Column', required: true },
  { key: 'reference', label: 'Reference Column', required: false },
];

export function ColumnMappingStep({
  headers,
  sampleRows,
  mapping,
  onMappingChange,
}: ColumnMappingStepProps) {
  const handleFieldChange = (field: keyof CsvColumnMapping, value: string) => {
    const numValue = parseInt(value, 10);
    const newMapping = { ...mapping };

    if (isNaN(numValue) || numValue < 0) {
      // "None" selected for optional field -> remove it
      delete newMapping[field];
    } else {
      newMapping[field] = numValue;
    }

    onMappingChange(newMapping);
  };

  return (
    <div className="space-y-4">
      {/* Field mapping dropdowns */}
      <div className="grid grid-cols-2 gap-3">
        {MAPPING_FIELDS.map((field) => (
          <div key={field.key}>
            <label
              htmlFor={`mapping-${field.key}`}
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              {field.label}
              {field.required && <span className="text-red-500 ml-0.5">*</span>}
            </label>
            <select
              id={`mapping-${field.key}`}
              aria-label={field.label}
              className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
              value={mapping[field.key] ?? -1}
              onChange={(e) => handleFieldChange(field.key, e.target.value)}
            >
              {!field.required && <option value={-1}>-- None --</option>}
              {headers.map((header, idx) => (
                <option key={idx} value={idx}>
                  {header}
                </option>
              ))}
            </select>
          </div>
        ))}
      </div>

      {/* Preview table */}
      {sampleRows.length > 0 && (
        <div>
          <p className="text-sm font-medium text-gray-700 mb-2">Preview (first 3 rows)</p>
          <div className="overflow-x-auto rounded border border-gray-200">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-gray-50 border-b">
                  {headers.map((header, idx) => (
                    <th key={idx} className="text-left px-3 py-2 font-medium text-gray-600">
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sampleRows.slice(0, 3).map((row, rowIdx) => (
                  <tr key={rowIdx} className="border-b border-gray-100">
                    {row.map((cell, cellIdx) => (
                      <td key={cellIdx} className="px-3 py-1.5 text-gray-900">
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
