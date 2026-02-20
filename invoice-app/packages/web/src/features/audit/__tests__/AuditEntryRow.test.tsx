// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { AuditEntryRow } from '../components/AuditEntryRow';

vi.mock('@tanstack/react-router', () => ({
  Link: (props: { to: string; children: React.ReactNode }) => (
    <a href={props.to}>{props.children}</a>
  ),
}));

const baseEntry = {
  id: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d',
  entityType: 'invoice' as const,
  entityId: 'inv-001',
  action: 'created' as const,
  userId: 'user-1',
  userName: 'Demo User',
  timestamp: new Date().toISOString(),
  changes: [],
};

describe('AuditEntryRow', () => {
  it('renders the entry with user name', () => {
    render(<AuditEntryRow entry={baseEntry} />);
    expect(screen.getByText('Demo User')).toBeInTheDocument();
  });

  it('renders the timestamp', () => {
    render(<AuditEntryRow entry={baseEntry} />);
    // Should show a relative or formatted timestamp
    expect(screen.getByTestId('audit-timestamp')).toBeInTheDocument();
  });

  it('shows action badge with "created" text', () => {
    render(<AuditEntryRow entry={baseEntry} />);
    const badge = screen.getByTestId('action-badge');
    expect(badge).toBeInTheDocument();
    expect(badge.textContent).toContain('created');
  });

  it('shows green badge for created action', () => {
    render(<AuditEntryRow entry={baseEntry} />);
    const badge = screen.getByTestId('action-badge');
    expect(badge.className).toContain('bg-');
  });

  it('shows blue badge for updated action', () => {
    render(<AuditEntryRow entry={{ ...baseEntry, action: 'updated' }} />);
    const badge = screen.getByTestId('action-badge');
    expect(badge).toBeInTheDocument();
    expect(badge.textContent).toContain('updated');
  });

  it('shows red badge for deleted action', () => {
    render(<AuditEntryRow entry={{ ...baseEntry, action: 'deleted' }} />);
    const badge = screen.getByTestId('action-badge');
    expect(badge).toBeInTheDocument();
    expect(badge.textContent).toContain('deleted');
  });

  it('shows yellow badge for status_changed action', () => {
    render(<AuditEntryRow entry={{ ...baseEntry, action: 'status_changed' }} />);
    const badge = screen.getByTestId('action-badge');
    expect(badge).toBeInTheDocument();
    expect(badge.textContent).toContain('status changed');
  });

  it('shows entity link with correct entity type', () => {
    render(<AuditEntryRow entry={baseEntry} />);
    const link = screen.getByTestId('entity-link');
    expect(link).toBeInTheDocument();
    expect(link.textContent).toContain('invoice');
  });

  it('renders entity link as an anchor to the correct path', () => {
    render(<AuditEntryRow entry={baseEntry} />);
    const link = screen.getByTestId('entity-link');
    const anchor = link.querySelector('a');
    expect(anchor).toBeInTheDocument();
    expect(anchor?.getAttribute('href')).toBe('/sales/invoices/inv-001');
  });

  it('renders entity link for contact type', () => {
    render(<AuditEntryRow entry={{ ...baseEntry, entityType: 'contact', entityId: 'c-001' }} />);
    const link = screen.getByTestId('entity-link');
    const anchor = link.querySelector('a');
    expect(anchor?.getAttribute('href')).toBe('/contacts/c-001');
  });

  it('shows expandable changes section when changes exist', () => {
    const entry = {
      ...baseEntry,
      action: 'updated' as const,
      changes: [
        { field: 'status', oldValue: 'draft', newValue: 'approved' },
        { field: 'total', oldValue: '100.00', newValue: '200.00' },
      ],
    };
    render(<AuditEntryRow entry={entry} />);

    const toggleBtn = screen.getByTestId('changes-toggle');
    expect(toggleBtn).toBeInTheDocument();

    // Changes should be hidden initially
    expect(screen.queryByTestId('changes-detail')).not.toBeInTheDocument();

    // Click to expand
    fireEvent.click(toggleBtn);
    expect(screen.getByTestId('changes-detail')).toBeInTheDocument();
    expect(screen.getByText('status')).toBeInTheDocument();
    expect(screen.getByText('draft')).toBeInTheDocument();
    expect(screen.getByText('approved')).toBeInTheDocument();
  });

  it('does not show changes toggle when no changes', () => {
    render(<AuditEntryRow entry={baseEntry} />);
    expect(screen.queryByTestId('changes-toggle')).not.toBeInTheDocument();
  });

  it('calls onEntityClick when entity link clicked', () => {
    const onEntityClick = vi.fn();
    render(<AuditEntryRow entry={baseEntry} onEntityClick={onEntityClick} />);

    const link = screen.getByTestId('entity-link');
    fireEvent.click(link);

    expect(onEntityClick).toHaveBeenCalledWith('invoice', 'inv-001');
  });
});
