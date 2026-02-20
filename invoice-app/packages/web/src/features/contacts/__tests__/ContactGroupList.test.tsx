// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ContactGroupList } from '../components/ContactGroupList';
import type { ContactGroup } from '../hooks/useContactGroups';

const MOCK_GROUPS: ContactGroup[] = [
  {
    id: 'g1',
    name: 'VIP Clients',
    description: 'High-value customers',
    createdAt: '2025-01-15T10:00:00.000Z',
  },
  {
    id: 'g2',
    name: 'Overseas Suppliers',
    description: null,
    createdAt: '2025-02-20T08:00:00.000Z',
  },
  {
    id: 'g3',
    name: 'Monthly Billing',
    description: 'Regular invoice recipients',
    createdAt: '2025-03-10T09:30:00.000Z',
  },
];

const MOCK_MEMBER_COUNTS: Record<string, number> = {
  g1: 5,
  g2: 12,
  g3: 0,
};

describe('ContactGroupList', () => {
  const defaultProps = {
    groups: MOCK_GROUPS,
    isLoading: false,
    onGroupClick: vi.fn(),
    onNewGroup: vi.fn(),
    memberCounts: MOCK_MEMBER_COUNTS,
  };

  it('renders the groups table with all groups', () => {
    render(<ContactGroupList {...defaultProps} />);
    expect(screen.getByText('VIP Clients')).toBeInTheDocument();
    expect(screen.getByText('Overseas Suppliers')).toBeInTheDocument();
    expect(screen.getByText('Monthly Billing')).toBeInTheDocument();
  });

  it('renders table headers', () => {
    render(<ContactGroupList {...defaultProps} />);
    expect(screen.getByText('Name')).toBeInTheDocument();
    expect(screen.getByText('Description')).toBeInTheDocument();
    expect(screen.getByText('Members')).toBeInTheDocument();
  });

  it('renders descriptions', () => {
    render(<ContactGroupList {...defaultProps} />);
    expect(screen.getByText('High-value customers')).toBeInTheDocument();
    expect(screen.getByText('Regular invoice recipients')).toBeInTheDocument();
  });

  it('renders dash for null descriptions', () => {
    render(<ContactGroupList {...defaultProps} />);
    const dashes = screen.getAllByText('-');
    expect(dashes.length).toBeGreaterThan(0);
  });

  it('renders member counts', () => {
    render(<ContactGroupList {...defaultProps} />);
    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByText('12')).toBeInTheDocument();
    expect(screen.getByText('0')).toBeInTheDocument();
  });

  it('calls onGroupClick when a row is clicked', async () => {
    const onGroupClick = vi.fn();
    const user = userEvent.setup();
    render(<ContactGroupList {...defaultProps} onGroupClick={onGroupClick} />);

    await user.click(screen.getByText('VIP Clients'));
    expect(onGroupClick).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'VIP Clients' }),
    );
  });

  it('calls onNewGroup when New Group button is clicked', async () => {
    const onNewGroup = vi.fn();
    const user = userEvent.setup();
    render(<ContactGroupList {...defaultProps} onNewGroup={onNewGroup} />);

    await user.click(screen.getByTestId('new-group-btn'));
    expect(onNewGroup).toHaveBeenCalledOnce();
  });

  it('shows loading state', () => {
    render(<ContactGroupList {...defaultProps} isLoading={true} groups={[]} />);
    expect(screen.getByTestId('groups-loading')).toBeInTheDocument();
    expect(screen.getByText('Loading groups...')).toBeInTheDocument();
  });

  it('shows empty state when no groups', () => {
    render(<ContactGroupList {...defaultProps} groups={[]} />);
    expect(screen.getByTestId('groups-empty')).toBeInTheDocument();
    expect(screen.getByText('No groups found.')).toBeInTheDocument();
  });

  it('renders the heading', () => {
    render(<ContactGroupList {...defaultProps} />);
    expect(screen.getByText('Contact Groups')).toBeInTheDocument();
  });
});
