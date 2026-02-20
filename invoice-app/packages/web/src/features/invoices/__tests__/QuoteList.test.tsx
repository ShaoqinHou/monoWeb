import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { QuoteList } from '../components/QuoteList';
import type { Quote } from '../hooks/useQuotes';

const uuid = (n: number) => `00000000-0000-0000-0000-${String(n).padStart(12, '0')}`;

const SAMPLE_QUOTES: Quote[] = [
  {
    id: uuid(1),
    quoteNumber: 'QU-0001',
    reference: null,
    contactId: uuid(101),
    contactName: 'Acme Corporation',
    status: 'draft',
    title: 'Website Redesign',
    summary: null,
    currency: 'NZD',
    date: '2026-01-15',
    expiryDate: '2026-02-15',
    subTotal: 5000,
    totalTax: 750,
    total: 5750,
    convertedInvoiceId: null,
    createdAt: '2026-01-15T10:00:00.000Z',
    updatedAt: '2026-01-15T10:00:00.000Z',
  },
  {
    id: uuid(2),
    quoteNumber: 'QU-0002',
    reference: 'REF-456',
    contactId: uuid(102),
    contactName: 'Bay Industries Ltd',
    status: 'sent',
    title: 'Consulting',
    summary: null,
    currency: 'NZD',
    date: '2026-01-20',
    expiryDate: '2026-02-20',
    subTotal: 2000,
    totalTax: 300,
    total: 2300,
    convertedInvoiceId: null,
    createdAt: '2026-01-20T09:00:00.000Z',
    updatedAt: '2026-01-20T09:00:00.000Z',
  },
  {
    id: uuid(3),
    quoteNumber: 'QU-0003',
    reference: null,
    contactId: uuid(103),
    contactName: 'Creative Solutions NZ',
    status: 'accepted',
    title: 'Development',
    summary: null,
    currency: 'NZD',
    date: '2026-02-01',
    expiryDate: '2026-03-01',
    subTotal: 10000,
    totalTax: 1500,
    total: 11500,
    convertedInvoiceId: null,
    createdAt: '2026-02-01T08:30:00.000Z',
    updatedAt: '2026-02-01T08:30:00.000Z',
  },
];

describe('QuoteList', () => {
  it('renders the quote table', () => {
    render(<QuoteList quotes={SAMPLE_QUOTES} onQuoteClick={vi.fn()} />);
    expect(screen.getByTestId('quote-list-table')).toBeInTheDocument();
  });

  it('renders table header columns', () => {
    render(<QuoteList quotes={SAMPLE_QUOTES} onQuoteClick={vi.fn()} />);
    expect(screen.getByText('Number')).toBeInTheDocument();
    expect(screen.getByText('To')).toBeInTheDocument();
    expect(screen.getByText('Date')).toBeInTheDocument();
    expect(screen.getByText('Expiry')).toBeInTheDocument();
    expect(screen.getByText('Amount')).toBeInTheDocument();
    expect(screen.getByText('Status')).toBeInTheDocument();
  });

  it('renders all quote rows', () => {
    render(<QuoteList quotes={SAMPLE_QUOTES} onQuoteClick={vi.fn()} />);
    SAMPLE_QUOTES.forEach((q) => {
      expect(screen.getByTestId(`quote-row-${q.id}`)).toBeInTheDocument();
    });
  });

  it('displays quote numbers', () => {
    render(<QuoteList quotes={SAMPLE_QUOTES} onQuoteClick={vi.fn()} />);
    expect(screen.getByText('QU-0001')).toBeInTheDocument();
    expect(screen.getByText('QU-0002')).toBeInTheDocument();
    expect(screen.getByText('QU-0003')).toBeInTheDocument();
  });

  it('displays contact names', () => {
    render(<QuoteList quotes={SAMPLE_QUOTES.slice(0, 2)} onQuoteClick={vi.fn()} />);
    expect(screen.getByText('Acme Corporation')).toBeInTheDocument();
    expect(screen.getByText('Bay Industries Ltd')).toBeInTheDocument();
  });

  it('calls onQuoteClick when a row is clicked', () => {
    const onClick = vi.fn();
    render(<QuoteList quotes={SAMPLE_QUOTES.slice(0, 1)} onQuoteClick={onClick} />);
    fireEvent.click(screen.getByTestId(`quote-row-${SAMPLE_QUOTES[0].id}`));
    expect(onClick).toHaveBeenCalledWith(SAMPLE_QUOTES[0].id);
  });

  it('shows empty state when no quotes', () => {
    render(<QuoteList quotes={[]} onQuoteClick={vi.fn()} />);
    expect(screen.getByTestId('quote-list-empty')).toBeInTheDocument();
    expect(screen.getByText('Start creating quotes')).toBeInTheDocument();
    expect(
      screen.getByText('Select New quote to outline estimated costs for your customers'),
    ).toBeInTheDocument();
  });

  it('shows loading state', () => {
    render(<QuoteList quotes={[]} onQuoteClick={vi.fn()} isLoading />);
    expect(screen.getByTestId('quote-list-loading')).toBeInTheDocument();
    expect(screen.getByText('Loading quotes...')).toBeInTheDocument();
  });

  it('renders status badges in each row', () => {
    render(<QuoteList quotes={SAMPLE_QUOTES} onQuoteClick={vi.fn()} />);
    expect(screen.getByText('Draft')).toBeInTheDocument();
    expect(screen.getByText('Sent')).toBeInTheDocument();
    expect(screen.getByText('Accepted')).toBeInTheDocument();
  });
});
