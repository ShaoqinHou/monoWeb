import { Button } from '../../../components/ui/Button';
import { useExportContactsCsv } from '../hooks/useContactExport';
import type { Contact } from '@shared/schemas/contact';

export interface ExportContactsButtonProps {
  contacts: Contact[];
  disabled?: boolean;
}

export function ExportContactsButton({ contacts, disabled }: ExportContactsButtonProps) {
  const { exportCsv, isExporting } = useExportContactsCsv();

  return (
    <Button
      variant="secondary"
      size="sm"
      onClick={() => exportCsv(contacts)}
      disabled={disabled || contacts.length === 0}
      loading={isExporting}
    >
      {isExporting ? 'Exporting...' : 'Export CSV'}
    </Button>
  );
}
