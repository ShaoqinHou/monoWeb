import { useState } from 'react';
import { Input } from '../../../components/ui/Input';
import { Button } from '../../../components/ui/Button';
import { Card, CardContent, CardFooter } from '../../../components/ui/Card';

interface ProjectExpenseFormValues {
  description: string;
  amount: number;
  date: string;
  category: string;
  isBillable: boolean;
}

interface ProjectExpenseFormProps {
  initialValues?: Partial<ProjectExpenseFormValues>;
  onSubmit: (values: ProjectExpenseFormValues) => void;
  onCancel?: () => void;
  loading?: boolean;
}

export function ProjectExpenseForm({
  initialValues,
  onSubmit,
  onCancel,
  loading,
}: ProjectExpenseFormProps) {
  const [description, setDescription] = useState(initialValues?.description ?? '');
  const [amount, setAmount] = useState(String(initialValues?.amount ?? ''));
  const [date, setDate] = useState(initialValues?.date ?? new Date().toISOString().slice(0, 10));
  const [category, setCategory] = useState(initialValues?.category ?? '');
  const [isBillable, setIsBillable] = useState(initialValues?.isBillable ?? true);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      description,
      amount: parseFloat(amount) || 0,
      date,
      category,
      isBillable,
    });
  };

  return (
    <form onSubmit={handleSubmit} data-testid="expense-form">
      <Card>
        <CardContent>
          <div className="space-y-4 py-2">
            <Input
              label="Description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              inputId="expense-description"
              required
            />
            <Input
              label="Amount"
              type="number"
              step="0.01"
              min="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              inputId="expense-amount"
              required
            />
            <Input
              label="Date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              inputId="expense-date"
              required
            />
            <Input
              label="Category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              inputId="expense-category"
              placeholder="e.g. travel, materials, software"
            />
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="expense-billable"
                checked={isBillable}
                onChange={(e) => setIsBillable(e.target.checked)}
                className="rounded border-gray-300"
              />
              <label htmlFor="expense-billable" className="text-sm text-[#1a1a2e]">
                Billable
              </label>
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <div className="flex gap-2">
            <Button type="submit" loading={loading} data-testid="save-expense">
              Save
            </Button>
            {onCancel && (
              <Button
                type="button"
                variant="secondary"
                onClick={onCancel}
                data-testid="cancel-expense"
              >
                Cancel
              </Button>
            )}
          </div>
        </CardFooter>
      </Card>
    </form>
  );
}

export type { ProjectExpenseFormValues };
