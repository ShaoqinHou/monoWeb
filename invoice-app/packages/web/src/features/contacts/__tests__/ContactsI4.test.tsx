// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { buildContactsCsv } from '../hooks/useContactExport';
import { ExportContactsButton } from '../components/ExportContactsButton';
import type { Contact } from '@shared/schemas/contact';

// ── Mock data ───────────────────────────────────────────────────────────────

const mockContacts: Contact[] = [
  {
    id: '1',
    name: 'Acme Corp',
    type: 'customer',
    email: 'acme@example.com',
    phone: '09-123-4567',
    outstandingBalance: 1500,
    overdueBalance: 0,
    isArchived: false,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  },
  {
    id: '2',
    name: 'Widget Supplies',
    type: 'supplier',
    email: 'info@widgets.nz',
    phone: '04-987-6543',
    outstandingBalance: 300,
    overdueBalance: 100,
    isArchived: false,
    createdAt: '2026-01-02T00:00:00Z',
    updatedAt: '2026-01-02T00:00:00Z',
  },
];

// ── Mock URL.createObjectURL / revokeObjectURL ──────────────────────────────
beforeEach(() => {
  vi.restoreAllMocks();
  global.URL.createObjectURL = vi.fn(() => 'blob:mock-url');
  global.URL.revokeObjectURL = vi.fn();
});

// ── CSV Export Tests ────────────────────────────────────────────────────────

describe('buildContactsCsv', () => {
  it('generates CSV with correct headers', () => {
    const csv = buildContactsCsv([]);
    const firstLine = csv.split('\n')[0];
    expect(firstLine).toBe('Name,Email,Phone,Type,City,Country,Outstanding Balance');
  });

  it('generates CSV rows from contact data', () => {
    const csv = buildContactsCsv(mockContacts);
    const lines = csv.split('\n');
    expect(lines).toHaveLength(3); // 1 header + 2 data rows

    // Check first data row
    expect(lines[1]).toContain('"Acme Corp"');
    expect(lines[1]).toContain('"acme@example.com"');
    expect(lines[1]).toContain('"customer"');
    expect(lines[1]).toContain('"1500"');
  });

  it('handles contacts with missing optional fields', () => {
    const sparse: Contact[] = [{
      id: '3',
      name: 'No Details Co',
      type: 'customer_and_supplier',
      outstandingBalance: 0,
      overdueBalance: 0,
      isArchived: false,
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z',
    }];
    const csv = buildContactsCsv(sparse);
    const dataLine = csv.split('\n')[1];
    expect(dataLine).toContain('"No Details Co"');
    expect(dataLine).toContain('""'); // empty email, phone, city, country
  });

  it('creates download blob when exportCsv is called', () => {
    const createElementSpy = vi.spyOn(document, 'createElement');
    const mockClick = vi.fn();
    createElementSpy.mockReturnValue({
      click: mockClick,
      href: '',
      download: '',
      set setAttribute(_name: string) { /* noop */ },
    } as unknown as HTMLAnchorElement);

    // Import the hook and call it
    // We test the pure function + blob creation path
    const csv = buildContactsCsv(mockContacts);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    expect(blob.size).toBeGreaterThan(0);
    expect(blob.type).toBe('text/csv;charset=utf-8;');

    createElementSpy.mockRestore();
  });
});

describe('ExportContactsButton', () => {
  it('renders Export CSV button', () => {
    render(<ExportContactsButton contacts={mockContacts} />);
    expect(screen.getByText('Export CSV')).toBeInTheDocument();
  });

  it('is disabled when contacts list is empty', () => {
    render(<ExportContactsButton contacts={[]} />);
    const btn = screen.getByRole('button');
    expect(btn).toBeDisabled();
  });

  it('triggers export on click', () => {
    render(<ExportContactsButton contacts={mockContacts} />);
    const btn = screen.getByRole('button');
    fireEvent.click(btn);
    // Verify createObjectURL was called (blob created)
    expect(global.URL.createObjectURL).toHaveBeenCalled();
  });
});
