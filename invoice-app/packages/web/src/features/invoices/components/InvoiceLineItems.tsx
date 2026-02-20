import { useState, useRef, useEffect } from 'react';
import { Button } from '../../../components/ui/Button';
import { Plus, ChevronDown, Columns3 } from 'lucide-react';
import { InvoiceLineRow } from './InvoiceLineRow';
import type { InvoiceAmountType } from '@xero-replica/shared';
import type { FormLineItem } from '../types';

interface InvoiceLineItemsProps {
  lineItems: FormLineItem[];
  amountType: InvoiceAmountType;
  onChange: (lineItems: FormLineItem[]) => void;
  items?: Array<{code: string; name: string; salePrice: number}>;
  onCreateNewItem?: () => void;
  accountOptions?: Array<{ value: string; label: string }>;
  taxRateOptions?: Array<{ value: string; label: string }>;
  regionOptions?: Array<{ value: string; label: string }>;
  projectOptions?: Array<{ value: string; label: string }>;
  onCreateNewAccount?: () => void;
  onCreateNewTaxRate?: () => void;
  onCreateNewRegion?: () => void;
}

const TOGGLEABLE_COLS = ['item', 'discount', 'region', 'project'] as const;

function createEmptyLine(): FormLineItem {
  return {
    key: crypto.randomUUID(),
    description: '',
    quantity: 1,
    unitPrice: 0,
    accountCode: '200',
    taxRate: 15,
    discount: 0,
    discountType: 'percent',
    itemCode: '',
    region: '',
    project: '',
  };
}

export function InvoiceLineItems({ lineItems, amountType, onChange, items, onCreateNewItem, accountOptions, taxRateOptions, regionOptions, projectOptions, onCreateNewAccount, onCreateNewTaxRate, onCreateNewRegion }: InvoiceLineItemsProps) {
  const [hiddenCols, setHiddenCols] = useState<Set<string>>(new Set());
  const [colMenuOpen, setColMenuOpen] = useState(false);
  const [addMenuOpen, setAddMenuOpen] = useState(false);
  const [dragIndex, setDragIndex] = useState<number | null>(null);

  const colMenuRef = useRef<HTMLDivElement>(null);
  const addMenuRef = useRef<HTMLDivElement>(null);

  // Click-outside for column menu
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (colMenuRef.current && !colMenuRef.current.contains(e.target as Node)) setColMenuOpen(false);
    }
    if (colMenuOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [colMenuOpen]);

  // Click-outside for add-row menu
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (addMenuRef.current && !addMenuRef.current.contains(e.target as Node)) setAddMenuOpen(false);
    }
    if (addMenuOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [addMenuOpen]);

  const handleFieldChange = (
    index: number,
    field: keyof FormLineItem,
    value: string | number,
  ) => {
    const updated = [...lineItems];
    updated[index] = { ...updated[index], [field]: value };
    onChange(updated);
  };

  const handleBatchChange = (index: number, changes: Partial<FormLineItem>) => {
    const updated = [...lineItems];
    updated[index] = { ...updated[index], ...changes };
    onChange(updated);
  };

  const handleAddLine = () => {
    onChange([...lineItems, createEmptyLine()]);
  };

  const handleRemoveLine = (index: number) => {
    if (lineItems.length <= 1) return; // Always keep at least 1 row
    const updated = lineItems.filter((_, i) => i !== index);
    onChange(updated);
  };

  const handleToggleCol = (col: string) => {
    setHiddenCols((prev) => {
      const next = new Set(prev);
      if (next.has(col)) {
        next.delete(col);
      } else {
        next.add(col);
      }
      return next;
    });
  };

  const handleAdd5Rows = () => {
    onChange([...lineItems, ...Array.from({ length: 5 }, () => createEmptyLine())]);
    setAddMenuOpen(false);
  };

  const handleCopyLastRow = () => {
    const last = lineItems[lineItems.length - 1];
    onChange([...lineItems, { ...last, key: crypto.randomUUID() }]);
    setAddMenuOpen(false);
  };

  const handleDragStart = (index: number) => setDragIndex(index);
  const handleDrop = (targetIndex: number) => {
    if (dragIndex === null || dragIndex === targetIndex) return;
    const updated = [...lineItems];
    const [moved] = updated.splice(dragIndex, 1);
    updated.splice(targetIndex, 0, moved);
    onChange(updated);
    setDragIndex(null);
  };

  return (
    <div data-testid="invoice-line-items">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-200 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
            <th className="py-2 w-8" data-testid="col-drag"></th>
            {!hiddenCols.has('item') && <th className="py-2 px-2 w-32" data-testid="col-item">Item</th>}
            <th className="py-2 pr-2">Description</th>
            <th className="py-2 px-2 w-24">Qty.</th>
            <th className="py-2 px-2 w-32">Price</th>
            {!hiddenCols.has('discount') && <th className="py-2 px-2 w-36">Disc.</th>}
            <th className="py-2 px-2 w-40">Account</th>
            <th className="py-2 px-2 w-44">Tax rate</th>
            <th className="py-2 px-2 w-20 text-right" data-testid="col-tax-amount">Tax amount</th>
            {!hiddenCols.has('region') && <th className="py-2 px-2 w-28" data-testid="col-region">Region</th>}
            {!hiddenCols.has('project') && <th className="py-2 px-2 w-28" data-testid="col-project">Project</th>}
            <th className="py-2 px-2 w-28 text-right">Amount NZD</th>
            <th className="py-2 pl-2 w-10"></th>
          </tr>
        </thead>
        <tbody>
          {lineItems.map((line, index) => (
            <InvoiceLineRow
              key={line.key}
              line={line}
              index={index}
              amountType={amountType}
              canRemove={lineItems.length > 1}
              onChange={handleFieldChange}
              onBatchChange={handleBatchChange}
              onRemove={handleRemoveLine}
              items={items}
              onCreateNewItem={onCreateNewItem}
              hiddenCols={hiddenCols}
              onDragStart={handleDragStart}
              onDrop={handleDrop}
              accountOptions={accountOptions}
              taxRateOptions={taxRateOptions}
              regionOptions={regionOptions}
              projectOptions={projectOptions}
              onCreateNewAccount={onCreateNewAccount}
              onCreateNewTaxRate={onCreateNewTaxRate}
              onCreateNewRegion={onCreateNewRegion}
            />
          ))}
        </tbody>
      </table>

      <div className="mt-3 flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleAddLine}
          data-testid="add-line-button"
        >
          <Plus className="h-4 w-4 mr-1" />
          Add row
        </Button>

        {/* Stub 2: Add row options dropdown */}
        <div className="relative" ref={addMenuRef}>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setAddMenuOpen(!addMenuOpen)}
            data-testid="add-row-options-button"
          >
            <ChevronDown className="h-4 w-4" />
            <span className="sr-only">Add row options</span>
          </Button>
          {addMenuOpen && (
            <div className="absolute left-0 top-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-10 py-1 min-w-[160px]" data-testid="add-row-options-menu">
              <button
                className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50"
                onClick={handleAdd5Rows}
                data-testid="add-5-rows"
              >
                Add 5 rows
              </button>
              <button
                className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50"
                onClick={handleCopyLastRow}
                data-testid="copy-last-row"
              >
                Copy last row
              </button>
            </div>
          )}
        </div>

        <div className="flex-1" />

        {/* Stub 1: Column toggle dropdown */}
        <div className="relative" ref={colMenuRef}>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setColMenuOpen(!colMenuOpen)}
            data-testid="columns-toggle-button"
          >
            <Columns3 className="h-4 w-4 mr-1" />
            Columns ({hiddenCols.size} hidden)
          </Button>
          {colMenuOpen && (
            <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-10 py-2 min-w-[180px]" data-testid="columns-toggle-menu">
              {TOGGLEABLE_COLS.map((col) => (
                <label
                  key={col}
                  className="flex items-center gap-2 px-3 py-1.5 text-sm hover:bg-gray-50 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={!hiddenCols.has(col)}
                    onChange={() => handleToggleCol(col)}
                    data-testid={`col-toggle-${col}`}
                    className="rounded border-gray-300"
                  />
                  <span className="capitalize">{col}</span>
                </label>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export { createEmptyLine };
