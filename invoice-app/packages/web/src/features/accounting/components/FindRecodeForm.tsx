import { useState } from 'react';
import { Input } from '../../../components/ui/Input';
import { Button } from '../../../components/ui/Button';
import type { TransactionSearchFilters } from '../hooks/useFindRecode';

interface FindRecodeFormProps {
  onSearch: (filters: TransactionSearchFilters) => void;
  isLoading?: boolean;
}

export function FindRecodeForm({ onSearch, isLoading }: FindRecodeFormProps) {
  const [accountCode, setAccountCode] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [amountMin, setAmountMin] = useState('');
  const [amountMax, setAmountMax] = useState('');
  const [reference, setReference] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const filters: TransactionSearchFilters = {};
    if (accountCode.trim()) filters.accountCode = accountCode.trim();
    if (dateFrom) filters.dateFrom = dateFrom;
    if (dateTo) filters.dateTo = dateTo;
    if (amountMin) filters.amountMin = parseFloat(amountMin);
    if (amountMax) filters.amountMax = parseFloat(amountMax);
    if (reference.trim()) filters.reference = reference.trim();
    onSearch(filters);
  };

  const handleReset = () => {
    setAccountCode('');
    setDateFrom('');
    setDateTo('');
    setAmountMin('');
    setAmountMax('');
    setReference('');
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4" data-testid="find-recode-form">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Input
          label="Account Code"
          placeholder="e.g. 4-0100"
          value={accountCode}
          onChange={(e) => setAccountCode(e.target.value)}
          data-testid="filter-account-code"
        />

        <Input
          label="Date From"
          type="date"
          value={dateFrom}
          onChange={(e) => setDateFrom(e.target.value)}
          data-testid="filter-date-from"
        />

        <Input
          label="Date To"
          type="date"
          value={dateTo}
          onChange={(e) => setDateTo(e.target.value)}
          data-testid="filter-date-to"
        />

        <Input
          label="Amount Min"
          type="number"
          placeholder="0.00"
          value={amountMin}
          onChange={(e) => setAmountMin(e.target.value)}
          data-testid="filter-amount-min"
          step="0.01"
        />

        <Input
          label="Amount Max"
          type="number"
          placeholder="0.00"
          value={amountMax}
          onChange={(e) => setAmountMax(e.target.value)}
          data-testid="filter-amount-max"
          step="0.01"
        />

        <Input
          label="Reference"
          placeholder="Search by reference..."
          value={reference}
          onChange={(e) => setReference(e.target.value)}
          data-testid="filter-reference"
        />
      </div>

      <div className="flex items-center gap-2">
        <Button type="submit" loading={isLoading} data-testid="search-btn">
          Search
        </Button>
        <Button type="button" variant="ghost" onClick={handleReset} data-testid="reset-btn">
          Reset
        </Button>
      </div>
    </form>
  );
}
