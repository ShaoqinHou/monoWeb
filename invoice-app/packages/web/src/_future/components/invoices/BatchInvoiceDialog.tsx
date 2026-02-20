import { useState, useMemo } from 'react';
import { Dialog } from '../../../components/ui/Dialog';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Badge } from '../../../components/ui/Badge';
import {
  useBatchCreateInvoices,
  type BatchInvoiceTemplate,
  type BatchInvoiceContact,
} from '../hooks/useBatchCreateInvoices';

export interface BatchInvoiceDialogProps {
  open: boolean;
  onClose: () => void;
  availableContacts: BatchInvoiceContact[];
}

type Step = 'contacts' | 'details' | 'preview' | 'creating';

export function BatchInvoiceDialog({ open, onClose, availableContacts }: BatchInvoiceDialogProps) {
  const [step, setStep] = useState<Step>('contacts');
  const [selectedContacts, setSelectedContacts] = useState<BatchInvoiceContact[]>([]);
  const [contactSearch, setContactSearch] = useState('');
  const [template, setTemplate] = useState<BatchInvoiceTemplate>({
    date: new Date().toISOString().slice(0, 10),
    dueDate: '',
    reference: '',
    currency: 'NZD',
    amountType: 'exclusive',
    lineItems: [],
    notes: '',
  });
  const [result, setResult] = useState<{ created: number; failed: number } | null>(null);

  const mutation = useBatchCreateInvoices();

  const filteredContacts = useMemo(() => {
    if (!contactSearch) return availableContacts;
    const lower = contactSearch.toLowerCase();
    return availableContacts.filter(c => c.name.toLowerCase().includes(lower));
  }, [availableContacts, contactSearch]);

  const toggleContact = (contact: BatchInvoiceContact) => {
    setSelectedContacts(prev =>
      prev.some(c => c.id === contact.id)
        ? prev.filter(c => c.id !== contact.id)
        : [...prev, contact]
    );
  };

  const handleCreateAll = async () => {
    setStep('creating');
    try {
      const res = await mutation.mutateAsync({
        template,
        contacts: selectedContacts,
      });
      setResult({
        created: res.createdIds.length,
        failed: res.failedContacts.length,
      });
    } catch {
      setResult({ created: 0, failed: selectedContacts.length });
    }
  };

  const handleClose = () => {
    setStep('contacts');
    setSelectedContacts([]);
    setContactSearch('');
    setResult(null);
    onClose();
  };

  const stepLabels: Record<Step, string> = {
    contacts: 'Step 1: Select Contacts',
    details: 'Step 2: Invoice Details',
    preview: 'Step 3: Preview',
    creating: 'Creating Invoices...',
  };

  return (
    <Dialog open={open} onClose={handleClose} title="Batch Create Invoices" className="max-w-2xl">
      <div className="space-y-4">
        {/* Step indicator */}
        <div className="flex items-center gap-2">
          {(['contacts', 'details', 'preview', 'creating'] as Step[]).map((s, i) => (
            <Badge key={s} variant={step === s ? 'info' : 'default'}>
              {i + 1}. {s.charAt(0).toUpperCase() + s.slice(1)}
            </Badge>
          ))}
        </div>

        <h3 className="text-sm font-medium text-[#6b7280]">{stepLabels[step]}</h3>

        {/* Step 1: Select contacts */}
        {step === 'contacts' && (
          <div className="space-y-3">
            <Input
              placeholder="Search contacts..."
              value={contactSearch}
              onChange={e => setContactSearch(e.target.value)}
              data-testid="contact-search"
            />
            <div className="max-h-60 overflow-y-auto border rounded" role="listbox" aria-label="Available contacts">
              {filteredContacts.map(contact => (
                <label
                  key={contact.id}
                  className="flex items-center gap-2 px-3 py-2 hover:bg-gray-50 cursor-pointer border-b last:border-b-0"
                >
                  <input
                    type="checkbox"
                    checked={selectedContacts.some(c => c.id === contact.id)}
                    onChange={() => toggleContact(contact)}
                    aria-label={`Select ${contact.name}`}
                  />
                  <span className="text-sm">{contact.name}</span>
                </label>
              ))}
              {filteredContacts.length === 0 && (
                <p className="px-3 py-4 text-sm text-[#6b7280] text-center">No contacts found</p>
              )}
            </div>
            <p className="text-sm text-[#6b7280]">{selectedContacts.length} contact(s) selected</p>
          </div>
        )}

        {/* Step 2: Invoice details */}
        {step === 'details' && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Invoice Date"
                type="date"
                value={template.date}
                onChange={e => setTemplate(t => ({ ...t, date: e.target.value }))}
              />
              <Input
                label="Due Date"
                type="date"
                value={template.dueDate}
                onChange={e => setTemplate(t => ({ ...t, dueDate: e.target.value }))}
              />
            </div>
            <Input
              label="Reference"
              value={template.reference}
              onChange={e => setTemplate(t => ({ ...t, reference: e.target.value }))}
              placeholder="Optional reference"
            />
            <Input
              label="Notes"
              value={template.notes}
              onChange={e => setTemplate(t => ({ ...t, notes: e.target.value }))}
              placeholder="Notes to appear on all invoices"
            />
          </div>
        )}

        {/* Step 3: Preview */}
        {step === 'preview' && (
          <div className="space-y-3">
            <p className="text-sm">
              The following {selectedContacts.length} invoice(s) will be created:
            </p>
            <div className="max-h-60 overflow-y-auto border rounded divide-y">
              {selectedContacts.map(contact => (
                <div key={contact.id} className="px-3 py-2 text-sm flex justify-between">
                  <span>{contact.name}</span>
                  <span className="text-[#6b7280]">{template.date}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Step 4: Creating / Results */}
        {step === 'creating' && (
          <div className="py-4 text-center">
            {result ? (
              <div className="space-y-2">
                <p className="text-lg font-semibold" data-testid="batch-result">
                  {result.created} invoice(s) created
                </p>
                {result.failed > 0 && (
                  <p className="text-sm text-[#ef4444]">{result.failed} failed</p>
                )}
              </div>
            ) : (
              <div className="flex items-center justify-center gap-2">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-[#0078c8] border-t-transparent" role="progressbar" />
                <span className="text-sm text-[#6b7280]">Creating invoices...</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer navigation */}
      <div className="flex justify-between mt-4 pt-4 border-t border-[#e5e7eb]">
        <Button
          variant="ghost"
          onClick={result ? handleClose : step === 'contacts' ? handleClose : () => {
            const steps: Step[] = ['contacts', 'details', 'preview', 'creating'];
            const idx = steps.indexOf(step);
            if (idx > 0) setStep(steps[idx - 1]);
          }}
        >
          {result ? 'Close' : step === 'contacts' ? 'Cancel' : 'Back'}
        </Button>
        {!result && step !== 'creating' && (
          <Button
            onClick={() => {
              if (step === 'contacts') setStep('details');
              else if (step === 'details') setStep('preview');
              else if (step === 'preview') handleCreateAll();
            }}
            disabled={step === 'contacts' && selectedContacts.length === 0}
          >
            {step === 'preview' ? 'Create All' : 'Next'}
          </Button>
        )}
      </div>
    </Dialog>
  );
}
