// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { AuditTimeline } from '../components/AuditTimeline';
import type { AuditEntry } from '../types';

vi.mock('@tanstack/react-router', () => ({
  Link: (props: { to: string; children: React.ReactNode }) => (
    <a href={props.to}>{props.children}</a>
  ),
}));

const MOCK_ENTRIES: AuditEntry[] = [
  {
    id: 'a1',
    entityType: 'invoice',
    entityId: 'inv-001',
    action: 'created',
    userId: 'user-1',
    userName: 'Alice',
    timestamp: '2026-02-16T10:00:00.000Z',
    changes: [],
  },
  {
    id: 'a2',
    entityType: 'contact',
    entityId: 'c-001',
    action: 'updated',
    userId: 'user-2',
    userName: 'Bob',
    timestamp: '2026-02-15T09:00:00.000Z',
    changes: [{ field: 'name', oldValue: 'Old', newValue: 'New' }],
  },
  {
    id: 'a3',
    entityType: 'bill',
    entityId: 'bill-001',
    action: 'deleted',
    userId: 'user-1',
    userName: 'Alice',
    timestamp: '2026-02-14T08:00:00.000Z',
    changes: [],
  },
];

describe('AuditTimeline', () => {
  it('renders all entry rows', () => {
    render(<AuditTimeline entries={MOCK_ENTRIES} />);
    const rows = screen.getAllByTestId('audit-entry-row');
    expect(rows).toHaveLength(3);
  });

  it('renders user names in entry rows', () => {
    render(<AuditTimeline entries={MOCK_ENTRIES} />);
    expect(screen.getAllByText('Alice')).toHaveLength(2);
    expect(screen.getByText('Bob')).toBeInTheDocument();
  });

  it('renders empty state when no entries', () => {
    render(<AuditTimeline entries={[]} />);
    expect(screen.getByTestId('audit-empty')).toBeInTheDocument();
    expect(screen.getByText(/no audit entries/i)).toBeInTheDocument();
  });

  it('does not render empty state when entries exist', () => {
    render(<AuditTimeline entries={MOCK_ENTRIES} />);
    expect(screen.queryByTestId('audit-empty')).not.toBeInTheDocument();
  });

  it('passes onEntityClick to each entry row', () => {
    const onEntityClick = vi.fn();
    render(<AuditTimeline entries={MOCK_ENTRIES} onEntityClick={onEntityClick} />);

    const links = screen.getAllByTestId('entity-link');
    fireEvent.click(links[0]);

    expect(onEntityClick).toHaveBeenCalledWith('invoice', 'inv-001');
  });

  it('renders a single entry correctly', () => {
    render(<AuditTimeline entries={[MOCK_ENTRIES[0]]} />);
    const rows = screen.getAllByTestId('audit-entry-row');
    expect(rows).toHaveLength(1);
    expect(screen.getByText('Alice')).toBeInTheDocument();
  });
});
