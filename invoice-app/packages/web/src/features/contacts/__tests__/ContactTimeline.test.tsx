// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ContactTimeline } from '../components/ContactTimeline';
import type { TimelineEvent } from '../types';

vi.mock('@tanstack/react-router', () => ({
  Link: (props: { to: string; children: React.ReactNode }) => (
    <a href={props.to}>{props.children}</a>
  ),
  useNavigate: vi.fn(() => vi.fn()),
}));

const today = new Date();
const yesterday = new Date(today);
yesterday.setDate(yesterday.getDate() - 1);
const thisWeek = new Date(today);
thisWeek.setDate(thisWeek.getDate() - 3);
const lastMonth = new Date(today);
lastMonth.setMonth(lastMonth.getMonth() - 2);

const MOCK_EVENTS: TimelineEvent[] = [
  {
    id: 'evt-1',
    type: 'invoice_created',
    date: today.toISOString(),
    description: 'Invoice INV-001 created',
    amount: 1500,
    status: 'draft',
    entityId: 'inv-001',
  },
  {
    id: 'evt-2',
    type: 'payment_received',
    date: yesterday.toISOString(),
    description: 'Payment received for INV-002',
    amount: 750,
    entityId: 'pmt-001',
  },
  {
    id: 'evt-3',
    type: 'note_added',
    date: thisWeek.toISOString(),
    description: 'Note added: Follow up on quote',
  },
  {
    id: 'evt-4',
    type: 'bill_created',
    date: lastMonth.toISOString(),
    description: 'Bill BILL-001 created',
    amount: 500,
    status: 'approved',
    entityId: 'bill-001',
  },
  {
    id: 'evt-5',
    type: 'invoice_paid',
    date: lastMonth.toISOString(),
    description: 'Invoice INV-002 paid',
    amount: 750,
    entityId: 'inv-002',
  },
  {
    id: 'evt-6',
    type: 'contact_updated',
    date: lastMonth.toISOString(),
    description: 'Contact details updated',
  },
];

describe('ContactTimeline', () => {
  it('renders timeline events', () => {
    render(<ContactTimeline events={MOCK_EVENTS} isLoading={false} />);
    expect(screen.getByTestId('contact-timeline')).toBeInTheDocument();
    expect(screen.getByText('Invoice INV-001 created')).toBeInTheDocument();
    expect(screen.getByText('Payment received for INV-002')).toBeInTheDocument();
  });

  it('groups events by date period', () => {
    render(<ContactTimeline events={MOCK_EVENTS} isLoading={false} />);
    // Should have date grouping headers
    expect(screen.getByText('Today')).toBeInTheDocument();
    expect(screen.getByText('Older')).toBeInTheDocument();
  });

  it('shows different icons per event type', () => {
    render(<ContactTimeline events={MOCK_EVENTS} isLoading={false} />);
    // Invoice created should have specific icon marker
    expect(screen.getByTestId('timeline-icon-invoice_created')).toBeInTheDocument();
    expect(screen.getByTestId('timeline-icon-payment_received')).toBeInTheDocument();
    expect(screen.getByTestId('timeline-icon-note_added')).toBeInTheDocument();
    expect(screen.getByTestId('timeline-icon-bill_created')).toBeInTheDocument();
  });

  it('shows amounts where relevant', () => {
    render(<ContactTimeline events={MOCK_EVENTS} isLoading={false} />);
    expect(screen.getByText('$1,500.00')).toBeInTheDocument();
    expect(screen.getByText('$500.00')).toBeInTheDocument();
  });

  it('shows loading state', () => {
    render(<ContactTimeline events={[]} isLoading={true} />);
    expect(screen.getByTestId('timeline-loading')).toBeInTheDocument();
  });

  it('shows empty state when no events', () => {
    render(<ContactTimeline events={[]} isLoading={false} />);
    expect(screen.getByTestId('timeline-empty')).toBeInTheDocument();
  });

  it('renders all events from the list', () => {
    render(<ContactTimeline events={MOCK_EVENTS} isLoading={false} />);
    const items = screen.getAllByTestId(/^timeline-event-/);
    expect(items).toHaveLength(6);
  });
});
