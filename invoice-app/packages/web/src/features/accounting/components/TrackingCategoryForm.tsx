import { useState } from 'react';
import { Input } from '../../../components/ui/Input';
import { Button } from '../../../components/ui/Button';
import type { TrackingCategory } from '../hooks/useTrackingCategories';

interface TrackingCategoryFormProps {
  initialData?: TrackingCategory;
  onSubmit: (data: { name: string; options: string[] }) => void;
  isLoading?: boolean;
}

export function TrackingCategoryForm({
  initialData,
  onSubmit,
  isLoading,
}: TrackingCategoryFormProps) {
  const [name, setName] = useState(initialData?.name ?? '');
  const [options, setOptions] = useState<string[]>(
    initialData?.options.map((o) => o.name) ?? [''],
  );

  const handleAddOption = () => {
    setOptions([...options, '']);
  };

  const handleRemoveOption = (index: number) => {
    setOptions(options.filter((_, i) => i !== index));
  };

  const handleOptionChange = (index: number, value: string) => {
    const updated = [...options];
    updated[index] = value;
    setOptions(updated);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = name.trim();
    const trimmedOptions = options.map((o) => o.trim()).filter((o) => o.length > 0);
    if (!trimmedName) return;
    onSubmit({ name: trimmedName, options: trimmedOptions });
  };

  const isValid = name.trim().length > 0;

  return (
    <form onSubmit={handleSubmit} className="space-y-4" data-testid="tracking-category-form">
      <Input
        label="Category Name"
        placeholder="e.g. Region, Department"
        value={name}
        onChange={(e) => setName(e.target.value)}
        data-testid="category-name-input"
        required
      />

      <div className="space-y-2">
        <label className="text-sm font-medium text-[#1a1a2e]">Options</label>
        {options.map((option, index) => (
          <div key={index} className="flex items-center gap-2">
            <Input
              placeholder={`Option ${index + 1}`}
              value={option}
              onChange={(e) => handleOptionChange(index, e.target.value)}
              data-testid={`option-input-${index}`}
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => handleRemoveOption(index)}
              data-testid={`remove-option-${index}`}
              disabled={options.length <= 1}
            >
              Remove
            </Button>
          </div>
        ))}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleAddOption}
          data-testid="add-option-btn"
        >
          Add Option
        </Button>
      </div>

      <div className="flex items-center gap-2 pt-2">
        <Button type="submit" disabled={!isValid || isLoading} loading={isLoading} data-testid="save-category-btn">
          {isLoading ? 'Saving...' : initialData ? 'Update Category' : 'Create Category'}
        </Button>
      </div>
    </form>
  );
}
