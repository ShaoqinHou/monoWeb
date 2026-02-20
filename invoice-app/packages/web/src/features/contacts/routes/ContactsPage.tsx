import { useState, useCallback, useEffect, useRef, type FormEvent } from 'react';
import { useNavigate, useParams, useRouterState } from '@tanstack/react-router';
import { Plus, Trash2, Archive, ArchiveRestore, Upload, Download, Users, ChevronDown } from 'lucide-react';
import { PageContainer } from '../../../components/layout/PageContainer';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { Dialog } from '../../../components/ui/Dialog';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { Combobox, type ComboboxOption } from '../../../components/ui/Combobox';
import { Tabs, TabList, Tab, TabPanel } from '../../../components/ui/Tabs';
import { ContactList } from '../components/ContactList';
import { ContactDetail } from '../components/ContactDetail';
import { ContactGroupList } from '../components/ContactGroupList';
import { ContactGroupDetail } from '../components/ContactGroupDetail';
import { SmartListBuilder } from '../components/SmartListBuilder';
import { Card, CardHeader, CardContent } from '../../../components/ui/Card';
import {
  useContacts,
  useContact,
  useCreateContact,
  useUpdateContact,
  useDeleteContact,
  useArchiveContact,
  useUnarchiveContact,
} from '../hooks/useContacts';
import {
  useContactGroups,
  useContactGroup,
  useCreateGroup,
  useDeleteGroup,
  useAddMember,
  useRemoveMember,
} from '../hooks/useContactGroups';
import type { ContactGroup } from '../hooks/useContactGroups';
import {
  useSmartLists,
  useSaveSmartList,
  useDeleteSmartList,
  type SmartListFilter,
} from '../hooks/useSmartLists';
import type { ContactFilter, Contact } from '../types';
import { showToast } from '../../dashboard/components/ToastContainer';
import { useAccounts } from '../../accounting/hooks/useAccounts';
import { useTaxRates } from '../../accounting/hooks/useTaxRates';
import { ContactPersonsList, type ContactPerson } from '../components/ContactPersonsList';
import { DeliveryAddressForm, type DeliveryAddress } from '../components/DeliveryAddressForm';
import { NotImplemented } from '../../../components/patterns/NotImplemented';

function useDebouncedValue<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

/* ════════════════════════════════════════════════════════════════════
   ContactsPage tab type — Xero-style tabs
   All | Customers | Suppliers | Archived | Groups | Smart Lists
   ════════════════════════════════════════════════════════════════════ */
type ContactsTab = 'all' | 'customers' | 'suppliers' | 'archived' | 'groups' | 'smart-lists';

/* ─── Map tab to ContactFilter for the list-based tabs ─── */
function tabToFilter(tab: ContactsTab): ContactFilter {
  switch (tab) {
    case 'customers':
      return 'customer';
    case 'suppliers':
      return 'supplier';
    case 'archived':
      return 'archived';
    default:
      return 'all';
  }
}

export function ContactsPage() {
  // Reactively read URL search params to support sidebar navigation links like
  // /contacts?tab=customers, /contacts?tab=suppliers, /contacts?group=training-customers
  const routerState = useRouterState();
  const currentHref = routerState.location.href;

  const deriveTabFromUrl = (): ContactsTab => {
    const params = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');
    const tab = params.get('tab') as ContactsTab | null;
    const group = params.get('group');
    if (tab) return tab;
    if (group) return 'groups';
    return 'all';
  };

  const [activeTab, setActiveTab] = useState<ContactsTab>(deriveTabFromUrl);

  // Sync tab state when URL changes (e.g. clicking sidebar links while on contacts page)
  useEffect(() => {
    setActiveTab(deriveTabFromUrl());
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentHref]);
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebouncedValue(searchTerm, 300);
  const [actionsMenuOpen, setActionsMenuOpen] = useState(false);
  const actionsMenuRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const activeFilter = tabToFilter(activeTab);

  const { data: contacts = [], isLoading } = useContacts({
    search: debouncedSearch,
    type: activeFilter,
  });

  const handleContactClick = useCallback(
    (contact: Contact) => {
      navigate({ to: '/contacts/$contactId', params: { contactId: contact.id } });
    },
    [navigate],
  );

  // Close actions menu on outside click
  useEffect(() => {
    if (!actionsMenuOpen) return;
    function handleOutsideClick(e: MouseEvent) {
      if (actionsMenuRef.current && !actionsMenuRef.current.contains(e.target as Node)) {
        setActionsMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [actionsMenuOpen]);

  const isContactTab = activeTab === 'all' || activeTab === 'customers' || activeTab === 'suppliers' || activeTab === 'archived';

  return (
    <PageContainer
      title="Contacts"
      actions={
        <div className="flex items-center gap-2">
          {/* Actions menu dropdown — Import, Export, New Group */}
          <div className="relative" ref={actionsMenuRef}>
            <Button
              variant="ghost"
              onClick={() => setActionsMenuOpen((prev) => !prev)}
              data-testid="actions-menu-btn"
            >
              Actions
              <ChevronDown className="h-4 w-4 ml-1" />
            </Button>
            {actionsMenuOpen && (
              <div
                className="absolute right-0 top-full mt-1 z-50 w-40 rounded border border-[#e5e7eb] bg-white shadow-md py-1"
                data-testid="actions-menu-dropdown"
              >
                <NotImplemented label="Import — not yet implemented">
                  <button
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[#1a1a2e] hover:bg-[#f9fafb] transition-colors"
                    onClick={() => { setActionsMenuOpen(false); }}
                    data-testid="import-btn"
                  >
                    <Upload className="h-4 w-4 text-[#6b7280]" />
                    Import
                  </button>
                </NotImplemented>
                <NotImplemented label="Export — not yet implemented">
                  <button
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[#1a1a2e] hover:bg-[#f9fafb] transition-colors"
                    onClick={() => { setActionsMenuOpen(false); }}
                    data-testid="export-btn"
                  >
                    <Download className="h-4 w-4 text-[#6b7280]" />
                    Export
                  </button>
                </NotImplemented>
                <button
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[#1a1a2e] hover:bg-[#f9fafb] transition-colors"
                  onClick={() => { setActionsMenuOpen(false); setActiveTab('groups'); }}
                  data-testid="new-group-btn"
                >
                  <Users className="h-4 w-4 text-[#6b7280]" />
                  New Group
                </button>
              </div>
            )}
          </div>
          <Button
            variant="primary"
            onClick={() => navigate({ to: '/contacts/new' })}
            data-testid="new-contact-btn"
          >
            <Plus className="h-4 w-4 mr-1" />
            New contact
          </Button>
        </div>
      }
    >
      <Tabs defaultTab={activeTab} onChange={(id) => setActiveTab(id as ContactsTab)} data-testid="contacts-tabs">
        <TabList>
          <Tab tabId="all" data-testid="tab-all">All</Tab>
          <Tab tabId="customers" data-testid="tab-customers">Customers</Tab>
          <Tab tabId="suppliers" data-testid="tab-suppliers">Suppliers</Tab>
          <Tab tabId="archived" data-testid="tab-archived">Archived</Tab>
          <Tab tabId="groups" data-testid="tab-groups">Groups</Tab>
          <Tab tabId="smart-lists" data-testid="tab-smart-lists">Smart lists</Tab>
        </TabList>

        {/* Contact list tabs (All, Customers, Suppliers, Archived) */}
        <TabPanel tabId="all">
          <ContactList
            contacts={contacts}
            isLoading={isLoading}
            onContactClick={handleContactClick}
            onSearch={setSearchTerm}
            onFilterChange={() => {}}
            activeFilter={activeFilter}
            searchTerm={searchTerm}
          />
        </TabPanel>

        <TabPanel tabId="customers">
          <ContactList
            contacts={contacts}
            isLoading={isLoading}
            onContactClick={handleContactClick}
            onSearch={setSearchTerm}
            onFilterChange={() => {}}
            activeFilter={activeFilter}
            searchTerm={searchTerm}
          />
        </TabPanel>

        <TabPanel tabId="suppliers">
          <ContactList
            contacts={contacts}
            isLoading={isLoading}
            onContactClick={handleContactClick}
            onSearch={setSearchTerm}
            onFilterChange={() => {}}
            activeFilter={activeFilter}
            searchTerm={searchTerm}
          />
        </TabPanel>

        <TabPanel tabId="archived">
          <ContactList
            contacts={contacts}
            isLoading={isLoading}
            onContactClick={handleContactClick}
            onSearch={setSearchTerm}
            onFilterChange={() => {}}
            activeFilter={activeFilter}
            searchTerm={searchTerm}
          />
        </TabPanel>

        {/* Groups tab */}
        <TabPanel tabId="groups">
          <GroupsTabContent initialGroupName={new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '').get('group') || ''} />
        </TabPanel>

        {/* Smart Lists tab */}
        <TabPanel tabId="smart-lists">
          <SmartListsTabContent />
        </TabPanel>
      </Tabs>

    </PageContainer>
  );
}

/* ════════════════════════════════════════════════════════════════════
   GroupsTabContent — Inline groups management (was ContactGroupsPage)
   ════════════════════════════════════════════════════════════════════ */
function GroupsTabContent({ initialGroupName = '' }: { initialGroupName?: string }) {
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [showNewForm, setShowNewForm] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupDescription, setNewGroupDescription] = useState('');

  const { data: groups = [], isLoading } = useContactGroups();
  const { data: selectedGroup } = useContactGroup(selectedGroupId ?? '');
  const createGroup = useCreateGroup();

  // Auto-select a group by name when navigated via ?group=<name>
  useEffect(() => {
    if (!initialGroupName || selectedGroupId || groups.length === 0) return;
    const match = groups.find(
      (g) => g.name.toLowerCase().replace(/\s+/g, '-') === initialGroupName.toLowerCase(),
    );
    if (match) setSelectedGroupId(match.id);
  }, [initialGroupName, groups, selectedGroupId]);
  const deleteGroup = useDeleteGroup();
  const addMember = useAddMember();
  const removeMember = useRemoveMember();

  const handleGroupClick = useCallback((group: ContactGroup) => {
    setSelectedGroupId(group.id);
  }, []);

  const handleCreateGroup = useCallback(() => {
    if (newGroupName.trim()) {
      createGroup.mutate(
        {
          name: newGroupName.trim(),
          description: newGroupDescription.trim() || undefined,
        },
        {
          onSuccess: () => {
            setShowNewForm(false);
            setNewGroupName('');
            setNewGroupDescription('');
            showToast('success', 'Group created');
          },
          onError: (err: Error) => showToast('error', err.message || 'Failed to create group'),
        },
      );
    }
  }, [newGroupName, newGroupDescription, createGroup]);

  const handleAddMember = useCallback(
    (contactId: string) => {
      if (selectedGroupId) {
        addMember.mutate(
          { groupId: selectedGroupId, contactId },
          {
            onSuccess: () => showToast('success', 'Member added'),
            onError: (err: Error) => showToast('error', err.message || 'Failed to add member'),
          },
        );
      }
    },
    [selectedGroupId, addMember],
  );

  const handleRemoveMember = useCallback(
    (contactId: string) => {
      if (selectedGroupId) {
        removeMember.mutate(
          { groupId: selectedGroupId, contactId },
          {
            onSuccess: () => showToast('success', 'Member removed'),
            onError: (err: Error) => showToast('error', err.message || 'Failed to remove member'),
          },
        );
      }
    },
    [selectedGroupId, removeMember],
  );

  return (
    <div data-testid="groups-tab-content">
      {selectedGroupId && selectedGroup ? (
        <div className="space-y-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSelectedGroupId(null)}
            data-testid="back-to-groups"
          >
            Back to Groups
          </Button>
          <ContactGroupDetail
            group={selectedGroup}
            onAddMember={handleAddMember}
            onRemoveMember={handleRemoveMember}
            isAddingMember={addMember.isPending}
          />
        </div>
      ) : (
        <ContactGroupList
          groups={groups}
          isLoading={isLoading}
          onGroupClick={handleGroupClick}
          onNewGroup={() => setShowNewForm(true)}
        />
      )}

      <Dialog
        open={showNewForm}
        onClose={() => setShowNewForm(false)}
        title="New Contact Group"
        footer={
          <>
            <Button variant="ghost" onClick={() => setShowNewForm(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleCreateGroup}
              disabled={!newGroupName.trim()}
              loading={createGroup.isPending}
              data-testid="create-group-btn"
            >
              Create Group
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input
            label="Group Name"
            placeholder="e.g. VIP Clients"
            value={newGroupName}
            onChange={(e) => setNewGroupName(e.target.value)}
            data-testid="group-name-input"
          />
          <Input
            label="Description"
            placeholder="Optional description"
            value={newGroupDescription}
            onChange={(e) => setNewGroupDescription(e.target.value)}
            data-testid="group-description-input"
          />
        </div>
      </Dialog>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════
   SmartListsTabContent — Inline smart lists (was SmartListsPage)
   ════════════════════════════════════════════════════════════════════ */
function SmartListsTabContent() {
  const { data: smartLists = [] } = useSmartLists();
  const { mutate: saveList } = useSaveSmartList();
  const { mutate: deleteList } = useDeleteSmartList();

  const [listName, setListName] = useState('');
  const [filters, setFilters] = useState<SmartListFilter[]>([]);
  const [nameError, setNameError] = useState('');

  function handleSave() {
    if (!listName.trim()) {
      setNameError('List name is required');
      return;
    }
    setNameError('');
    saveList({ name: listName.trim(), filters });
    setListName('');
    setFilters([]);
  }

  return (
    <div className="space-y-6" data-testid="smart-lists-tab-content">
      {/* Create New Smart List */}
      <Card>
        <CardHeader>
          <h2 className="text-sm font-semibold">Create Smart List</h2>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Input
              label="List Name"
              placeholder="My Smart List"
              value={listName}
              onChange={(e) => {
                setListName(e.target.value);
                if (nameError) setNameError('');
              }}
              error={nameError}
              inputId="smart-list-name"
              data-testid="smart-list-name"
            />
            <SmartListBuilder filters={filters} onChange={setFilters} />
            <Button
              variant="primary"
              onClick={handleSave}
              data-testid="save-smart-list-btn"
            >
              Save Smart List
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Saved Smart Lists */}
      <Card>
        <CardHeader>
          <h2 className="text-sm font-semibold">Saved Lists</h2>
        </CardHeader>
        <CardContent>
          {smartLists.length === 0 ? (
            <p className="text-sm text-[#6b7280]" data-testid="no-smart-lists">
              No smart lists yet. Create one above.
            </p>
          ) : (
            <ul className="divide-y divide-[#e5e7eb]" data-testid="smart-lists-list">
              {smartLists.map((list) => (
                <li
                  key={list.id}
                  className="flex items-center justify-between py-3"
                  data-testid={`smart-list-item-${list.id}`}
                >
                  <div>
                    <p className="text-sm font-medium text-[#1a1a2e]">{list.name}</p>
                    <p className="text-xs text-[#6b7280]">
                      {list.filters.length} filter{list.filters.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteList(list.id)}
                    data-testid={`delete-smart-list-${list.id}`}
                  >
                    Delete
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════
   ContactDetailPage — Contact detail page
   (standalone route: /contacts/$contactId)
   Edit navigates to /contacts/$contactId/edit (ContactEditPage).
   ════════════════════════════════════════════════════════════════════ */
export function ContactDetailPage() {
  const { contactId } = useParams({ from: '/contacts/$contactId' });
  const navigate = useNavigate();
  const { data: contact, isLoading, error } = useContact(contactId);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const deleteContact = useDeleteContact();
  const archiveContact = useArchiveContact();
  const unarchiveContact = useUnarchiveContact();

  const handleArchiveToggle = useCallback(() => {
    const isArchived = contact?.isArchived;
    if (isArchived) {
      unarchiveContact.mutate(contactId, {
        onSuccess: () => showToast('success', 'Contact unarchived'),
        onError: (err: Error) => showToast('error', err.message || 'Failed to unarchive contact'),
      });
    } else {
      archiveContact.mutate(contactId, {
        onSuccess: () => showToast('success', 'Contact archived'),
        onError: (err: Error) => showToast('error', err.message || 'Failed to archive contact'),
      });
    }
  }, [contact, contactId, archiveContact, unarchiveContact]);

  const handleDelete = useCallback(() => {
    deleteContact.mutate(contactId, {
      onSuccess: () => {
        showToast('success', 'Contact deleted');
        navigate({ to: '/contacts' });
      },
      onError: (err: Error) => showToast('error', err.message || 'Failed to delete contact'),
    });
  }, [contactId, deleteContact, navigate]);

  if (isLoading) {
    return (
      <PageContainer title="Loading...">
        <div className="py-12 text-center text-[#6b7280]" data-testid="detail-loading">
          Loading contact...
        </div>
      </PageContainer>
    );
  }

  if (error || !contact) {
    return (
      <PageContainer title="Error">
        <div className="py-12 text-center text-[#ef4444]" data-testid="detail-error">
          Contact not found.
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer
      title={contact.name}
      breadcrumbs={[
        { label: 'Contacts', href: '/contacts' },
        { label: contact.name },
      ]}
      actions={
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleArchiveToggle}
            loading={archiveContact.isPending || unarchiveContact.isPending}
            data-testid="archive-contact-btn"
          >
            {contact.isArchived ? (
              <>
                <ArchiveRestore className="h-4 w-4 mr-1" />
                Unarchive
              </>
            ) : (
              <>
                <Archive className="h-4 w-4 mr-1" />
                Archive
              </>
            )}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowDeleteConfirm(true)}
            data-testid="delete-contact-btn"
          >
            <Trash2 className="h-4 w-4 mr-1" />
            Delete
          </Button>
          <Button
            variant="ghost"
            onClick={() => navigate({ to: '/contacts' })}
            data-testid="back-to-contacts"
          >
            Back to Contacts
          </Button>
        </div>
      }
    >
      {contact.isArchived && (
        <div className="mb-4">
          <Badge variant="warning">Archived</Badge>
        </div>
      )}
      <ContactDetail
        contact={contact}
        onEdit={() => navigate({ to: '/contacts/$contactId/edit', params: { contactId } })}
        onNewInvoice={() => navigate({ to: '/sales/invoices/new' })}
        onArchive={handleArchiveToggle}
      />

      <Dialog
        open={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        title="Delete Contact"
        footer={
          <>
            <Button variant="ghost" onClick={() => setShowDeleteConfirm(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              loading={deleteContact.isPending}
              data-testid="confirm-delete-btn"
            >
              Delete
            </Button>
          </>
        }
      >
        <p data-testid="delete-confirm-message">
          Are you sure you want to delete <strong>{contact.name}</strong>? This
          action cannot be undone.
        </p>
      </Dialog>
    </PageContainer>
  );
}

/* ════════════════════════════════════════════════════════════════════
   ContactCreatePage — Standalone create page (/contacts/new)
   No Dialog wrapper — form renders directly inside PageContainer.
   Scrollable content with sticky footer (Save & close / Cancel).
   ════════════════════════════════════════════════════════════════════ */

type CreateFormSection = 'contact-details' | 'addresses' | 'financial' | 'sales-defaults' | 'purchase-defaults';

const CREATE_SECTIONS: { id: CreateFormSection; label: string }[] = [
  { id: 'contact-details', label: 'Contact details' },
  { id: 'addresses', label: 'Addresses' },
  { id: 'financial', label: 'Financial details' },
  { id: 'sales-defaults', label: 'Sales defaults' },
  { id: 'purchase-defaults', label: 'Purchase defaults' },
];

const CONTACT_TYPE_OPTIONS_CREATE = [
  { value: 'customer', label: 'Customer' },
  { value: 'supplier', label: 'Supplier' },
  { value: 'customer_and_supplier', label: 'Customer & Supplier' },
];

const AMOUNTS_ARE_OPTIONS_CREATE = [
  { value: 'exclusive', label: 'Tax Exclusive' },
  { value: 'inclusive', label: 'Tax Inclusive' },
  { value: 'no_tax', label: 'No Tax' },
];

const CURRENCY_OPTIONS_CREATE = [
  { value: 'NZD', label: 'NZD - New Zealand Dollar' },
  { value: 'AUD', label: 'AUD - Australian Dollar' },
  { value: 'USD', label: 'USD - US Dollar' },
  { value: 'GBP', label: 'GBP - British Pound' },
  { value: 'EUR', label: 'EUR - Euro' },
];

const DUE_DATE_OPTIONS_CREATE = [
  { value: '0', label: 'Due on Receipt' },
  { value: '7', label: 'Net 7' },
  { value: '15', label: 'Net 15' },
  { value: '20', label: 'Net 20' },
  { value: '30', label: 'Net 30' },
  { value: '60', label: 'Net 60' },
];

const DEFAULT_ACCOUNT_OPTIONS: ComboboxOption[] = [
  { value: '200', label: '200 - Sales', description: 'Revenue' },
  { value: '260', label: '260 - Other Revenue', description: 'Revenue' },
  { value: '400', label: '400 - Advertising', description: 'Expense' },
  { value: '404', label: '404 - Bank Fees', description: 'Expense' },
  { value: '408', label: '408 - Cleaning', description: 'Expense' },
  { value: '412', label: '412 - Consulting', description: 'Expense' },
  { value: '416', label: '416 - Depreciation', description: 'Expense' },
  { value: '420', label: '420 - Entertainment', description: 'Expense' },
  { value: '429', label: '429 - General Expenses', description: 'Expense' },
  { value: '461', label: '461 - Rent', description: 'Expense' },
];

const DEFAULT_TAX_RATE_OPTIONS: ComboboxOption[] = [
  { value: '15', label: '15% GST on Income' },
  { value: '15-expense', label: '15% GST on Expenses' },
  { value: '0', label: '0% No GST' },
  { value: 'exempt', label: 'GST Exempt' },
];

const REGION_OPTIONS: ComboboxOption[] = [
  { value: 'auckland', label: 'Auckland' },
  { value: 'wellington', label: 'Wellington' },
  { value: 'canterbury', label: 'Canterbury' },
  { value: 'waikato', label: 'Waikato' },
  { value: 'bay-of-plenty', label: 'Bay of Plenty' },
];

const BRANDING_THEME_OPTIONS = [
  { value: 'standard', label: 'Standard' },
  { value: 'special', label: 'Special' },
  { value: 'very-nice', label: 'Very Nice Quote' },
];

interface CreateFormData {
  name: string;
  email: string;
  phone: string;
  type: 'customer' | 'supplier' | 'customer_and_supplier';
  taxNumber: string;
  bankAccountName: string;
  bankAccountNumber: string;
  bankBSB: string;
  defaultAccountCode: string;
  defaultTaxRate: string;
  firstName: string;
  lastName: string;
  primaryEmail: string;
  additionalPersons: ContactPerson[];
  phoneCountry: string;
  phoneArea: string;
  phoneNumber: string;
  notes: string;
  billingAddress: string;
  billingAddressManual: boolean;
  deliveryAddresses: DeliveryAddress[];
  financialParticulars: string;
  financialCode: string;
  financialReference: string;
  gstNumber: string;
  currency: string;
  salesAccount: string;
  invoiceDueDate: string;
  salesAmountsAre: string;
  salesGst: string;
  salesDiscount: string;
  creditLimit: string;
  blockNewInvoices: boolean;
  brandingTheme: string;
  salesRegion: string;
  xeroNetworkKey: string;
  purchaseAccount: string;
  billDueDate: string;
  purchaseAmountsAre: string;
  purchaseGst: string;
  purchaseRegion: string;
}

function getDefaultCreateFormData(): CreateFormData {
  return {
    name: '',
    email: '',
    phone: '',
    type: 'customer',
    taxNumber: '',
    bankAccountName: '',
    bankAccountNumber: '',
    bankBSB: '',
    defaultAccountCode: '',
    defaultTaxRate: '',
    firstName: '',
    lastName: '',
    primaryEmail: '',
    additionalPersons: [],
    phoneCountry: '+64',
    phoneArea: '',
    phoneNumber: '',
    notes: '',
    billingAddress: '',
    billingAddressManual: false,
    deliveryAddresses: [],
    financialParticulars: '',
    financialCode: '',
    financialReference: '',
    gstNumber: '',
    currency: 'NZD',
    salesAccount: '',
    invoiceDueDate: '30',
    salesAmountsAre: 'exclusive',
    salesGst: '',
    salesDiscount: '',
    creditLimit: '',
    blockNewInvoices: false,
    brandingTheme: '',
    salesRegion: '',
    xeroNetworkKey: '',
    purchaseAccount: '',
    billDueDate: '30',
    purchaseAmountsAre: 'exclusive',
    purchaseGst: '',
    purchaseRegion: '',
  };
}

export function ContactCreatePage() {
  const navigate = useNavigate();
  const createContact = useCreateContact();
  const { data: accountsData } = useAccounts();
  const { data: taxRatesData } = useTaxRates();
  const [formData, setFormData] = useState<CreateFormData>(getDefaultCreateFormData());
  const [errors, setErrors] = useState<Record<string, string>>({});

  const resolvedAccountOptions: ComboboxOption[] = accountsData && accountsData.length > 0
    ? accountsData.map((a) => ({ value: a.code, label: `${a.code} - ${a.name}` }))
    : DEFAULT_ACCOUNT_OPTIONS;

  const resolvedTaxRateOptions: ComboboxOption[] = taxRatesData && taxRatesData.length > 0
    ? taxRatesData.map((tr) => ({ value: String(tr.rate), label: tr.name }))
    : DEFAULT_TAX_RATE_OPTIONS;

  // Refs to each section for scroll-to behavior
  const sectionRefs = useRef<Record<CreateFormSection, HTMLElement | null>>({
    'contact-details': null,
    addresses: null,
    financial: null,
    'sales-defaults': null,
    'purchase-defaults': null,
  });

  function handleChange(field: keyof CreateFormData, value: unknown) {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  }

  function validate(): boolean {
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) {
      newErrors.name = 'Contact name is required';
    }
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email address';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  function handleSave(e: FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    createContact.mutate(
      {
        name: formData.name,
        type: formData.type,
        email: formData.email || undefined,
        phone: formData.phone || undefined,
        taxNumber: formData.taxNumber || undefined,
        bankAccountName: formData.bankAccountName || undefined,
        bankAccountNumber: formData.bankAccountNumber || undefined,
        defaultAccountCode: formData.defaultAccountCode || undefined,
        isArchived: false,
      },
      {
        onSuccess: () => {
          showToast('success', 'Contact created');
          navigate({ to: '/contacts' });
        },
        onError: (err: unknown) => {
          const message = err instanceof Error ? err.message : 'Failed to create contact';
          showToast('error', message);
        },
      },
    );
  }

  function scrollToSection(sectionId: CreateFormSection) {
    const el = sectionRefs.current[sectionId];
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  const isSubmitting = createContact.isPending;

  return (
    <PageContainer
      title="New Contact"
      breadcrumbs={[
        { label: 'Contacts', href: '/contacts' },
        { label: 'New Contact' },
      ]}
    >
      {/* Two-column layout: sticky side nav + scrollable form */}
      <div className="flex gap-6 relative">
        {/* Section Nav — sticky sidebar */}
        <nav
          className="w-48 shrink-0 sticky top-0 self-start space-y-1 pt-2"
          data-testid="form-side-nav"
        >
          {CREATE_SECTIONS.map((section) => (
            <button
              key={section.id}
              type="button"
              className="w-full text-left px-3 py-2 rounded text-sm text-[#6b7280] hover:bg-gray-100 transition-colors"
              onClick={() => scrollToSection(section.id)}
              data-testid={`nav-${section.id}`}
            >
              {section.label}
            </button>
          ))}
        </nav>

        {/* Scrollable form + sticky footer */}
        <div className="flex-1 min-w-0">
          <form onSubmit={handleSave} noValidate>
            <div className="space-y-10 pb-24">
              {/* ── Contact Details ── */}
              <section
                id="section-contact-details"
                data-testid="section-contact-details"
                ref={(el) => { sectionRefs.current['contact-details'] = el; }}
                className="space-y-4"
              >
                <h2 className="text-lg font-semibold text-[#1a1a2e] border-b border-[#e5e7eb] pb-2">
                  Contact details
                </h2>

                <Input
                  label="Name"
                  placeholder="Contact name"
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  error={errors.name}
                  inputId="contact-name"
                  data-testid="contact-name-input"
                  required
                />

                <Select
                  label="Type"
                  options={CONTACT_TYPE_OPTIONS_CREATE}
                  value={formData.type}
                  onChange={(e) => handleChange('type', e.target.value)}
                  selectId="contact-type"
                  data-testid="contact-type-select"
                />

                {/* Primary person */}
                <fieldset className="border border-[#e5e7eb] rounded-md p-4 space-y-3">
                  <legend className="text-sm font-medium text-[#1a1a2e] px-2">Primary person</legend>
                  <div className="grid grid-cols-2 gap-3">
                    <Input
                      label="First Name"
                      value={formData.firstName}
                      onChange={(e) => handleChange('firstName', e.target.value)}
                      inputId="primary-first-name"
                      data-testid="primary-first-name"
                    />
                    <Input
                      label="Last Name"
                      value={formData.lastName}
                      onChange={(e) => handleChange('lastName', e.target.value)}
                      inputId="primary-last-name"
                      data-testid="primary-last-name"
                    />
                  </div>
                  <Input
                    label="Email"
                    type="email"
                    placeholder="email@example.com"
                    value={formData.primaryEmail}
                    onChange={(e) => handleChange('primaryEmail', e.target.value)}
                    inputId="primary-email"
                    data-testid="primary-email"
                  />
                </fieldset>

                {/* Additional people */}
                <fieldset className="border border-[#e5e7eb] rounded-md p-4">
                  <legend className="text-sm font-medium text-[#1a1a2e] px-2">Additional people</legend>
                  <ContactPersonsList
                    persons={formData.additionalPersons}
                    onChange={(persons) => handleChange('additionalPersons', persons)}
                  />
                </fieldset>

                {/* Email (legacy) */}
                <Input
                  label="Email"
                  type="email"
                  placeholder="email@example.com"
                  value={formData.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  error={errors.email}
                  inputId="contact-email"
                  data-testid="contact-email-input"
                />

                {/* Phone */}
                <fieldset className="border border-[#e5e7eb] rounded-md p-4 space-y-3">
                  <legend className="text-sm font-medium text-[#1a1a2e] px-2">Phone</legend>
                  <div className="grid grid-cols-3 gap-3">
                    <Input
                      label="Country"
                      value={formData.phoneCountry}
                      onChange={(e) => handleChange('phoneCountry', e.target.value)}
                      inputId="phone-country"
                      data-testid="phone-country"
                      placeholder="+64"
                    />
                    <Input
                      label="Area"
                      value={formData.phoneArea}
                      onChange={(e) => handleChange('phoneArea', e.target.value)}
                      inputId="phone-area"
                      data-testid="phone-area"
                      placeholder="9"
                    />
                    <Input
                      label="Number"
                      value={formData.phoneNumber}
                      onChange={(e) => handleChange('phoneNumber', e.target.value)}
                      inputId="phone-number"
                      data-testid="phone-number"
                      placeholder="555 0100"
                    />
                  </div>
                </fieldset>

                {/* Legacy phone */}
                <Input
                  label="Phone"
                  type="tel"
                  placeholder="555-0100"
                  value={formData.phone}
                  onChange={(e) => handleChange('phone', e.target.value)}
                  inputId="contact-phone"
                  data-testid="contact-phone-input"
                />

                {/* Tax Number */}
                <Input
                  label="Tax Number"
                  placeholder="NZ-12-345-678"
                  value={formData.taxNumber}
                  onChange={(e) => handleChange('taxNumber', e.target.value)}
                  inputId="contact-tax"
                  data-testid="contact-tax-input"
                />

                {/* Notes */}
                <div className="space-y-1">
                  <label htmlFor="contact-notes" className="block text-sm font-medium text-[#1a1a2e]">
                    Notes
                  </label>
                  <textarea
                    id="contact-notes"
                    className="w-full rounded-md border border-[#e5e7eb] px-3 py-2 text-sm focus:border-[#0078c8] focus:outline-none focus:ring-1 focus:ring-[#0078c8]"
                    rows={4}
                    maxLength={4000}
                    value={formData.notes}
                    onChange={(e) => handleChange('notes', e.target.value)}
                    data-testid="contact-notes"
                    placeholder="Add notes about this contact..."
                  />
                  <p className="text-xs text-[#6b7280] text-right" data-testid="notes-char-count">
                    {formData.notes.length} / 4000
                  </p>
                </div>
              </section>

              {/* ── Addresses ── */}
              <section
                id="section-addresses"
                data-testid="section-addresses"
                ref={(el) => { sectionRefs.current['addresses'] = el; }}
                className="space-y-6"
              >
                <h2 className="text-lg font-semibold text-[#1a1a2e] border-b border-[#e5e7eb] pb-2">
                  Addresses
                </h2>

                <fieldset className="border border-[#e5e7eb] rounded-md p-4 space-y-3">
                  <legend className="text-sm font-medium text-[#1a1a2e] px-2">Billing address</legend>
                  {!formData.billingAddressManual ? (
                    <div>
                      <Input
                        label="Search address"
                        placeholder="Start typing an address..."
                        value={formData.billingAddress}
                        onChange={(e) => handleChange('billingAddress', e.target.value)}
                        inputId="billing-address-search"
                        data-testid="billing-address-search"
                      />
                      <button
                        type="button"
                        className="mt-2 text-sm text-[#0078c8] hover:underline"
                        onClick={() => handleChange('billingAddressManual', true)}
                        data-testid="enter-address-manually"
                      >
                        Enter address manually
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3" data-testid="manual-billing-address">
                      <Input
                        label="Address"
                        value={formData.billingAddress}
                        onChange={(e) => handleChange('billingAddress', e.target.value)}
                        inputId="billing-address-manual"
                        data-testid="billing-address-manual"
                      />
                      <button
                        type="button"
                        className="text-sm text-[#0078c8] hover:underline"
                        onClick={() => handleChange('billingAddressManual', false)}
                      >
                        Search address
                      </button>
                    </div>
                  )}
                </fieldset>

                <fieldset className="border border-[#e5e7eb] rounded-md p-4">
                  <legend className="text-sm font-medium text-[#1a1a2e] px-2">Delivery address</legend>
                  <DeliveryAddressForm
                    addresses={formData.deliveryAddresses}
                    onChange={(addrs) => handleChange('deliveryAddresses', addrs)}
                  />
                </fieldset>
              </section>

              {/* ── Financial Details ── */}
              <section
                id="section-financial"
                data-testid="section-financial"
                ref={(el) => { sectionRefs.current['financial'] = el; }}
                className="space-y-4"
              >
                <h2 className="text-lg font-semibold text-[#1a1a2e] border-b border-[#e5e7eb] pb-2">
                  Financial details
                </h2>

                <Input
                  label="Bank Account Name"
                  placeholder="Business Account"
                  value={formData.bankAccountName}
                  onChange={(e) => handleChange('bankAccountName', e.target.value)}
                  inputId="contact-bank-name"
                  data-testid="contact-bank-name-input"
                />
                <Input
                  label="Bank Account Number"
                  placeholder="12-3456-7890123-00"
                  value={formData.bankAccountNumber}
                  onChange={(e) => handleChange('bankAccountNumber', e.target.value)}
                  inputId="contact-bank-number"
                  data-testid="contact-bank-number-input"
                />
                <div className="grid grid-cols-3 gap-3">
                  <Input
                    label="Particulars"
                    value={formData.financialParticulars}
                    onChange={(e) => handleChange('financialParticulars', e.target.value)}
                    inputId="financial-particulars"
                    data-testid="financial-particulars"
                  />
                  <Input
                    label="Code"
                    value={formData.financialCode}
                    onChange={(e) => handleChange('financialCode', e.target.value)}
                    inputId="financial-code"
                    data-testid="financial-code"
                  />
                  <Input
                    label="Reference"
                    value={formData.financialReference}
                    onChange={(e) => handleChange('financialReference', e.target.value)}
                    inputId="financial-reference"
                    data-testid="financial-reference"
                  />
                </div>
                <Input
                  label="Bank BSB"
                  placeholder="012-345"
                  value={formData.bankBSB}
                  onChange={(e) => handleChange('bankBSB', e.target.value)}
                  inputId="contact-bank-bsb"
                  data-testid="contact-bank-bsb-input"
                />
                <Input
                  label="GST Number"
                  placeholder="123-456-789"
                  value={formData.gstNumber}
                  onChange={(e) => handleChange('gstNumber', e.target.value)}
                  inputId="gst-number"
                  data-testid="gst-number"
                />
                <Select
                  label="Currency"
                  options={CURRENCY_OPTIONS_CREATE}
                  value={formData.currency}
                  onChange={(e) => handleChange('currency', e.target.value)}
                  selectId="currency"
                  data-testid="currency-select"
                />
              </section>

              {/* ── Sales Defaults ── */}
              <section
                id="section-sales-defaults"
                data-testid="section-sales-defaults"
                ref={(el) => { sectionRefs.current['sales-defaults'] = el; }}
                className="space-y-4"
              >
                <h2 className="text-lg font-semibold text-[#1a1a2e] border-b border-[#e5e7eb] pb-2">
                  Sales defaults
                </h2>

                <Combobox
                  label="Sales Account"
                  placeholder="Search accounts..."
                  options={resolvedAccountOptions}
                  value={formData.salesAccount}
                  onChange={(val) => handleChange('salesAccount', val)}
                  onCreateNew={() => navigate({ to: '/accounting/chart-of-accounts/new' })}
                  className="w-full"
                />
                <Select
                  label="Invoice Due Date"
                  options={DUE_DATE_OPTIONS_CREATE}
                  value={formData.invoiceDueDate}
                  onChange={(e) => handleChange('invoiceDueDate', e.target.value)}
                  selectId="invoice-due-date"
                  data-testid="invoice-due-date"
                />
                <Select
                  label="Amounts are"
                  options={AMOUNTS_ARE_OPTIONS_CREATE}
                  value={formData.salesAmountsAre}
                  onChange={(e) => handleChange('salesAmountsAre', e.target.value)}
                  selectId="sales-amounts-are"
                  data-testid="sales-amounts-are"
                />
                <Combobox
                  label="Sales GST"
                  placeholder="Search tax rates..."
                  options={resolvedTaxRateOptions}
                  value={formData.salesGst}
                  onChange={(val) => handleChange('salesGst', val)}
                  className="w-full"
                />
                <Input
                  label="Discount"
                  placeholder="0%"
                  value={formData.salesDiscount}
                  onChange={(e) => handleChange('salesDiscount', e.target.value)}
                  inputId="sales-discount"
                  data-testid="sales-discount"
                />
                <Input
                  label="Credit Limit"
                  placeholder="0.00"
                  value={formData.creditLimit}
                  onChange={(e) => handleChange('creditLimit', e.target.value)}
                  inputId="credit-limit"
                  data-testid="credit-limit"
                />
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="block-new-invoices"
                    checked={formData.blockNewInvoices}
                    onChange={(e) => handleChange('blockNewInvoices', e.target.checked)}
                    className="h-4 w-4 rounded border-[#d1d5db] text-[#0078c8]"
                    data-testid="block-new-invoices"
                  />
                  <label htmlFor="block-new-invoices" className="text-sm text-[#1a1a2e]">
                    Block new invoices when credit limit is reached
                  </label>
                </div>
                <Select
                  label="Branding Theme"
                  options={BRANDING_THEME_OPTIONS}
                  value={formData.brandingTheme}
                  onChange={(e) => handleChange('brandingTheme', e.target.value)}
                  selectId="branding-theme"
                  data-testid="branding-theme"
                />
                <Combobox
                  label="Region"
                  placeholder="Search regions..."
                  options={REGION_OPTIONS}
                  value={formData.salesRegion}
                  onChange={(val) => handleChange('salesRegion', val)}
                  className="w-full"
                />
                <Input
                  label="Xero Network Key"
                  value={formData.xeroNetworkKey}
                  onChange={(e) => handleChange('xeroNetworkKey', e.target.value)}
                  inputId="xero-network-key"
                  data-testid="xero-network-key"
                />
                <Combobox
                  label="Default Account Code"
                  placeholder="Search accounts..."
                  options={resolvedAccountOptions}
                  value={formData.defaultAccountCode}
                  onChange={(val) => handleChange('defaultAccountCode', val)}
                  onCreateNew={() => navigate({ to: '/accounting/chart-of-accounts/new' })}
                  className="w-full"
                />
                <Combobox
                  label="Default Tax Rate"
                  placeholder="Search tax rates..."
                  options={resolvedTaxRateOptions}
                  value={formData.defaultTaxRate}
                  onChange={(val) => handleChange('defaultTaxRate', val)}
                  className="w-full"
                />
              </section>

              {/* ── Purchase Defaults ── */}
              <section
                id="section-purchase-defaults"
                data-testid="section-purchase-defaults"
                ref={(el) => { sectionRefs.current['purchase-defaults'] = el; }}
                className="space-y-4"
              >
                <h2 className="text-lg font-semibold text-[#1a1a2e] border-b border-[#e5e7eb] pb-2">
                  Purchase defaults
                </h2>

                <Combobox
                  label="Purchase Account"
                  placeholder="Search accounts..."
                  options={resolvedAccountOptions}
                  value={formData.purchaseAccount}
                  onChange={(val) => handleChange('purchaseAccount', val)}
                  onCreateNew={() => navigate({ to: '/accounting/chart-of-accounts/new' })}
                  className="w-full"
                />
                <Select
                  label="Bill Due Date"
                  options={DUE_DATE_OPTIONS_CREATE}
                  value={formData.billDueDate}
                  onChange={(e) => handleChange('billDueDate', e.target.value)}
                  selectId="bill-due-date"
                  data-testid="bill-due-date"
                />
                <Select
                  label="Amounts are"
                  options={AMOUNTS_ARE_OPTIONS_CREATE}
                  value={formData.purchaseAmountsAre}
                  onChange={(e) => handleChange('purchaseAmountsAre', e.target.value)}
                  selectId="purchase-amounts-are"
                  data-testid="purchase-amounts-are"
                />
                <Combobox
                  label="Purchase GST"
                  placeholder="Search tax rates..."
                  options={resolvedTaxRateOptions}
                  value={formData.purchaseGst}
                  onChange={(val) => handleChange('purchaseGst', val)}
                  className="w-full"
                />
                <Combobox
                  label="Region"
                  placeholder="Search regions..."
                  options={REGION_OPTIONS}
                  value={formData.purchaseRegion}
                  onChange={(val) => handleChange('purchaseRegion', val)}
                  className="w-full"
                />
              </section>
            </div>

            {/* ── Sticky Footer ── */}
            <div
              className="sticky bottom-0 bg-white border-t border-[#e5e7eb] px-0 py-4 flex items-center justify-end gap-3"
              data-testid="sticky-footer"
            >
              <Button
                variant="ghost"
                type="button"
                onClick={() => navigate({ to: '/contacts' })}
                disabled={isSubmitting}
                data-testid="cancel-btn"
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                type="submit"
                loading={isSubmitting}
                disabled={isSubmitting}
                data-testid="save-close-btn"
              >
                Save &amp; close
              </Button>
            </div>
          </form>
        </div>
      </div>
    </PageContainer>
  );
}

/* ════════════════════════════════════════════════════════════════════
   ContactEditPage — Standalone edit page (/contacts/$contactId/edit)
   Loads existing contact data and pre-fills the form.
   Same layout as ContactCreatePage but with "Edit Contact" heading.
   ════════════════════════════════════════════════════════════════════ */
export function ContactEditPage() {
  const { contactId } = useParams({ from: '/contacts/$contactId/edit' });
  const navigate = useNavigate();
  const { data: contact, isLoading, error } = useContact(contactId);
  const updateContact = useUpdateContact();
  const { data: accountsData } = useAccounts();
  const { data: taxRatesData } = useTaxRates();
  const [formData, setFormData] = useState<CreateFormData | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Pre-fill form once contact data is loaded
  useEffect(() => {
    if (contact && !formData) {
      setFormData({
        ...getDefaultCreateFormData(),
        name: contact.name,
        email: contact.email ?? '',
        phone: contact.phone ?? '',
        type: contact.type,
        taxNumber: contact.taxNumber ?? '',
        bankAccountName: contact.bankAccountName ?? '',
        bankAccountNumber: contact.bankAccountNumber ?? '',
        bankBSB: contact.bankBSB ?? '',
        defaultAccountCode: contact.defaultAccountCode ?? '',
        defaultTaxRate: contact.defaultTaxRate ?? '',
      });
    }
  }, [contact, formData]);

  const resolvedAccountOptions: ComboboxOption[] = accountsData && accountsData.length > 0
    ? accountsData.map((a) => ({ value: a.code, label: `${a.code} - ${a.name}` }))
    : DEFAULT_ACCOUNT_OPTIONS;

  const resolvedTaxRateOptions: ComboboxOption[] = taxRatesData && taxRatesData.length > 0
    ? taxRatesData.map((tr) => ({ value: String(tr.rate), label: tr.name }))
    : DEFAULT_TAX_RATE_OPTIONS;

  const sectionRefs = useRef<Record<CreateFormSection, HTMLElement | null>>({
    'contact-details': null,
    addresses: null,
    financial: null,
    'sales-defaults': null,
    'purchase-defaults': null,
  });

  function handleChange(field: keyof CreateFormData, value: unknown) {
    setFormData((prev) => prev ? { ...prev, [field]: value } : prev);
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  }

  function validate(): boolean {
    if (!formData) return false;
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) {
      newErrors.name = 'Contact name is required';
    }
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email address';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  function handleSave(e: FormEvent) {
    e.preventDefault();
    if (!formData || !validate()) return;

    updateContact.mutate(
      {
        id: contactId,
        data: {
          name: formData.name,
          type: formData.type,
          email: formData.email || undefined,
          phone: formData.phone || undefined,
          taxNumber: formData.taxNumber || undefined,
          bankAccountName: formData.bankAccountName || undefined,
          bankAccountNumber: formData.bankAccountNumber || undefined,
          bankBSB: formData.bankBSB || undefined,
          defaultAccountCode: formData.defaultAccountCode || undefined,
          defaultTaxRate: formData.defaultTaxRate || undefined,
        },
      },
      {
        onSuccess: () => {
          showToast('success', 'Contact updated');
          navigate({ to: '/contacts/$contactId', params: { contactId } });
        },
        onError: (err: unknown) => {
          const message = err instanceof Error ? err.message : 'Failed to update contact';
          showToast('error', message);
        },
      },
    );
  }

  function scrollToSection(sectionId: CreateFormSection) {
    const el = sectionRefs.current[sectionId];
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  if (isLoading) {
    return (
      <PageContainer title="Loading...">
        <div className="py-12 text-center text-[#6b7280]" data-testid="edit-loading">
          Loading contact...
        </div>
      </PageContainer>
    );
  }

  if (error || !contact || !formData) {
    return (
      <PageContainer title="Error">
        <div className="py-12 text-center text-[#ef4444]" data-testid="edit-error">
          Contact not found.
        </div>
      </PageContainer>
    );
  }

  const isSubmitting = updateContact.isPending;

  return (
    <PageContainer
      title="Edit Contact"
      breadcrumbs={[
        { label: 'Contacts', href: '/contacts' },
        { label: contact.name, href: `/contacts/${contactId}` },
        { label: 'Edit' },
      ]}
    >
      {/* Two-column layout: sticky side nav + scrollable form */}
      <div className="flex gap-6 relative">
        {/* Section Nav — sticky sidebar */}
        <nav
          className="w-48 shrink-0 sticky top-0 self-start space-y-1 pt-2"
          data-testid="form-side-nav"
        >
          {CREATE_SECTIONS.map((section) => (
            <button
              key={section.id}
              type="button"
              className="w-full text-left px-3 py-2 rounded text-sm text-[#6b7280] hover:bg-gray-100 transition-colors"
              onClick={() => scrollToSection(section.id)}
              data-testid={`nav-${section.id}`}
            >
              {section.label}
            </button>
          ))}
        </nav>

        {/* Scrollable form + sticky footer */}
        <div className="flex-1 min-w-0">
          <form onSubmit={handleSave} noValidate>
            <div className="space-y-10 pb-24">
              {/* ── Contact Details ── */}
              <section
                id="section-contact-details"
                data-testid="section-contact-details"
                ref={(el) => { sectionRefs.current['contact-details'] = el; }}
                className="space-y-4"
              >
                <h2 className="text-lg font-semibold text-[#1a1a2e] border-b border-[#e5e7eb] pb-2">
                  Contact details
                </h2>

                <Input
                  label="Name"
                  placeholder="Contact name"
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  error={errors.name}
                  inputId="contact-name"
                  data-testid="contact-name-input"
                  required
                />

                <Select
                  label="Type"
                  options={CONTACT_TYPE_OPTIONS_CREATE}
                  value={formData.type}
                  onChange={(e) => handleChange('type', e.target.value)}
                  selectId="contact-type"
                  data-testid="contact-type-select"
                />

                {/* Primary person */}
                <fieldset className="border border-[#e5e7eb] rounded-md p-4 space-y-3">
                  <legend className="text-sm font-medium text-[#1a1a2e] px-2">Primary person</legend>
                  <div className="grid grid-cols-2 gap-3">
                    <Input
                      label="First Name"
                      value={formData.firstName}
                      onChange={(e) => handleChange('firstName', e.target.value)}
                      inputId="primary-first-name"
                      data-testid="primary-first-name"
                    />
                    <Input
                      label="Last Name"
                      value={formData.lastName}
                      onChange={(e) => handleChange('lastName', e.target.value)}
                      inputId="primary-last-name"
                      data-testid="primary-last-name"
                    />
                  </div>
                  <Input
                    label="Email"
                    type="email"
                    placeholder="email@example.com"
                    value={formData.primaryEmail}
                    onChange={(e) => handleChange('primaryEmail', e.target.value)}
                    inputId="primary-email"
                    data-testid="primary-email"
                  />
                </fieldset>

                {/* Additional people */}
                <fieldset className="border border-[#e5e7eb] rounded-md p-4">
                  <legend className="text-sm font-medium text-[#1a1a2e] px-2">Additional people</legend>
                  <ContactPersonsList
                    persons={formData.additionalPersons}
                    onChange={(persons) => handleChange('additionalPersons', persons)}
                  />
                </fieldset>

                {/* Email (legacy) */}
                <Input
                  label="Email"
                  type="email"
                  placeholder="email@example.com"
                  value={formData.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  error={errors.email}
                  inputId="contact-email"
                  data-testid="contact-email-input"
                />

                {/* Phone */}
                <fieldset className="border border-[#e5e7eb] rounded-md p-4 space-y-3">
                  <legend className="text-sm font-medium text-[#1a1a2e] px-2">Phone</legend>
                  <div className="grid grid-cols-3 gap-3">
                    <Input
                      label="Country"
                      value={formData.phoneCountry}
                      onChange={(e) => handleChange('phoneCountry', e.target.value)}
                      inputId="phone-country"
                      data-testid="phone-country"
                      placeholder="+64"
                    />
                    <Input
                      label="Area"
                      value={formData.phoneArea}
                      onChange={(e) => handleChange('phoneArea', e.target.value)}
                      inputId="phone-area"
                      data-testid="phone-area"
                      placeholder="9"
                    />
                    <Input
                      label="Number"
                      value={formData.phoneNumber}
                      onChange={(e) => handleChange('phoneNumber', e.target.value)}
                      inputId="phone-number"
                      data-testid="phone-number"
                      placeholder="555 0100"
                    />
                  </div>
                </fieldset>

                {/* Legacy phone */}
                <Input
                  label="Phone"
                  type="tel"
                  placeholder="555-0100"
                  value={formData.phone}
                  onChange={(e) => handleChange('phone', e.target.value)}
                  inputId="contact-phone"
                  data-testid="contact-phone-input"
                />

                {/* Tax Number */}
                <Input
                  label="Tax Number"
                  placeholder="NZ-12-345-678"
                  value={formData.taxNumber}
                  onChange={(e) => handleChange('taxNumber', e.target.value)}
                  inputId="contact-tax"
                  data-testid="contact-tax-input"
                />

                {/* Notes */}
                <div className="space-y-1">
                  <label htmlFor="contact-notes" className="block text-sm font-medium text-[#1a1a2e]">
                    Notes
                  </label>
                  <textarea
                    id="contact-notes"
                    className="w-full rounded-md border border-[#e5e7eb] px-3 py-2 text-sm focus:border-[#0078c8] focus:outline-none focus:ring-1 focus:ring-[#0078c8]"
                    rows={4}
                    maxLength={4000}
                    value={formData.notes}
                    onChange={(e) => handleChange('notes', e.target.value)}
                    data-testid="contact-notes"
                    placeholder="Add notes about this contact..."
                  />
                  <p className="text-xs text-[#6b7280] text-right" data-testid="notes-char-count">
                    {formData.notes.length} / 4000
                  </p>
                </div>
              </section>

              {/* ── Addresses ── */}
              <section
                id="section-addresses"
                data-testid="section-addresses"
                ref={(el) => { sectionRefs.current['addresses'] = el; }}
                className="space-y-6"
              >
                <h2 className="text-lg font-semibold text-[#1a1a2e] border-b border-[#e5e7eb] pb-2">
                  Addresses
                </h2>

                <fieldset className="border border-[#e5e7eb] rounded-md p-4 space-y-3">
                  <legend className="text-sm font-medium text-[#1a1a2e] px-2">Billing address</legend>
                  {!formData.billingAddressManual ? (
                    <div>
                      <Input
                        label="Search address"
                        placeholder="Start typing an address..."
                        value={formData.billingAddress}
                        onChange={(e) => handleChange('billingAddress', e.target.value)}
                        inputId="billing-address-search"
                        data-testid="billing-address-search"
                      />
                      <button
                        type="button"
                        className="mt-2 text-sm text-[#0078c8] hover:underline"
                        onClick={() => handleChange('billingAddressManual', true)}
                        data-testid="enter-address-manually"
                      >
                        Enter address manually
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3" data-testid="manual-billing-address">
                      <Input
                        label="Address"
                        value={formData.billingAddress}
                        onChange={(e) => handleChange('billingAddress', e.target.value)}
                        inputId="billing-address-manual"
                        data-testid="billing-address-manual"
                      />
                      <button
                        type="button"
                        className="text-sm text-[#0078c8] hover:underline"
                        onClick={() => handleChange('billingAddressManual', false)}
                      >
                        Search address
                      </button>
                    </div>
                  )}
                </fieldset>

                <fieldset className="border border-[#e5e7eb] rounded-md p-4">
                  <legend className="text-sm font-medium text-[#1a1a2e] px-2">Delivery address</legend>
                  <DeliveryAddressForm
                    addresses={formData.deliveryAddresses}
                    onChange={(addrs) => handleChange('deliveryAddresses', addrs)}
                  />
                </fieldset>
              </section>

              {/* ── Financial Details ── */}
              <section
                id="section-financial"
                data-testid="section-financial"
                ref={(el) => { sectionRefs.current['financial'] = el; }}
                className="space-y-4"
              >
                <h2 className="text-lg font-semibold text-[#1a1a2e] border-b border-[#e5e7eb] pb-2">
                  Financial details
                </h2>

                <Input
                  label="Bank Account Name"
                  placeholder="Business Account"
                  value={formData.bankAccountName}
                  onChange={(e) => handleChange('bankAccountName', e.target.value)}
                  inputId="contact-bank-name"
                  data-testid="contact-bank-name-input"
                />
                <Input
                  label="Bank Account Number"
                  placeholder="12-3456-7890123-00"
                  value={formData.bankAccountNumber}
                  onChange={(e) => handleChange('bankAccountNumber', e.target.value)}
                  inputId="contact-bank-number"
                  data-testid="contact-bank-number-input"
                />
                <div className="grid grid-cols-3 gap-3">
                  <Input
                    label="Particulars"
                    value={formData.financialParticulars}
                    onChange={(e) => handleChange('financialParticulars', e.target.value)}
                    inputId="financial-particulars"
                    data-testid="financial-particulars"
                  />
                  <Input
                    label="Code"
                    value={formData.financialCode}
                    onChange={(e) => handleChange('financialCode', e.target.value)}
                    inputId="financial-code"
                    data-testid="financial-code"
                  />
                  <Input
                    label="Reference"
                    value={formData.financialReference}
                    onChange={(e) => handleChange('financialReference', e.target.value)}
                    inputId="financial-reference"
                    data-testid="financial-reference"
                  />
                </div>
                <Input
                  label="Bank BSB"
                  placeholder="012-345"
                  value={formData.bankBSB}
                  onChange={(e) => handleChange('bankBSB', e.target.value)}
                  inputId="contact-bank-bsb"
                  data-testid="contact-bank-bsb-input"
                />
                <Input
                  label="GST Number"
                  placeholder="123-456-789"
                  value={formData.gstNumber}
                  onChange={(e) => handleChange('gstNumber', e.target.value)}
                  inputId="gst-number"
                  data-testid="gst-number"
                />
                <Select
                  label="Currency"
                  options={CURRENCY_OPTIONS_CREATE}
                  value={formData.currency}
                  onChange={(e) => handleChange('currency', e.target.value)}
                  selectId="currency"
                  data-testid="currency-select"
                />
              </section>

              {/* ── Sales Defaults ── */}
              <section
                id="section-sales-defaults"
                data-testid="section-sales-defaults"
                ref={(el) => { sectionRefs.current['sales-defaults'] = el; }}
                className="space-y-4"
              >
                <h2 className="text-lg font-semibold text-[#1a1a2e] border-b border-[#e5e7eb] pb-2">
                  Sales defaults
                </h2>

                <Combobox
                  label="Sales Account"
                  placeholder="Search accounts..."
                  options={resolvedAccountOptions}
                  value={formData.salesAccount}
                  onChange={(val) => handleChange('salesAccount', val)}
                  onCreateNew={() => navigate({ to: '/accounting/chart-of-accounts/new' })}
                  className="w-full"
                />
                <Select
                  label="Invoice Due Date"
                  options={DUE_DATE_OPTIONS_CREATE}
                  value={formData.invoiceDueDate}
                  onChange={(e) => handleChange('invoiceDueDate', e.target.value)}
                  selectId="invoice-due-date"
                  data-testid="invoice-due-date"
                />
                <Select
                  label="Amounts are"
                  options={AMOUNTS_ARE_OPTIONS_CREATE}
                  value={formData.salesAmountsAre}
                  onChange={(e) => handleChange('salesAmountsAre', e.target.value)}
                  selectId="sales-amounts-are"
                  data-testid="sales-amounts-are"
                />
                <Combobox
                  label="Sales GST"
                  placeholder="Search tax rates..."
                  options={resolvedTaxRateOptions}
                  value={formData.salesGst}
                  onChange={(val) => handleChange('salesGst', val)}
                  className="w-full"
                />
                <Input
                  label="Discount"
                  placeholder="0%"
                  value={formData.salesDiscount}
                  onChange={(e) => handleChange('salesDiscount', e.target.value)}
                  inputId="sales-discount"
                  data-testid="sales-discount"
                />
                <Input
                  label="Credit Limit"
                  placeholder="0.00"
                  value={formData.creditLimit}
                  onChange={(e) => handleChange('creditLimit', e.target.value)}
                  inputId="credit-limit"
                  data-testid="credit-limit"
                />
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="block-new-invoices"
                    checked={formData.blockNewInvoices}
                    onChange={(e) => handleChange('blockNewInvoices', e.target.checked)}
                    className="h-4 w-4 rounded border-[#d1d5db] text-[#0078c8]"
                    data-testid="block-new-invoices"
                  />
                  <label htmlFor="block-new-invoices" className="text-sm text-[#1a1a2e]">
                    Block new invoices when credit limit is reached
                  </label>
                </div>
                <Select
                  label="Branding Theme"
                  options={BRANDING_THEME_OPTIONS}
                  value={formData.brandingTheme}
                  onChange={(e) => handleChange('brandingTheme', e.target.value)}
                  selectId="branding-theme"
                  data-testid="branding-theme"
                />
                <Combobox
                  label="Region"
                  placeholder="Search regions..."
                  options={REGION_OPTIONS}
                  value={formData.salesRegion}
                  onChange={(val) => handleChange('salesRegion', val)}
                  className="w-full"
                />
                <Input
                  label="Xero Network Key"
                  value={formData.xeroNetworkKey}
                  onChange={(e) => handleChange('xeroNetworkKey', e.target.value)}
                  inputId="xero-network-key"
                  data-testid="xero-network-key"
                />
                <Combobox
                  label="Default Account Code"
                  placeholder="Search accounts..."
                  options={resolvedAccountOptions}
                  value={formData.defaultAccountCode}
                  onChange={(val) => handleChange('defaultAccountCode', val)}
                  onCreateNew={() => navigate({ to: '/accounting/chart-of-accounts/new' })}
                  className="w-full"
                />
                <Combobox
                  label="Default Tax Rate"
                  placeholder="Search tax rates..."
                  options={resolvedTaxRateOptions}
                  value={formData.defaultTaxRate}
                  onChange={(val) => handleChange('defaultTaxRate', val)}
                  className="w-full"
                />
              </section>

              {/* ── Purchase Defaults ── */}
              <section
                id="section-purchase-defaults"
                data-testid="section-purchase-defaults"
                ref={(el) => { sectionRefs.current['purchase-defaults'] = el; }}
                className="space-y-4"
              >
                <h2 className="text-lg font-semibold text-[#1a1a2e] border-b border-[#e5e7eb] pb-2">
                  Purchase defaults
                </h2>

                <Combobox
                  label="Purchase Account"
                  placeholder="Search accounts..."
                  options={resolvedAccountOptions}
                  value={formData.purchaseAccount}
                  onChange={(val) => handleChange('purchaseAccount', val)}
                  onCreateNew={() => navigate({ to: '/accounting/chart-of-accounts/new' })}
                  className="w-full"
                />
                <Select
                  label="Bill Due Date"
                  options={DUE_DATE_OPTIONS_CREATE}
                  value={formData.billDueDate}
                  onChange={(e) => handleChange('billDueDate', e.target.value)}
                  selectId="bill-due-date"
                  data-testid="bill-due-date"
                />
                <Select
                  label="Amounts are"
                  options={AMOUNTS_ARE_OPTIONS_CREATE}
                  value={formData.purchaseAmountsAre}
                  onChange={(e) => handleChange('purchaseAmountsAre', e.target.value)}
                  selectId="purchase-amounts-are"
                  data-testid="purchase-amounts-are"
                />
                <Combobox
                  label="Purchase GST"
                  placeholder="Search tax rates..."
                  options={resolvedTaxRateOptions}
                  value={formData.purchaseGst}
                  onChange={(val) => handleChange('purchaseGst', val)}
                  className="w-full"
                />
                <Combobox
                  label="Region"
                  placeholder="Search regions..."
                  options={REGION_OPTIONS}
                  value={formData.purchaseRegion}
                  onChange={(val) => handleChange('purchaseRegion', val)}
                  className="w-full"
                />
              </section>
            </div>

            {/* ── Sticky Footer ── */}
            <div
              className="sticky bottom-0 bg-white border-t border-[#e5e7eb] px-0 py-4 flex items-center justify-end gap-3"
              data-testid="sticky-footer"
            >
              <Button
                variant="ghost"
                type="button"
                onClick={() => navigate({ to: '/contacts/$contactId', params: { contactId } })}
                disabled={isSubmitting}
                data-testid="cancel-btn"
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                type="submit"
                loading={isSubmitting}
                disabled={isSubmitting}
                data-testid="save-close-btn"
              >
                Save &amp; close
              </Button>
            </div>
          </form>
        </div>
      </div>
    </PageContainer>
  );
}
