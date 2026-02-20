import { FileAttachment, type AttachedFile } from '../../../components/patterns/FileAttachment';

export interface InvoiceAttachmentsProps {
  files: AttachedFile[];
  onAdd: (file: AttachedFile) => void;
  onRemove: (index: number) => void;
}

export function InvoiceAttachments({ files, onAdd, onRemove }: InvoiceAttachmentsProps) {
  return (
    <div data-testid="invoice-attachments">
      <label className="block text-sm font-medium text-gray-700 mb-1.5">Attachments</label>
      <FileAttachment files={files} onAdd={onAdd} onRemove={onRemove} />
    </div>
  );
}
