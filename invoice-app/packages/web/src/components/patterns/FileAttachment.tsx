import { useRef } from 'react';
import { Paperclip, X, FileText } from 'lucide-react';
import { cn } from '../../lib/cn';

export interface AttachedFile {
  name: string;
  url: string;
}

export interface FileAttachmentProps {
  files: AttachedFile[];
  onAdd: (file: AttachedFile) => void;
  onRemove: (index: number) => void;
  className?: string;
}

export function FileAttachment({ files, onAdd, onRemove, className }: FileAttachmentProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      onAdd({ name: file.name, url: reader.result as string });
    };
    reader.readAsDataURL(file);

    // Reset input so the same file can be re-selected
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  }

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="inline-flex items-center gap-1.5 rounded-md border border-[#e5e7eb] bg-white px-3 py-1.5 text-sm font-medium text-[#1a1a2e] hover:bg-gray-50 transition-colors"
        >
          <Paperclip className="h-4 w-4" />
          Attach file
        </button>
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          onChange={handleFileChange}
          aria-label="Upload file"
        />
      </div>
      {files.length > 0 && (
        <ul className="space-y-1">
          {files.map((file, i) => (
            <li
              key={`${file.name}-${i}`}
              className="flex items-center gap-2 rounded border border-[#e5e7eb] px-3 py-2 text-sm"
            >
              <FileText className="h-4 w-4 text-[#6b7280] flex-shrink-0" />
              <span className="flex-1 truncate text-[#1a1a2e]">{file.name}</span>
              <button
                onClick={() => onRemove(i)}
                className="rounded p-0.5 text-[#6b7280] hover:bg-gray-100 transition-colors"
                aria-label={`Remove ${file.name}`}
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
