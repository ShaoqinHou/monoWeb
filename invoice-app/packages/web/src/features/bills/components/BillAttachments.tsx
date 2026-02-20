import { useState, useCallback, useRef } from 'react';
import { Button } from '../../../components/ui/Button';
import { Card, CardContent, CardHeader } from '../../../components/ui/Card';

interface Attachment {
  id: string;
  name: string;
  size: number;
  data: string; // base64
  createdAt: string;
}

interface BillAttachmentsProps {
  billId: string;
}

function getStorageKey(billId: string): string {
  return `bill-attachments-${billId}`;
}

function loadAttachments(billId: string): Attachment[] {
  try {
    const raw = localStorage.getItem(getStorageKey(billId));
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveAttachments(billId: string, attachments: Attachment[]): void {
  localStorage.setItem(getStorageKey(billId), JSON.stringify(attachments));
}

export function BillAttachments({ billId }: BillAttachmentsProps) {
  const [attachments, setAttachments] = useState<Attachment[]>(() => loadAttachments(billId));
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = () => {
        const newAttachment: Attachment = {
          id: crypto.randomUUID(),
          name: file.name,
          size: file.size,
          data: reader.result as string,
          createdAt: new Date().toISOString(),
        };
        const updated = [...attachments, newAttachment];
        setAttachments(updated);
        saveAttachments(billId, updated);
      };
      reader.readAsDataURL(file);

      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    },
    [attachments, billId],
  );

  const handleDelete = useCallback(
    (id: string) => {
      const updated = attachments.filter((a) => a.id !== id);
      setAttachments(updated);
      saveAttachments(billId, updated);
    },
    [attachments, billId],
  );

  const formatSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <Card data-testid="bill-attachments">
      <CardHeader>
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Attachments</h2>
          <div>
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              onChange={handleUpload}
              data-testid="attachment-file-input"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              data-testid="attachment-upload-btn"
            >
              Upload File
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {attachments.length === 0 ? (
          <p className="text-sm text-gray-500" data-testid="no-attachments">
            No files attached.
          </p>
        ) : (
          <ul className="space-y-2" data-testid="attachment-list">
            {attachments.map((att) => (
              <li
                key={att.id}
                className="flex items-center justify-between border rounded p-2 text-sm"
                data-testid={`attachment-${att.id}`}
              >
                <div>
                  <span className="font-medium" data-testid={`attachment-name-${att.id}`}>
                    {att.name}
                  </span>
                  <span className="text-gray-400 ml-2">({formatSize(att.size)})</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(att.id)}
                  data-testid={`attachment-delete-${att.id}`}
                >
                  Remove
                </Button>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
