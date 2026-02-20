import { useCallback, useRef } from 'react';
import { Button } from '../../../components/ui/Button';
import { Upload, X } from 'lucide-react';

interface ReceiptUploadProps {
  value: string | null;
  onChange: (dataUrl: string | null) => void;
}

export function ReceiptUpload({ value, onChange }: ReceiptUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = () => {
        onChange(reader.result as string);
      };
      reader.readAsDataURL(file);
    },
    [onChange],
  );

  const handleRemove = useCallback(() => {
    onChange(null);
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  }, [onChange]);

  return (
    <div data-testid="receipt-upload">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
        data-testid="receipt-file-input"
      />
      {value ? (
        <div className="space-y-2">
          <img
            src={value}
            alt="Receipt preview"
            className="max-h-40 rounded border"
            data-testid="receipt-preview"
          />
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRemove}
            data-testid="receipt-remove-button"
          >
            <X className="h-4 w-4 mr-1" />
            Remove
          </Button>
        </div>
      ) : (
        <Button
          variant="outline"
          size="sm"
          onClick={() => inputRef.current?.click()}
          data-testid="receipt-upload-button"
        >
          <Upload className="h-4 w-4 mr-1" />
          Upload Receipt
        </Button>
      )}
    </div>
  );
}
