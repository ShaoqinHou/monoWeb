import { useState, useMemo } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Dialog } from '../../../components/ui/Dialog';
import { Button } from '../../../components/ui/Button';
import { Card, CardContent } from '../../../components/ui/Card';
import type { Contact, MergeDecision } from '../types';

type FieldChoice = 'source' | 'target';

interface FieldSelections {
  name: FieldChoice;
  email: FieldChoice;
  phone: FieldChoice;
  address: FieldChoice;
}

interface ContactMergeDialogProps {
  open: boolean;
  onClose: () => void;
  sourceContact: Contact;
  targetContact: Contact;
  onMerge: (decision: MergeDecision) => void;
  isMerging: boolean;
}

const MERGE_FIELDS: Array<{ key: keyof FieldSelections; label: string }> = [
  { key: 'name', label: 'Name' },
  { key: 'email', label: 'Email' },
  { key: 'phone', label: 'Phone' },
  { key: 'address', label: 'Address' },
];

function getFieldValue(contact: Contact, field: keyof FieldSelections): string {
  switch (field) {
    case 'name':
      return contact.name;
    case 'email':
      return contact.email ?? '-';
    case 'phone':
      return contact.phone ?? '-';
    case 'address':
      return contact.bankAccountName ?? '-';
    default:
      return '-';
  }
}

export function ContactMergeDialog({
  open,
  onClose,
  sourceContact,
  targetContact,
  onMerge,
  isMerging,
}: ContactMergeDialogProps) {
  const [fields, setFields] = useState<FieldSelections>({
    name: 'source',
    email: 'source',
    phone: 'source',
    address: 'source',
  });

  const preview = useMemo(() => {
    const result: Record<string, string> = {};
    for (const { key } of MERGE_FIELDS) {
      const contact = fields[key] === 'source' ? sourceContact : targetContact;
      result[key] = getFieldValue(contact, key);
    }
    return result;
  }, [fields, sourceContact, targetContact]);

  const handleFieldChange = (field: keyof FieldSelections, value: FieldChoice) => {
    setFields((prev) => ({ ...prev, [field]: value }));
  };

  const handleMerge = () => {
    onMerge({
      keepContactId: targetContact.id,
      deleteContactId: sourceContact.id,
      fields,
    });
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Merge Contacts"
      className="max-w-3xl"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={isMerging}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleMerge}
            disabled={isMerging}
            loading={isMerging}
            data-testid="merge-confirm-btn"
          >
            Merge
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {/* Warning */}
        <div
          className="flex items-start gap-2 rounded-lg border border-[#f59e0b]/30 bg-[#f59e0b]/5 p-3"
          data-testid="merge-warning"
        >
          <AlertTriangle className="h-5 w-5 text-[#f59e0b] shrink-0 mt-0.5" />
          <p className="text-sm text-[#92400e]">
            Merging contacts will reassign all invoices and bills from the deleted contact
            to the surviving contact. This action cannot be undone.
          </p>
        </div>

        {/* Side-by-side comparison */}
        <div className="grid grid-cols-2 gap-4">
          <div data-testid="merge-source">
            <h3 className="text-sm font-semibold text-[#6b7280] mb-2">Source Contact</h3>
            <Card>
              <CardContent>
                <p className="font-medium text-[#1a1a2e]">{sourceContact.name}</p>
                <p className="text-sm text-[#6b7280]">{sourceContact.email ?? '-'}</p>
                <p className="text-sm text-[#6b7280]">{sourceContact.phone ?? '-'}</p>
              </CardContent>
            </Card>
          </div>
          <div data-testid="merge-target">
            <h3 className="text-sm font-semibold text-[#6b7280] mb-2">Target Contact</h3>
            <Card>
              <CardContent>
                <p className="font-medium text-[#1a1a2e]">{targetContact.name}</p>
                <p className="text-sm text-[#6b7280]">{targetContact.email ?? '-'}</p>
                <p className="text-sm text-[#6b7280]">{targetContact.phone ?? '-'}</p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Field selection */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-[#1a1a2e]">Choose which value to keep</h3>
          {MERGE_FIELDS.map(({ key, label }) => (
            <div key={key} className="grid grid-cols-[120px_1fr_1fr] items-center gap-2">
              <span className="text-sm font-medium text-[#6b7280]">{label}</span>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="radio"
                  name={`merge-${key}`}
                  checked={fields[key] === 'source'}
                  onChange={() => handleFieldChange(key, 'source')}
                  aria-label={`${label} source`}
                  data-testid={`radio-${key}-source`}
                />
                <span>{getFieldValue(sourceContact, key)}</span>
              </label>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="radio"
                  name={`merge-${key}`}
                  checked={fields[key] === 'target'}
                  onChange={() => handleFieldChange(key, 'target')}
                  aria-label={`${label} target`}
                  data-testid={`radio-${key}-target`}
                />
                <span>{getFieldValue(targetContact, key)}</span>
              </label>
            </div>
          ))}
        </div>

        {/* Preview */}
        <div data-testid="merge-preview">
          <h3 className="text-sm font-semibold text-[#1a1a2e] mb-2">Merged Result Preview</h3>
          <Card>
            <CardContent>
              <div className="space-y-1 text-sm">
                <p><span className="text-[#6b7280]">Name:</span> {preview.name}</p>
                <p><span className="text-[#6b7280]">Email:</span> {preview.email}</p>
                <p><span className="text-[#6b7280]">Phone:</span> {preview.phone}</p>
                <p><span className="text-[#6b7280]">Address:</span> {preview.address}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Dialog>
  );
}
