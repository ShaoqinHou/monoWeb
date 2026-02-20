// @vitest-environment jsdom
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';

import { CreateNewDropdown } from '../components/layout/CreateNewDropdown';
import { OrgSwitcher } from '../components/layout/OrgSwitcher';
import { ListSkeleton } from '../components/patterns/ListSkeleton';
import { DetailSkeleton } from '../components/patterns/DetailSkeleton';
import { EmptyState } from '../components/patterns/EmptyState';
import { Pagination } from '../components/patterns/Pagination';
import { SortableHeader } from '../components/patterns/SortableHeader';
import { BulkActionsBar } from '../components/patterns/BulkActionsBar';
import { FileAttachment } from '../components/patterns/FileAttachment';
import { ActivityLog, type AuditEntry } from '../components/patterns/ActivityLog';
import { useDateFormat } from '../lib/useDateFormat';
import { useNumberFormat } from '../lib/useNumberFormat';

// Helper to test hooks
function DateFormatResult({ locale }: { locale?: 'NZ' | 'US' | 'UK' }) {
  const { format } = useDateFormat(locale);
  return <span data-testid="result">{format(new Date(2024, 0, 15))}</span>;
}

function NumberFormatResult({ locale }: { locale?: 'NZ' | 'US' | 'UK' }) {
  const { formatCurrency, formatNumber } = useNumberFormat(locale);
  return (
    <>
      <span data-testid="currency">{formatCurrency(1234.5)}</span>
      <span data-testid="number">{formatNumber(9876.123)}</span>
    </>
  );
}

describe('CrossCuttingPolish', () => {
  // --- CreateNewDropdown ---
  describe('CreateNewDropdown', () => {
    it('renders all create options when opened', async () => {
      const user = userEvent.setup();
      render(<CreateNewDropdown />);

      const button = screen.getByRole('button', { name: /create new/i });
      await user.click(button);

      expect(screen.getByRole('menuitem', { name: 'Invoice' })).toBeInTheDocument();
      expect(screen.getByRole('menuitem', { name: 'Bill' })).toBeInTheDocument();
      expect(screen.getByRole('menuitem', { name: 'Contact' })).toBeInTheDocument();
      expect(screen.getByRole('menuitem', { name: 'Quote' })).toBeInTheDocument();
      expect(screen.getByRole('menuitem', { name: 'Purchase Order' })).toBeInTheDocument();
      expect(screen.getByRole('menuitem', { name: 'Journal' })).toBeInTheDocument();
      expect(screen.getByRole('menuitem', { name: 'Expense' })).toBeInTheDocument();
    });

    it('closes dropdown when an option is clicked', async () => {
      const user = userEvent.setup();
      render(<CreateNewDropdown />);

      await user.click(screen.getByRole('button', { name: /create new/i }));
      expect(screen.getByRole('menu')).toBeInTheDocument();

      await user.click(screen.getByRole('menuitem', { name: 'Invoice' }));
      expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    });
  });

  // --- OrgSwitcher ---
  describe('OrgSwitcher', () => {
    it('shows Demo Company (NZ) as current org', () => {
      render(<OrgSwitcher />);
      expect(screen.getByText('Demo Company (NZ)')).toBeInTheDocument();
    });

    it('shows org list when clicked', async () => {
      const user = userEvent.setup();
      render(<OrgSwitcher />);

      await user.click(screen.getByRole('button', { name: /switch organization/i }));
      expect(screen.getByRole('option', { name: /Demo Company/i })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: /My Business Ltd/i })).toBeInTheDocument();
    });
  });

  // --- ListSkeleton ---
  describe('ListSkeleton', () => {
    it('renders the default 5 skeleton rows', () => {
      render(<ListSkeleton />);
      const rows = screen.getAllByTestId('skeleton-row');
      expect(rows).toHaveLength(5);
    });

    it('renders custom number of rows', () => {
      render(<ListSkeleton rows={3} />);
      const rows = screen.getAllByTestId('skeleton-row');
      expect(rows).toHaveLength(3);
    });
  });

  // --- DetailSkeleton ---
  describe('DetailSkeleton', () => {
    it('renders skeleton field placeholders', () => {
      render(<DetailSkeleton />);
      const fields = screen.getAllByTestId('skeleton-field');
      expect(fields.length).toBeGreaterThanOrEqual(4);
    });
  });

  // --- EmptyState ---
  describe('EmptyState', () => {
    it('renders title and description', () => {
      render(<EmptyState title="No invoices" description="Create your first invoice." />);
      expect(screen.getByText('No invoices')).toBeInTheDocument();
      expect(screen.getByText('Create your first invoice.')).toBeInTheDocument();
    });

    it('renders action button and fires callback', async () => {
      const user = userEvent.setup();
      const onAction = vi.fn();
      render(
        <EmptyState
          title="Empty"
          description="Nothing here"
          actionLabel="Create"
          onAction={onAction}
        />,
      );

      const button = screen.getByRole('button', { name: 'Create' });
      await user.click(button);
      expect(onAction).toHaveBeenCalledOnce();
    });
  });

  // --- Pagination ---
  describe('Pagination', () => {
    it('renders current page info', () => {
      render(<Pagination page={2} pageSize={10} total={45} onChange={vi.fn()} />);
      expect(screen.getByText('11-20 of 45')).toBeInTheDocument();
      expect(screen.getByText('2 / 5')).toBeInTheDocument();
    });

    it('calls onChange with next page', async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();
      render(<Pagination page={1} pageSize={10} total={30} onChange={onChange} />);

      await user.click(screen.getByRole('button', { name: /next page/i }));
      expect(onChange).toHaveBeenCalledWith(2, 10);
    });

    it('calls onChange with previous page', async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();
      render(<Pagination page={3} pageSize={10} total={30} onChange={onChange} />);

      await user.click(screen.getByRole('button', { name: /previous page/i }));
      expect(onChange).toHaveBeenCalledWith(2, 10);
    });

    it('disables previous on first page', () => {
      render(<Pagination page={1} pageSize={10} total={30} onChange={vi.fn()} />);
      expect(screen.getByRole('button', { name: /previous page/i })).toBeDisabled();
    });
  });

  // --- SortableHeader ---
  describe('SortableHeader', () => {
    it('shows ascending arrow when active with asc', () => {
      const { container } = render(
        <table><thead><tr>
          <SortableHeader label="Name" field="name" currentSort="name" currentDirection="asc" onSort={vi.fn()} />
        </tr></thead></table>,
      );
      expect(container.querySelector('[aria-sort="ascending"]')).toBeInTheDocument();
    });

    it('calls onSort with toggled direction', async () => {
      const user = userEvent.setup();
      const onSort = vi.fn();
      render(
        <table><thead><tr>
          <SortableHeader label="Name" field="name" currentSort="name" currentDirection="asc" onSort={onSort} />
        </tr></thead></table>,
      );

      await user.click(screen.getByText('Name'));
      expect(onSort).toHaveBeenCalledWith('name', 'desc');
    });

    it('calls onSort with asc when clicking inactive column', async () => {
      const user = userEvent.setup();
      const onSort = vi.fn();
      render(
        <table><thead><tr>
          <SortableHeader label="Date" field="date" currentSort="name" currentDirection="asc" onSort={onSort} />
        </tr></thead></table>,
      );

      await user.click(screen.getByText('Date'));
      expect(onSort).toHaveBeenCalledWith('date', 'asc');
    });
  });

  // --- BulkActionsBar ---
  describe('BulkActionsBar', () => {
    it('shows selected count and action buttons', () => {
      const onDelete = vi.fn();
      render(
        <BulkActionsBar
          selectedCount={3}
          actions={[{ label: 'Delete', onClick: onDelete }]}
          onClear={vi.fn()}
        />,
      );

      expect(screen.getByText('3 items selected')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Delete' })).toBeInTheDocument();
    });

    it('fires action callback when clicked', async () => {
      const user = userEvent.setup();
      const onExport = vi.fn();
      render(
        <BulkActionsBar
          selectedCount={2}
          actions={[{ label: 'Export', onClick: onExport }]}
          onClear={vi.fn()}
        />,
      );

      await user.click(screen.getByRole('button', { name: 'Export' }));
      expect(onExport).toHaveBeenCalledOnce();
    });

    it('returns null when selectedCount is 0', () => {
      const { container } = render(
        <BulkActionsBar selectedCount={0} actions={[]} onClear={vi.fn()} />,
      );
      expect(container.innerHTML).toBe('');
    });
  });

  // --- useDateFormat ---
  describe('useDateFormat', () => {
    it('formats NZ dates as dd/MM/yyyy', () => {
      render(<DateFormatResult locale="NZ" />);
      expect(screen.getByTestId('result')).toHaveTextContent('15/01/2024');
    });

    it('formats US dates as MM/dd/yyyy', () => {
      render(<DateFormatResult locale="US" />);
      expect(screen.getByTestId('result')).toHaveTextContent('01/15/2024');
    });

    it('formats UK dates as dd/MM/yyyy', () => {
      render(<DateFormatResult locale="UK" />);
      expect(screen.getByTestId('result')).toHaveTextContent('15/01/2024');
    });
  });

  // --- useNumberFormat ---
  describe('useNumberFormat', () => {
    it('formats currency with NZ locale', () => {
      render(<NumberFormatResult locale="NZ" />);
      const text = screen.getByTestId('currency').textContent ?? '';
      // Should contain NZD symbol and 1,234.50
      expect(text).toContain('1,234.50');
    });

    it('formats plain numbers', () => {
      render(<NumberFormatResult locale="NZ" />);
      const text = screen.getByTestId('number').textContent ?? '';
      expect(text).toContain('9,876.12');
    });
  });

  // --- ActivityLog ---
  describe('ActivityLog', () => {
    it('renders entries from fetch', async () => {
      const mockEntries: AuditEntry[] = [
        { id: '1', action: 'created invoice', user: 'Alice', timestamp: '2024-01-15T10:00:00Z' },
        { id: '2', action: 'approved invoice', user: 'Bob', timestamp: '2024-01-15T12:00:00Z', details: 'Approved for payment' },
      ];
      const fetchEntries = vi.fn().mockResolvedValue(mockEntries);

      render(
        <ActivityLog entityType="invoice" entityId="inv-1" fetchEntries={fetchEntries} />,
      );

      await waitFor(() => {
        expect(screen.getByText('Alice')).toBeInTheDocument();
      });

      expect(screen.getByText('created invoice')).toBeInTheDocument();
      expect(screen.getByText('Bob')).toBeInTheDocument();
      expect(screen.getByText('Approved for payment')).toBeInTheDocument();
      expect(fetchEntries).toHaveBeenCalledWith('invoice', 'inv-1');
    });

    it('shows empty message when no entries', async () => {
      const fetchEntries = vi.fn().mockResolvedValue([]);

      render(
        <ActivityLog entityType="invoice" entityId="inv-1" fetchEntries={fetchEntries} />,
      );

      await waitFor(() => {
        expect(screen.getByText('No activity recorded')).toBeInTheDocument();
      });
    });
  });
});
