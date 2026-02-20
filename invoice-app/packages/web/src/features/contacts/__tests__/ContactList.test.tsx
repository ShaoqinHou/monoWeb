// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ContactList } from '../components/ContactList';
import type { Contact, ContactFilter } from '../types';

const MOCK_CONTACTS: Contact[] = [
  {
    id: 'c1a2b3c4-d5e6-4f7a-8b9c-0d1e2f3a4b5c',
    name: 'Acme Corporation',
    type: 'customer',
    email: 'info@acme.com',
    phone: '555-0100',
    taxNumber: 'NZ-12-345-678',
    bankAccountName: 'Acme Corp Business',
    bankAccountNumber: '12-3456-7890123-00',
    defaultAccountCode: '200',
    outstandingBalance: 500,
    overdueBalance: 0,
    isArchived: false,
    createdAt: '2025-01-15T10:00:00.000Z',
    updatedAt: '2025-06-01T14:30:00.000Z',
  },
  {
    id: 'd2b3c4d5-e6f7-4a8b-9c0d-1e2f3a4b5c6d',
    name: 'Bay Supplies Ltd',
    type: 'supplier',
    email: 'orders@baysupply.co.nz',
    phone: '555-0200',
    taxNumber: 'NZ-23-456-789',
    outstandingBalance: 0,
    overdueBalance: 0,
    isArchived: false,
    createdAt: '2025-02-20T08:00:00.000Z',
    updatedAt: '2025-05-15T11:00:00.000Z',
  },
  {
    id: 'e3c4d5e6-f7a8-4b9c-0d1e-2f3a4b5c6d7e',
    name: 'City Services Group',
    type: 'customer_and_supplier',
    email: 'accounts@cityservices.com',
    phone: '555-0300',
    taxNumber: 'NZ-34-567-890',
    bankAccountName: 'City Services',
    bankAccountNumber: '06-0987-6543210-00',
    outstandingBalance: 750,
    overdueBalance: 250,
    isArchived: false,
    createdAt: '2025-03-10T09:30:00.000Z',
    updatedAt: '2025-07-01T16:45:00.000Z',
  },
  {
    id: 'f4d5e6f7-a8b9-4c0d-1e2f-3a4b5c6d7e8f',
    name: 'Demo Client Co',
    type: 'customer',
    email: 'demo@testclient.com',
    phone: '555-0400',
    outstandingBalance: 200,
    overdueBalance: 200,
    isArchived: false,
    createdAt: '2025-04-05T12:00:00.000Z',
    updatedAt: '2025-04-05T12:00:00.000Z',
  },
  {
    id: 'a5e6f7a8-b9c0-4d1e-2f3a-4b5c6d7e8f9a',
    name: 'Eastern Traders',
    type: 'supplier',
    email: 'info@easterntraders.co.nz',
    phone: '555-0500',
    taxNumber: 'NZ-56-789-012',
    bankAccountName: 'Eastern Traders Ltd',
    bankAccountNumber: '03-1234-5678901-00',
    defaultAccountCode: '400',
    outstandingBalance: 1200,
    overdueBalance: 0,
    isArchived: false,
    createdAt: '2025-01-20T07:00:00.000Z',
    updatedAt: '2025-08-10T10:15:00.000Z',
  },
  {
    id: 'b6f7a8b9-c0d1-4e2f-3a4b-5c6d7e8f9a0b',
    name: 'Fern & Co Consulting',
    type: 'customer',
    email: 'hello@fernco.nz',
    phone: '555-0600',
    taxNumber: 'NZ-67-890-123',
    outstandingBalance: 0,
    overdueBalance: 0,
    isArchived: false,
    createdAt: '2025-05-01T15:00:00.000Z',
    updatedAt: '2025-05-01T15:00:00.000Z',
  },
];

describe('ContactList', () => {
  const defaultProps = {
    contacts: MOCK_CONTACTS,
    isLoading: false,
    onContactClick: vi.fn(),
    onSearch: vi.fn(),
    onFilterChange: vi.fn(),
    activeFilter: 'all' as ContactFilter,
    searchTerm: '',
  };

  it('renders the contacts table', () => {
    render(<ContactList {...defaultProps} />);
    expect(screen.getByText('Acme Corporation')).toBeInTheDocument();
    expect(screen.getByText('Bay Supplies Ltd')).toBeInTheDocument();
  });

  it('renders Xero-style table headers (Contact, You owe, They owe)', () => {
    render(<ContactList {...defaultProps} />);
    expect(screen.getByText('Contact')).toBeInTheDocument();
    expect(screen.getByText('You owe')).toBeInTheDocument();
    expect(screen.getByText('They owe')).toBeInTheDocument();
  });

  it('renders search input', () => {
    render(<ContactList {...defaultProps} />);
    expect(screen.getByPlaceholderText('Search contacts...')).toBeInTheDocument();
  });

  it('does not render redundant Search button (removed for Xero fidelity)', () => {
    render(<ContactList {...defaultProps} />);
    expect(screen.queryByTestId('search-btn')).not.toBeInTheDocument();
  });

  it('calls onSearch when user types in search input', async () => {
    const onSearch = vi.fn();
    const user = userEvent.setup();
    render(<ContactList {...defaultProps} onSearch={onSearch} />);

    const input = screen.getByPlaceholderText('Search contacts...');
    await user.type(input, 'test');

    expect(onSearch).toHaveBeenCalled();
  });

  it('calls onContactClick when a row is clicked', async () => {
    const onContactClick = vi.fn();
    const user = userEvent.setup();
    render(<ContactList {...defaultProps} onContactClick={onContactClick} />);

    await user.click(screen.getByText('Acme Corporation'));
    expect(onContactClick).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Acme Corporation' }),
    );
  });

  it('shows loading state', () => {
    render(<ContactList {...defaultProps} isLoading={true} contacts={[]} />);
    expect(screen.getByTestId('contacts-loading')).toBeInTheDocument();
    expect(screen.getByText('Loading contacts...')).toBeInTheDocument();
  });

  it('shows empty state when no contacts match', () => {
    render(<ContactList {...defaultProps} contacts={[]} />);
    expect(screen.getByTestId('contacts-empty')).toBeInTheDocument();
    expect(screen.getByText('No contacts yet')).toBeInTheDocument();
  });

  it('renders all 6 mock contacts', () => {
    render(<ContactList {...defaultProps} />);
    const rows = screen.getAllByTestId(/^contact-row-/);
    expect(rows).toHaveLength(6);
  });

  it('displays contact names with initials', () => {
    render(<ContactList {...defaultProps} />);
    const acmeInitials = screen.getByTestId('contact-initials-c1a2b3c4-d5e6-4f7a-8b9c-0d1e2f3a4b5c');
    expect(acmeInitials.textContent).toBe('AC');
  });

  it('displays contact emails in the Email Address column', () => {
    render(<ContactList {...defaultProps} />);
    expect(screen.getByText('info@acme.com')).toBeInTheDocument();
    expect(screen.getByText('orders@baysupply.co.nz')).toBeInTheDocument();
  });

  it('displays contact phone numbers in the Phone Number column', () => {
    render(<ContactList {...defaultProps} />);
    expect(screen.getByText('555-0100')).toBeInTheDocument();
    expect(screen.getByText('555-0200')).toBeInTheDocument();
    expect(screen.getByText('555-0300')).toBeInTheDocument();
  });

  it('displays contact email addresses in the Contact column', () => {
    render(<ContactList {...defaultProps} />);
    expect(screen.getByText('info@acme.com')).toBeInTheDocument();
    expect(screen.getByText('orders@baysupply.co.nz')).toBeInTheDocument();
  });

  it('renders select-all checkbox and per-row checkboxes', () => {
    render(<ContactList {...defaultProps} />);
    expect(screen.getByTestId('select-all-checkbox')).toBeInTheDocument();
    expect(screen.getByTestId('contact-checkbox-c1a2b3c4-d5e6-4f7a-8b9c-0d1e2f3a4b5c')).toBeInTheDocument();
  });

  it('renders sort name button', () => {
    render(<ContactList {...defaultProps} />);
    expect(screen.getByTestId('sort-name-btn')).toBeInTheDocument();
  });

  it('renders pagination', () => {
    render(<ContactList {...defaultProps} />);
    expect(screen.getByText('1-6 of 6')).toBeInTheDocument();
  });

  it('renders bulk action buttons (Add to group, Merge, Archive)', () => {
    render(<ContactList {...defaultProps} />);
    expect(screen.getByTestId('bulk-add-to-group')).toBeInTheDocument();
    expect(screen.getByTestId('bulk-merge')).toBeInTheDocument();
    expect(screen.getByTestId('bulk-archive')).toBeInTheDocument();
  });

  it('shows "0 contacts selected" when none selected', () => {
    render(<ContactList {...defaultProps} />);
    expect(screen.getByTestId('selection-status')).toHaveTextContent('0 contacts selected');
  });
});
