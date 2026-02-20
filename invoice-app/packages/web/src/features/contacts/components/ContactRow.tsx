import { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { TableRow, TableCell } from '../../../components/ui/Table';
import { Button } from '../../../components/ui/Button';
import { formatCurrency } from '../../../../../shared/calc/currency';
import { MoreHorizontal } from 'lucide-react';
import type { Contact } from '../types';

interface ContactRowProps {
  contact: Contact;
  onClick: (contact: Contact) => void;
  selected?: boolean;
  onSelectToggle?: (contactId: string) => void;
  onArchive?: (contactId: string) => void;
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

function getInitialsColor(name: string): string {
  const colors = [
    'bg-[#0078c8]', 'bg-[#e86c00]', 'bg-[#5b2d8e]',
    'bg-[#00853e]', 'bg-[#cc3c5c]', 'bg-[#0a6e7a]',
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

export function ContactRow({ contact, onClick, selected = false, onSelectToggle, onArchive }: ContactRowProps) {
  const navigate = useNavigate();
  const [showActions, setShowActions] = useState(false);

  return (
    <TableRow
      className="cursor-pointer hover:bg-gray-50"
      data-testid={`contact-row-${contact.id}`}
    >
      {/* Checkbox */}
      <TableCell className="w-10" onClick={(e) => e.stopPropagation()}>
        <input
          type="checkbox"
          checked={selected}
          onChange={() => onSelectToggle?.(contact.id)}
          className="h-4 w-4 rounded border-[#d1d5db] text-[#0078c8]"
          data-testid={`contact-checkbox-${contact.id}`}
          aria-label={`Select ${contact.name}`}
        />
      </TableCell>

      {/* Contact: initials circle + name (matching Xero's Contact column) */}
      <TableCell onClick={() => onClick(contact)}>
        <div className="flex items-center gap-3">
          <div
            className={`flex h-8 w-8 items-center justify-center rounded-full text-white text-xs font-semibold shrink-0 ${getInitialsColor(contact.name)}`}
            data-testid={`contact-initials-${contact.id}`}
          >
            {getInitials(contact.name)}
          </div>
          <div>
            <span className="font-medium text-[#1a1a2e] truncate">{contact.name}</span>
            {contact.email && (
              <div className="text-xs text-[#6b7280]">{contact.email}</div>
            )}
            {contact.phone && (
              <div className="text-xs text-[#6b7280]">{contact.phone}</div>
            )}
          </div>
        </div>
      </TableCell>

      {/* You owe (bills outstanding — what we owe to suppliers) */}
      <TableCell className="text-right" onClick={() => onClick(contact)}>
        {contact.outstandingBalance > 0 && contact.type !== 'customer' ? (
          <span className="text-sm font-medium text-[#1a1a2e]">{formatCurrency(contact.outstandingBalance)}</span>
        ) : (
          <span className="text-sm text-[#6b7280]">-</span>
        )}
      </TableCell>

      {/* They owe (invoices outstanding — what customers owe us) */}
      <TableCell className="text-right" onClick={() => onClick(contact)}>
        {contact.outstandingBalance > 0 && contact.type !== 'supplier' ? (
          <span className="text-sm font-medium text-[#1a1a2e]">{formatCurrency(contact.outstandingBalance)}</span>
        ) : (
          <span className="text-sm text-[#6b7280]">-</span>
        )}
      </TableCell>

      {/* Actions */}
      <TableCell className="w-12" onClick={(e) => e.stopPropagation()}>
        <div className="relative">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowActions(!showActions)}
            data-testid={`contact-actions-${contact.id}`}
            aria-label={`Actions for ${contact.name}`}
          >
            <MoreHorizontal className="h-4 w-4" />
          </Button>
          {showActions && (
            <div
              className="absolute right-0 top-8 z-10 w-48 rounded-md border border-[#e5e7eb] bg-white py-1 shadow-lg"
              data-testid={`contact-actions-menu-${contact.id}`}
            >
              <button
                className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50"
                onClick={() => { onClick(contact); setShowActions(false); }}
              >
                View details
              </button>
              <button
                className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50"
                onClick={() => { setShowActions(false); navigate({ to: '/sales/invoices/new' }); }}
              >
                Create invoice
              </button>
              <button
                className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50"
                onClick={() => { setShowActions(false); navigate({ to: '/purchases/bills/new' }); }}
              >
                Create bill
              </button>
              <hr className="my-1 border-[#e5e7eb]" />
              <button
                className="w-full px-4 py-2 text-left text-sm text-[#ef4444] hover:bg-gray-50"
                onClick={() => { setShowActions(false); onArchive?.(contact.id); }}
              >
                Archive
              </button>
            </div>
          )}
        </div>
      </TableCell>
    </TableRow>
  );
}
