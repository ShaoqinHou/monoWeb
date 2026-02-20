import { useState } from 'react';
import { Input } from '../../../components/ui/Input';
import { Button } from '../../../components/ui/Button';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '../../../components/ui/Table';
import { Plus, Trash2 } from 'lucide-react';

const MONTH_LABELS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

export interface BudgetLineInput {
  accountCode: string;
  accountName: string;
  month1: number;
  month2: number;
  month3: number;
  month4: number;
  month5: number;
  month6: number;
  month7: number;
  month8: number;
  month9: number;
  month10: number;
  month11: number;
  month12: number;
}

interface BudgetEditorProps {
  name: string;
  financialYear: string;
  lines: BudgetLineInput[];
  onNameChange: (name: string) => void;
  onYearChange: (year: string) => void;
  onLinesChange: (lines: BudgetLineInput[]) => void;
  onSave: () => void;
  onCancel: () => void;
  saving?: boolean;
}

function emptyLine(): BudgetLineInput {
  return {
    accountCode: '',
    accountName: '',
    month1: 0, month2: 0, month3: 0, month4: 0,
    month5: 0, month6: 0, month7: 0, month8: 0,
    month9: 0, month10: 0, month11: 0, month12: 0,
  };
}

function lineTotal(line: BudgetLineInput): number {
  let sum = 0;
  for (let i = 1; i <= 12; i++) {
    sum += line[`month${i}` as keyof BudgetLineInput] as number;
  }
  return sum;
}

export function BudgetEditor({
  name,
  financialYear,
  lines,
  onNameChange,
  onYearChange,
  onLinesChange,
  onSave,
  onCancel,
  saving = false,
}: BudgetEditorProps) {
  const addLine = () => {
    onLinesChange([...lines, emptyLine()]);
  };

  const removeLine = (index: number) => {
    onLinesChange(lines.filter((_, i) => i !== index));
  };

  const updateLine = (index: number, field: string, value: string | number) => {
    const updated = [...lines];
    updated[index] = { ...updated[index], [field]: value };
    onLinesChange(updated);
  };

  const grandTotal = lines.reduce((sum, line) => sum + lineTotal(line), 0);

  return (
    <div className="space-y-6" data-testid="budget-editor">
      {/* Budget metadata */}
      <div className="flex gap-4">
        <div className="flex-1">
          <Input
            label="Budget Name"
            value={name}
            onChange={(e) => onNameChange(e.target.value)}
            placeholder="e.g. FY2026 Operating Budget"
          />
        </div>
        <div className="w-48">
          <Input
            label="Financial Year"
            value={financialYear}
            onChange={(e) => onYearChange(e.target.value)}
            placeholder="e.g. 2026"
          />
        </div>
      </div>

      {/* 12-month grid */}
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="min-w-[120px]">Account Code</TableHead>
              <TableHead className="min-w-[160px]">Account Name</TableHead>
              {MONTH_LABELS.map((label) => (
                <TableHead key={label} className="text-right min-w-[80px]">
                  {label}
                </TableHead>
              ))}
              <TableHead className="text-right min-w-[100px]">Total</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {lines.length === 0 ? (
              <TableRow>
                <td colSpan={16} className="px-4 py-8 text-center text-[#6b7280]">
                  No budget lines. Click "Add Line" to start.
                </td>
              </TableRow>
            ) : (
              lines.map((line, index) => (
                <TableRow key={index}>
                  <TableCell className="p-1">
                    <input
                      type="text"
                      className="w-full border border-gray-200 rounded px-2 py-1 text-sm"
                      value={line.accountCode}
                      onChange={(e) => updateLine(index, 'accountCode', e.target.value)}
                      placeholder="Code"
                      aria-label={`Account code for line ${index + 1}`}
                    />
                  </TableCell>
                  <TableCell className="p-1">
                    <input
                      type="text"
                      className="w-full border border-gray-200 rounded px-2 py-1 text-sm"
                      value={line.accountName}
                      onChange={(e) => updateLine(index, 'accountName', e.target.value)}
                      placeholder="Name"
                      aria-label={`Account name for line ${index + 1}`}
                    />
                  </TableCell>
                  {Array.from({ length: 12 }, (_, m) => {
                    const field = `month${m + 1}` as keyof BudgetLineInput;
                    return (
                      <TableCell key={m} className="p-1">
                        <input
                          type="number"
                          className="w-full border border-gray-200 rounded px-2 py-1 text-sm text-right"
                          value={line[field] as number}
                          onChange={(e) =>
                            updateLine(index, field, parseFloat(e.target.value) || 0)
                          }
                          aria-label={`${MONTH_LABELS[m]} amount for line ${index + 1}`}
                        />
                      </TableCell>
                    );
                  })}
                  <TableCell className="text-right font-medium tabular-nums">
                    {lineTotal(line).toLocaleString('en-NZ', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </TableCell>
                  <TableCell className="p-1">
                    <button
                      onClick={() => removeLine(index)}
                      className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                      aria-label={`Remove line ${index + 1}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </TableCell>
                </TableRow>
              ))
            )}
            {lines.length > 0 && (
              <TableRow className="font-bold bg-gray-50">
                <TableCell colSpan={14} className="text-right">
                  Grand Total
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {grandTotal.toLocaleString('en-NZ', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </TableCell>
                <TableCell />
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Actions */}
      <div className="sticky bottom-0 z-10 bg-white border-t py-3 flex items-center justify-between">
        <Button variant="outline" size="sm" onClick={addLine}>
          <Plus className="h-4 w-4 mr-1" />
          Add Line
        </Button>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={onCancel}>
            Cancel
          </Button>
          <Button onClick={onSave} loading={saving}>
            Save Budget
          </Button>
        </div>
      </div>
    </div>
  );
}
