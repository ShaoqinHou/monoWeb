import { useState, useMemo } from 'react';
import { useNavigate } from '@tanstack/react-router';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '../../../components/ui/Table';
import { Button } from '../../../components/ui/Button';
import { SortableHeader } from '../../../components/patterns/SortableHeader';
import { Pagination } from '../../../components/patterns/Pagination';
import { usePagination } from '../../../lib/usePagination';
import { QuoteStatusBadge } from './QuoteStatusBadge';
import type { Quote } from '../hooks/useQuotes';

interface QuoteListProps {
  quotes: Quote[];
  onQuoteClick: (id: string) => void;
  isLoading?: boolean;
}

export function QuoteList({ quotes, onQuoteClick, isLoading }: QuoteListProps) {
  const navigate = useNavigate();
  const [sortField, setSortField] = useState('');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  const handleSort = (field: string, direction: 'asc' | 'desc') => {
    setSortField(field);
    setSortDir(direction);
  };

  const sortedQuotes = useMemo(() => {
    if (!sortField) return quotes;
    return [...quotes].sort((a, b) => {
      let aVal: string | number;
      let bVal: string | number;
      switch (sortField) {
        case 'number':
          aVal = a.quoteNumber ?? '';
          bVal = b.quoteNumber ?? '';
          break;
        case 'contact':
          aVal = a.contactName ?? '';
          bVal = b.contactName ?? '';
          break;
        case 'date':
          aVal = a.date ?? '';
          bVal = b.date ?? '';
          break;
        case 'expiryDate':
          aVal = a.expiryDate ?? '';
          bVal = b.expiryDate ?? '';
          break;
        case 'total':
          aVal = a.total ?? 0;
          bVal = b.total ?? 0;
          break;
        default:
          return 0;
      }
      if (aVal < bVal) return sortDir === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
  }, [quotes, sortField, sortDir]);

  const pagination = usePagination(sortedQuotes);

  if (isLoading) {
    return (
      <div className="py-12 text-center text-gray-500" data-testid="quote-list-loading">
        Loading quotes...
      </div>
    );
  }

  if (quotes.length === 0) {
    return (
      <div className="py-12 text-center" data-testid="quote-list-empty">
        <h3 className="text-lg font-medium text-gray-900">Start creating quotes</h3>
        <p className="mt-1 text-sm text-gray-500">
          Select New quote to outline estimated costs for your customers
        </p>
        <div className="mt-4">
          <Button variant="primary" size="sm" onClick={() => navigate({ to: '/sales/quotes/new' })}>
            New Quote
          </Button>
        </div>
      </div>
    );
  }

  return (
    <>
    <Table data-testid="quote-list-table">
      <TableHeader>
        <TableRow>
          <SortableHeader label="Number" field="number" currentSort={sortField} currentDirection={sortDir} onSort={handleSort} />
          <SortableHeader label="To" field="contact" currentSort={sortField} currentDirection={sortDir} onSort={handleSort} />
          <SortableHeader label="Date" field="date" currentSort={sortField} currentDirection={sortDir} onSort={handleSort} />
          <SortableHeader label="Expiry" field="expiryDate" currentSort={sortField} currentDirection={sortDir} onSort={handleSort} />
          <SortableHeader label="Amount" field="total" currentSort={sortField} currentDirection={sortDir} onSort={handleSort} className="text-right" />
          <TableHead>Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {pagination.pageData.map((quote) => (
          <TableRow
            key={quote.id}
            className="cursor-pointer"
            onClick={() => onQuoteClick(quote.id)}
            data-testid={`quote-row-${quote.id}`}
          >
            <TableCell className="font-medium">{quote.quoteNumber}</TableCell>
            <TableCell>{quote.contactName}</TableCell>
            <TableCell>{quote.date}</TableCell>
            <TableCell>{quote.expiryDate}</TableCell>
            <TableCell className="text-right">
              {quote.currency} {quote.total.toFixed(2)}
            </TableCell>
            <TableCell>
              <QuoteStatusBadge status={quote.status} />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
    <Pagination
      page={pagination.page}
      pageSize={pagination.pageSize}
      total={pagination.total}
      onChange={pagination.onChange}
    />
    </>
  );
}
