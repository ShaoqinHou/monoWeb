import { useState, useMemo, useCallback } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { Search } from 'lucide-react';
import { Input } from '../../../components/ui/Input';
import { Button } from '../../../components/ui/Button';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
} from '../../../components/ui/Table';
import { SortableHeader, type SortDirection } from '../../../components/patterns/SortableHeader';
import { Pagination } from '../../../components/patterns/Pagination';
import { BulkActionsBar } from '../../../components/patterns/BulkActionsBar';
import { ContactRow } from './ContactRow';
import type { Contact, ContactFilter } from '../types';

interface ContactListProps {
  contacts: Contact[];
  isLoading: boolean;
  onContactClick: (contact: Contact) => void;
  onSearch: (term: string) => void;
  onFilterChange: (filter: ContactFilter) => void;
  activeFilter: ContactFilter;
  searchTerm: string;
}

type SortField = 'name' | 'accountNo' | 'email' | 'phone' | 'billsDue' | 'overdueBills' | 'invoicesDue' | 'overdueInvoices';

const PAGE_SIZE = 25;

export function ContactList({
  contacts,
  isLoading,
  onContactClick,
  onSearch,
  onFilterChange,
  activeFilter,
  searchTerm,
}: ContactListProps) {
  const navigate = useNavigate();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDir, setSortDir] = useState<SortDirection>('asc');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(PAGE_SIZE);

  // Sort contacts
  const sortedContacts = useMemo(() => {
    return [...contacts].sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case 'name':
          cmp = a.name.localeCompare(b.name);
          break;
        case 'accountNo':
          cmp = (a.defaultAccountCode || '').localeCompare(b.defaultAccountCode || '');
          break;
        case 'email':
          cmp = (a.email || '').localeCompare(b.email || '');
          break;
        case 'phone':
          cmp = (a.phone || '').localeCompare(b.phone || '');
          break;
        case 'billsDue':
          cmp = (a.outstandingBalance || 0) - (b.outstandingBalance || 0);
          break;
        case 'overdueBills':
          cmp = (a.overdueBalance || 0) - (b.overdueBalance || 0);
          break;
        case 'invoicesDue':
          cmp = (a.outstandingBalance || 0) - (b.outstandingBalance || 0);
          break;
        case 'overdueInvoices':
          cmp = (a.overdueBalance || 0) - (b.overdueBalance || 0);
          break;
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [contacts, sortField, sortDir]);

  // Paginate
  const totalPages = Math.max(1, Math.ceil(sortedContacts.length / pageSize));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const pageContacts = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return sortedContacts.slice(start, start + pageSize);
  }, [sortedContacts, safePage, pageSize]);

  const toggleSelect = useCallback((contactId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(contactId)) {
        next.delete(contactId);
      } else {
        next.add(contactId);
      }
      return next;
    });
  }, []);

  const toggleSelectAll = useCallback(() => {
    if (selectedIds.size === pageContacts.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(pageContacts.map((c) => c.id)));
    }
  }, [pageContacts, selectedIds.size]);

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  const cycleSort = useCallback((field: string, direction: SortDirection) => {
    setSortField(field as SortField);
    setSortDir(direction);
  }, []);

  const handlePageChange = useCallback((newPage: number, newPageSize: number) => {
    if (newPageSize !== pageSize) {
      setPageSize(newPageSize);
      setPage(1);
    } else {
      setPage(newPage);
    }
  }, [pageSize]);

  const bulkActions = [
    { label: 'Add to group', onClick: () => {} },
    { label: 'Merge', onClick: () => {} },
    { label: 'Archive', onClick: () => {} },
  ];

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="flex items-center gap-4">
        <div className="flex-1 max-w-sm">
          <Input
            placeholder="Search contacts..."
            value={searchTerm}
            onChange={(e) => onSearch(e.target.value)}
            startIcon={<Search className="h-4 w-4" />}
            data-testid="contact-search"
          />
        </div>
      </div>

      {/* Bulk Actions (Xero-style, always visible) */}
      <div className="flex items-center gap-2 text-sm" data-testid="bulk-actions-bar">
        <Button variant="ghost" size="sm" disabled={selectedIds.size === 0} data-testid="bulk-add-to-group">
          Add to group
        </Button>
        <Button variant="ghost" size="sm" disabled={selectedIds.size < 2} data-testid="bulk-merge">
          Merge
        </Button>
        <Button variant="ghost" size="sm" disabled={selectedIds.size === 0} data-testid="bulk-archive">
          Archive
        </Button>
        <span className="text-[#6b7280] ml-2" data-testid="selection-status">
          {`${selectedIds.size} contact${selectedIds.size !== 1 ? 's' : ''} selected`}
        </span>
      </div>

      {/* Contacts Table */}
      {isLoading ? (
        <div className="py-12 text-center text-[#6b7280]" data-testid="contacts-loading">
          Loading contacts...
        </div>
      ) : contacts.length === 0 ? (
        <div className="py-12 text-center" data-testid="contacts-empty">
          <h3 className="text-lg font-medium text-gray-900">No contacts yet</h3>
          <p className="mt-1 text-sm text-gray-500">Add customers and suppliers to manage your business relationships</p>
          <div className="mt-4">
            <Button variant="primary" size="sm" onClick={() => navigate({ to: '/contacts/new' })}>
              New Contact
            </Button>
          </div>
        </div>
      ) : (
        <>
          <Table data-testid="contacts-table">
            <TableHeader>
              <TableRow>
                <TableHead className="w-10">
                  <input
                    type="checkbox"
                    checked={selectedIds.size === pageContacts.length && pageContacts.length > 0}
                    onChange={toggleSelectAll}
                    className="h-4 w-4 rounded border-[#d1d5db] text-[#0078c8]"
                    data-testid="select-all-checkbox"
                    aria-label="Select all contacts"
                  />
                </TableHead>
                <SortableHeader
                  label="Contact"
                  field="name"
                  currentSort={sortField}
                  currentDirection={sortDir}
                  onSort={cycleSort}
                  data-testid="sort-name-btn"
                />
                <SortableHeader
                  label="You owe"
                  field="billsDue"
                  currentSort={sortField}
                  currentDirection={sortDir}
                  onSort={cycleSort}
                  className="text-right"
                />
                <SortableHeader
                  label="They owe"
                  field="invoicesDue"
                  currentSort={sortField}
                  currentDirection={sortDir}
                  onSort={cycleSort}
                  className="text-right"
                />
                <TableHead className="w-12" aria-label="Actions" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {pageContacts.map((contact) => (
                <ContactRow
                  key={contact.id}
                  contact={contact}
                  onClick={onContactClick}
                  selected={selectedIds.has(contact.id)}
                  onSelectToggle={toggleSelect}
                />
              ))}
            </TableBody>
          </Table>

          {/* Pagination */}
          {sortedContacts.length > 0 && (
            <Pagination
              page={safePage}
              pageSize={pageSize}
              total={sortedContacts.length}
              onChange={handlePageChange}
              data-testid="contacts-pagination"
            />
          )}
        </>
      )}

      {/* Floating Bulk Actions Bar (when items selected) */}
      <BulkActionsBar
        selectedCount={selectedIds.size}
        actions={bulkActions}
        onClear={clearSelection}
      />
    </div>
  );
}
