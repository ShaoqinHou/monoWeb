import { useState } from 'react';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Combobox } from '../../../components/ui/Combobox';
import type { CreateProduct } from '@xero-replica/shared';

const DEFAULT_ACCOUNT_CODE_OPTIONS = [
  { value: '200', label: '200', description: 'Sales' },
  { value: '260', label: '260', description: 'Other Revenue' },
  { value: '300', label: '300', description: 'Advertising' },
  { value: '310', label: '310', description: 'Bank Fees' },
  { value: '320', label: '320', description: 'Cleaning' },
  { value: '325', label: '325', description: 'Consulting & Accounting' },
  { value: '400', label: '400', description: 'Computer Equipment' },
  { value: '404', label: '404', description: 'Entertainment' },
  { value: '408', label: '408', description: 'General Expenses' },
  { value: '412', label: '412', description: 'Insurance' },
  { value: '416', label: '416', description: 'Light, Power, Heating' },
  { value: '420', label: '420', description: 'Motor Vehicle Expenses' },
  { value: '429', label: '429', description: 'Office Expenses' },
  { value: '433', label: '433', description: 'Printing & Stationery' },
  { value: '437', label: '437', description: 'Rent' },
  { value: '441', label: '441', description: 'Subscriptions' },
  { value: '445', label: '445', description: 'Telephone & Internet' },
];

const DEFAULT_TAX_RATE_OPTIONS = [
  { value: '15', label: 'GST on Expenses (15%)' },
  { value: '0', label: 'No GST (0%)' },
  { value: '9', label: 'GST on Imports (9%)' },
];

interface ProductFormProps {
  initialData?: Partial<CreateProduct>;
  onSubmit: (data: CreateProduct) => void;
  isLoading?: boolean;
  accountOptions?: Array<{ value: string; label: string; description?: string }>;
  taxRateOptions?: Array<{ value: string; label: string }>;
  onCreateNewAccount?: () => void;
}

export function ProductForm({ initialData, onSubmit, isLoading, accountOptions, taxRateOptions, onCreateNewAccount }: ProductFormProps) {
  const resolvedAccountOptions = accountOptions && accountOptions.length > 0 ? accountOptions : DEFAULT_ACCOUNT_CODE_OPTIONS;
  const resolvedTaxRateOptions = taxRateOptions && taxRateOptions.length > 0 ? taxRateOptions : DEFAULT_TAX_RATE_OPTIONS;
  const [code, setCode] = useState(initialData?.code ?? '');
  const [name, setName] = useState(initialData?.name ?? '');
  const [description, setDescription] = useState(initialData?.description ?? '');
  const [salePrice, setSalePrice] = useState(initialData?.salePrice?.toString() ?? '');
  const [purchasePrice, setPurchasePrice] = useState(initialData?.purchasePrice?.toString() ?? '');
  const [accountCode, setAccountCode] = useState(initialData?.accountCode ?? '');
  const [taxRate, setTaxRate] = useState(initialData?.taxRate?.toString() ?? '15');
  const [isTracked, setIsTracked] = useState(initialData?.isTracked ?? false);
  const [quantityOnHand, setQuantityOnHand] = useState(
    initialData?.quantityOnHand?.toString() ?? '0',
  );
  const [isSold, setIsSold] = useState(initialData?.isSold ?? true);
  const [isPurchased, setIsPurchased] = useState(initialData?.isPurchased ?? true);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim() || !name.trim()) return;

    const data: CreateProduct = {
      code: code.trim(),
      name: name.trim(),
      description: description || undefined,
      salePrice: parseFloat(salePrice) || 0,
      purchasePrice: parseFloat(purchasePrice) || 0,
      accountCode: accountCode || undefined,
      taxRate: parseFloat(taxRate) || 15,
      isTracked,
      quantityOnHand: isTracked ? (parseInt(quantityOnHand, 10) || 0) : 0,
      isSold,
      isPurchased,
    };

    onSubmit(data);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4" data-testid="product-form">
      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Product Code"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="e.g. SKU-001"
          data-testid="product-code"
          required
        />
        <Input
          label="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Product name"
          data-testid="product-name"
          required
        />
      </div>

      <Input
        label="Description"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Product description"
        data-testid="product-description"
      />

      <div className="grid grid-cols-3 gap-4">
        <Input
          label="Sale Price"
          type="number"
          step="0.01"
          min="0"
          value={salePrice}
          onChange={(e) => setSalePrice(e.target.value)}
          placeholder="0.00"
          data-testid="product-sale-price"
        />
        <Input
          label="Purchase Price"
          type="number"
          step="0.01"
          min="0"
          value={purchasePrice}
          onChange={(e) => setPurchasePrice(e.target.value)}
          placeholder="0.00"
          data-testid="product-purchase-price"
        />
        <Combobox
          options={resolvedTaxRateOptions}
          value={taxRate}
          onChange={(v) => setTaxRate(v)}
          label="Tax Rate"
          data-testid="product-tax-rate"
        />
      </div>

      <Combobox
        options={resolvedAccountOptions}
        value={accountCode}
        onChange={(v) => setAccountCode(v)}
        placeholder="Select account"
        label="Account Code"
        data-testid="product-account-code"
        onCreateNew={onCreateNewAccount}
      />

      <div className="space-y-3">
        <label className="flex items-center gap-2 text-sm" data-testid="product-sold-toggle">
          <input
            type="checkbox"
            checked={isSold}
            onChange={(e) => setIsSold(e.target.checked)}
            className="h-4 w-4 rounded border-gray-300"
          />
          I sell this item
        </label>
        <label className="flex items-center gap-2 text-sm" data-testid="product-purchased-toggle">
          <input
            type="checkbox"
            checked={isPurchased}
            onChange={(e) => setIsPurchased(e.target.checked)}
            className="h-4 w-4 rounded border-gray-300"
          />
          I purchase this item
        </label>
        <label className="flex items-center gap-2 text-sm" data-testid="product-tracked-toggle">
          <input
            type="checkbox"
            checked={isTracked}
            onChange={(e) => setIsTracked(e.target.checked)}
            className="h-4 w-4 rounded border-gray-300"
          />
          Track inventory quantity
        </label>
        {isTracked && (
          <Input
            label="Quantity on Hand"
            type="number"
            value={quantityOnHand}
            onChange={(e) => setQuantityOnHand(e.target.value)}
            data-testid="product-quantity"
          />
        )}
      </div>

      <div className="sticky bottom-0 z-10 bg-white border-t py-3 flex gap-2">
        <Button type="submit" loading={isLoading} data-testid="product-submit-button">
          Save Product
        </Button>
      </div>
    </form>
  );
}
