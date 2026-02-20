import { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { Card, CardContent, CardHeader } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { Tabs, TabList, Tab, TabPanel } from '../../../components/ui/Tabs';
import { NotImplemented } from '../../../components/patterns/NotImplemented';
import { formatCurrency } from '../../../../../shared/calc/currency';
import { ContactActivity } from './ContactActivity';
import { ContactFinancialSummary } from './ContactFinancialSummary';
import { ContactNotes } from './ContactNotes';
import { ContactTimeline } from './ContactTimeline';
import { ContactStatement } from './ContactStatement';
import { useContactActivity, useContactFinancialSummary } from '../hooks/useContacts';
import { useContactNotes, useCreateNote, useDeleteNote } from '../hooks/useContactNotes';
import { useContactTimeline } from '../hooks/useContactTimeline';
import { useContactStatement } from '../hooks/useContactStatement';
import type { Contact } from '../types';
import { Mail, Phone, FileText, Pencil, Plus, ChevronDown, BarChart3, Table as TableIcon } from 'lucide-react';

interface ContactDetailProps {
  contact: Contact;
  onEdit: () => void;
  onNewInvoice?: () => void;
  onNewBill?: () => void;
  onArchive?: () => void;
}

function getTypeLabel(type: Contact['type']): string {
  switch (type) {
    case 'customer':
      return 'Customer';
    case 'supplier':
      return 'Supplier';
    case 'customer_and_supplier':
      return 'Customer & Supplier';
    default:
      return type;
  }
}

function getTypeBadgeVariant(type: Contact['type']): 'info' | 'warning' | 'success' {
  switch (type) {
    case 'customer':
      return 'info';
    case 'supplier':
      return 'warning';
    case 'customer_and_supplier':
      return 'success';
    default:
      return 'info';
  }
}

/** Simple bar chart for cash in/out over 12 months */
function CashFlowChart({ contact }: { contact: Contact }) {
  const [viewMode, setViewMode] = useState<'graph' | 'table'>('graph');

  // Mock 12 months of cash data based on outstanding balance
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const cashOut = months.map((_, i) => Math.round(contact.outstandingBalance * (0.5 + Math.sin(i) * 0.3)));
  const cashIn = months.map((_, i) => Math.round(contact.outstandingBalance * (0.4 + Math.cos(i) * 0.25)));
  const maxVal = Math.max(...cashOut, ...cashIn, 1);

  return (
    <Card data-testid="cash-flow-card">
      <CardHeader>
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-[#1a1a2e]">Cash out over 12 months</h3>
          <div className="flex items-center gap-1 rounded-md border border-[#e5e7eb] overflow-hidden">
            <button
              className={`px-3 py-1 text-xs font-medium ${viewMode === 'graph' ? 'bg-[#0078c8] text-white' : 'text-[#6b7280] hover:bg-gray-50'}`}
              onClick={() => setViewMode('graph')}
              data-testid="chart-graph-toggle"
            >
              <BarChart3 className="h-3 w-3" />
            </button>
            <button
              className={`px-3 py-1 text-xs font-medium ${viewMode === 'table' ? 'bg-[#0078c8] text-white' : 'text-[#6b7280] hover:bg-gray-50'}`}
              onClick={() => setViewMode('table')}
              data-testid="chart-table-toggle"
            >
              <TableIcon className="h-3 w-3" />
            </button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {viewMode === 'graph' ? (
          <div className="flex items-end gap-1 h-32" data-testid="cash-flow-graph">
            {months.map((month, i) => (
              <div key={month} className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full flex gap-0.5 items-end" style={{ height: '100px' }}>
                  <div
                    className="flex-1 bg-[#0078c8] rounded-t-sm"
                    style={{ height: `${(cashOut[i] / maxVal) * 100}%` }}
                    title={`Out: ${formatCurrency(cashOut[i])}`}
                  />
                  <div
                    className="flex-1 bg-[#00b894] rounded-t-sm"
                    style={{ height: `${(cashIn[i] / maxVal) * 100}%` }}
                    title={`In: ${formatCurrency(cashIn[i])}`}
                  />
                </div>
                <span className="text-[10px] text-[#6b7280]">{month}</span>
              </div>
            ))}
          </div>
        ) : (
          <table className="w-full text-xs" data-testid="cash-flow-table">
            <thead>
              <tr className="text-[#6b7280]">
                <th className="text-left py-1">Month</th>
                <th className="text-right py-1">Cash Out</th>
                <th className="text-right py-1">Cash In</th>
              </tr>
            </thead>
            <tbody>
              {months.map((month, i) => (
                <tr key={month} className="border-t border-[#f3f4f6]">
                  <td className="py-1">{month}</td>
                  <td className="text-right">{formatCurrency(cashOut[i])}</td>
                  <td className="text-right">{formatCurrency(cashIn[i])}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <div className="flex items-center gap-4 mt-3 text-xs text-[#6b7280]">
          <span className="flex items-center gap-1">
            <span className="inline-block w-3 h-3 rounded-sm bg-[#0078c8]" /> Cash out
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block w-3 h-3 rounded-sm bg-[#00b894]" /> Cash in
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

/** History & Notes section */
function HistoryAndNotes({ contactId }: { contactId: string }) {
  const [showHistory, setShowHistory] = useState(true);
  const notesResult = useContactNotes(contactId);
  const createNote = useCreateNote();
  const deleteNote = useDeleteNote();
  const [newNote, setNewNote] = useState('');

  return (
    <div data-testid="history-notes-section">
      <div className="flex items-center justify-between mb-4">
        <button
          className="flex items-center gap-2 text-sm font-medium text-[#1a1a2e]"
          onClick={() => setShowHistory(!showHistory)}
          data-testid="toggle-history"
        >
          <ChevronDown className={`h-4 w-4 transition-transform ${showHistory ? '' : '-rotate-90'}`} />
          History and notes
        </button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            if (newNote.trim()) {
              createNote.mutate({ contactId, content: newNote.trim() });
              setNewNote('');
            }
          }}
          data-testid="add-note-btn"
        >
          Add note
        </Button>
      </div>
      {showHistory && (
        <div className="space-y-3">
          <div className="flex gap-2">
            <textarea
              className="flex-1 rounded-md border border-[#e5e7eb] px-3 py-2 text-sm"
              rows={2}
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              placeholder="Add a note..."
              data-testid="history-note-input"
            />
          </div>
          {(notesResult.data ?? []).length > 0 && (
            <div className="space-y-2" data-testid="history-notes-list">
              {(notesResult.data ?? []).map((note) => (
                <div key={note.id} className="rounded border border-[#e5e7eb] p-3 text-sm">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-[#6b7280]">{note.createdAt}</span>
                    <button
                      className="text-xs text-[#ef4444] hover:underline"
                      onClick={() => deleteNote.mutate({ contactId, noteId: note.id })}
                    >
                      Delete
                    </button>
                  </div>
                  <p>{note.content}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function ContactDetail({ contact, onEdit, onNewInvoice, onNewBill, onArchive }: ContactDetailProps) {
  const navigate = useNavigate();
  const activityResult = useContactActivity(contact.id);
  const financialResult = useContactFinancialSummary(contact.id);
  const notesResult = useContactNotes(contact.id);
  const createNote = useCreateNote();
  const deleteNote = useDeleteNote();
  const timelineResult = useContactTimeline(contact.id);
  const [showActionsMenu, setShowActionsMenu] = useState(false);

  // Statement date range: default last 12 months
  const now = new Date();
  const defaultEnd = now.toISOString().slice(0, 10);
  const defaultStart = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate())
    .toISOString()
    .slice(0, 10);
  const [statementDateRange, setStatementDateRange] = useState({
    start: defaultStart,
    end: defaultEnd,
  });
  const statementResult = useContactStatement(contact.id, statementDateRange);

  return (
    <div className="space-y-6">
      {/* Toolbar: Edit, New, Actions menu */}
      <div className="flex items-center gap-2" data-testid="contact-toolbar">
        <Button variant="outline" size="sm" onClick={onEdit} data-testid="edit-contact-btn">
          <Pencil className="h-4 w-4 mr-1" />
          Edit
        </Button>
        <Button variant="primary" size="sm" onClick={onNewInvoice} data-testid="new-transaction-btn">
          <Plus className="h-4 w-4 mr-1" />
          New
        </Button>
        <div className="relative">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowActionsMenu(!showActionsMenu)}
            data-testid="contact-actions-dropdown"
          >
            Actions
            <ChevronDown className="h-4 w-4 ml-1" />
          </Button>
          {showActionsMenu && (
            <div
              className="absolute left-0 top-9 z-10 w-48 rounded-md border border-[#e5e7eb] bg-white py-1 shadow-lg"
              data-testid="contact-actions-menu"
            >
              <button
                className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50"
                onClick={(e) => { e.stopPropagation(); setShowActionsMenu(false); navigate({ to: '/sales/invoices/new' }); }}
              >
                Create invoice
              </button>
              <button
                className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50"
                onClick={(e) => { e.stopPropagation(); setShowActionsMenu(false); navigate({ to: '/purchases/bills/new' }); }}
              >
                Create bill
              </button>
              <button
                className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50"
                onClick={(e) => { e.stopPropagation(); setShowActionsMenu(false); navigate({ to: '/sales/quotes/new' }); }}
              >
                Create quote
              </button>
              <hr className="my-1 border-[#e5e7eb]" />
              <NotImplemented label="Email statement — not yet implemented">
                <button
                  className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50"
                  onClick={() => setShowActionsMenu(false)}
                >
                  Email statement
                </button>
              </NotImplemented>
              <NotImplemented label="Copy to another org — not yet implemented">
                <button
                  className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50"
                  onClick={() => setShowActionsMenu(false)}
                >
                  Copy to another org
                </button>
              </NotImplemented>
              <hr className="my-1 border-[#e5e7eb]" />
              <button
                className="w-full px-4 py-2 text-left text-sm text-[#ef4444] hover:bg-gray-50"
                onClick={() => { setShowActionsMenu(false); onArchive?.(); }}
              >
                Archive
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Contact Info Card */}
      <Card data-testid="contact-info-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-semibold text-[#1a1a2e]">{contact.name}</h2>
              <Badge variant={getTypeBadgeVariant(contact.type)}>
                {getTypeLabel(contact.type)}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left column - Contact info */}
            <div className="space-y-3">
              {contact.email && (
                <div className="flex items-center gap-2 text-sm" data-testid="contact-email">
                  <Mail className="h-4 w-4 text-[#6b7280]" />
                  <span>{contact.email}</span>
                </div>
              )}
              {contact.phone && (
                <div className="flex items-center gap-2 text-sm" data-testid="contact-phone">
                  <Phone className="h-4 w-4 text-[#6b7280]" />
                  <span>{contact.phone}</span>
                </div>
              )}
              {contact.taxNumber && (
                <div className="flex items-center gap-2 text-sm" data-testid="contact-tax-number">
                  <FileText className="h-4 w-4 text-[#6b7280]" />
                  <span>Tax: {contact.taxNumber}</span>
                </div>
              )}
            </div>

            {/* Right column - Financial info */}
            <div className="space-y-3">
              <div className="flex justify-between items-center text-sm">
                <span className="text-[#6b7280]">Outstanding Balance</span>
                <span
                  className={
                    contact.outstandingBalance > 0
                      ? 'font-semibold text-[#1a1a2e]'
                      : 'text-[#6b7280]'
                  }
                  data-testid="contact-outstanding"
                >
                  {formatCurrency(contact.outstandingBalance)}
                </span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-[#6b7280]">Overdue Balance</span>
                <span
                  className={
                    contact.overdueBalance > 0
                      ? 'font-semibold text-[#ef4444]'
                      : 'text-[#6b7280]'
                  }
                  data-testid="contact-overdue"
                >
                  {formatCurrency(contact.overdueBalance)}
                </span>
              </div>
              {contact.bankAccountName && (
                <div className="flex justify-between items-center text-sm">
                  <span className="text-[#6b7280]">Bank Account</span>
                  <span data-testid="contact-bank-account">{contact.bankAccountName}</span>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cash Flow Chart */}
      <CashFlowChart contact={contact} />

      {/* Bank Details Card */}
      {(contact.bankAccountName || contact.bankAccountNumber || contact.bankBSB) && (
        <Card data-testid="bank-details-card">
          <CardHeader>
            <h3 className="text-sm font-semibold text-[#1a1a2e]">Bank Details</h3>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-[#6b7280] font-medium">Account Name</p>
                <p className="text-[#1a1a2e]" data-testid="bank-detail-name">
                  {contact.bankAccountName ?? '-'}
                </p>
              </div>
              <div>
                <p className="text-[#6b7280] font-medium">Account Number</p>
                <p className="text-[#1a1a2e]" data-testid="bank-detail-number">
                  {contact.bankAccountNumber ?? '-'}
                </p>
              </div>
              <div>
                <p className="text-[#6b7280] font-medium">BSB</p>
                <p className="text-[#1a1a2e]" data-testid="bank-detail-bsb">
                  {contact.bankBSB ?? '-'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabs: Details, Activity, Financial, Notes, Timeline, Statement */}
      <Tabs defaultTab="details" data-testid="contact-tabs">
        <TabList>
          <Tab tabId="details">Details</Tab>
          <Tab tabId="activity">Activity</Tab>
          <Tab tabId="financial">Financial</Tab>
          <Tab tabId="notes">Notes</Tab>
          <Tab tabId="timeline">Timeline</Tab>
          <Tab tabId="statement">Statement</Tab>
        </TabList>

        <TabPanel tabId="details">
          <Card>
            <CardContent>
              <div className="space-y-4 py-2" data-testid="details-tab-content">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-[#6b7280] font-medium">Contact Type</p>
                    <p className="text-[#1a1a2e]">{getTypeLabel(contact.type)}</p>
                  </div>
                  <div>
                    <p className="text-[#6b7280] font-medium">Email</p>
                    <p className="text-[#1a1a2e]">{contact.email ?? '-'}</p>
                  </div>
                  <div>
                    <p className="text-[#6b7280] font-medium">Phone</p>
                    <p className="text-[#1a1a2e]">{contact.phone ?? '-'}</p>
                  </div>
                  <div>
                    <p className="text-[#6b7280] font-medium">Tax Number</p>
                    <p className="text-[#1a1a2e]">{contact.taxNumber ?? '-'}</p>
                  </div>
                  <div>
                    <p className="text-[#6b7280] font-medium">Bank Account Name</p>
                    <p className="text-[#1a1a2e]">{contact.bankAccountName ?? '-'}</p>
                  </div>
                  <div>
                    <p className="text-[#6b7280] font-medium">Bank Account Number</p>
                    <p className="text-[#1a1a2e]">{contact.bankAccountNumber ?? '-'}</p>
                  </div>
                  <div>
                    <p className="text-[#6b7280] font-medium">Bank BSB</p>
                    <p className="text-[#1a1a2e]">{contact.bankBSB ?? '-'}</p>
                  </div>
                  <div>
                    <p className="text-[#6b7280] font-medium">Default Account Code</p>
                    <p className="text-[#1a1a2e]">{contact.defaultAccountCode ?? '-'}</p>
                  </div>
                  <div>
                    <p className="text-[#6b7280] font-medium">Default Tax Rate</p>
                    <p className="text-[#1a1a2e]">{contact.defaultTaxRate ?? '-'}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabPanel>

        <TabPanel tabId="activity">
          <ContactActivity
            activities={activityResult.data}
            isLoading={activityResult.isLoading}
          />
        </TabPanel>

        <TabPanel tabId="financial">
          <ContactFinancialSummary
            summary={financialResult.data}
            isLoading={financialResult.isLoading}
          />
        </TabPanel>

        <TabPanel tabId="notes">
          <ContactNotes
            notes={notesResult.data ?? []}
            isLoading={notesResult.isLoading}
            onCreateNote={(content) =>
              createNote.mutate({ contactId: contact.id, content })
            }
            onDeleteNote={(noteId) =>
              deleteNote.mutate({ contactId: contact.id, noteId })
            }
            isCreating={createNote.isPending}
          />
        </TabPanel>

        <TabPanel tabId="timeline">
          <ContactTimeline
            events={timelineResult.data}
            isLoading={timelineResult.isLoading}
          />
        </TabPanel>

        <TabPanel tabId="statement">
          <ContactStatement
            contact={contact}
            transactions={statementResult.data}
            dateRange={statementDateRange}
            onDateRangeChange={setStatementDateRange}
            onPrint={() => window.print()}
            onEmail={() => {
              alert(`Statement emailed to ${contact.email ?? 'the contact'}`);
            }}
          />
        </TabPanel>
      </Tabs>

      {/* History and Notes section */}
      <HistoryAndNotes contactId={contact.id} />
    </div>
  );
}
