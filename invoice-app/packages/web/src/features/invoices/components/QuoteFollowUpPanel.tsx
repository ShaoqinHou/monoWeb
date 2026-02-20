import { useState } from 'react';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '../../../components/ui/Table';
import { useExpiringQuotes, useSendQuoteFollowUp } from '../hooks/useQuoteFollowUp';

function formatCurrency(amount: number, currency: string): string {
  return `${currency} ${amount.toLocaleString('en-NZ', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function QuoteFollowUpPanel() {
  const { data: quotes = [], isLoading } = useExpiringQuotes();
  const sendFollowUp = useSendQuoteFollowUp();
  const [sentIds, setSentIds] = useState<Set<string>>(new Set());

  const handleSendFollowUp = (quoteId: string) => {
    sendFollowUp.mutate(quoteId, {
      onSuccess: () => {
        setSentIds((prev) => new Set(prev).add(quoteId));
      },
    });
  };

  const getExpiryBadge = (daysUntilExpiry: number, status: 'expiring' | 'expired') => {
    if (status === 'expired') {
      return (
        <Badge variant="error">
          {Math.abs(daysUntilExpiry)} days past
        </Badge>
      );
    }
    if (daysUntilExpiry <= 7) {
      return (
        <Badge variant="warning">
          {daysUntilExpiry} days left
        </Badge>
      );
    }
    return (
      <Badge variant="info">
        {daysUntilExpiry} days left
      </Badge>
    );
  };

  return (
    <div data-testid="quote-followup-panel">
      <h2 className="text-lg font-semibold text-[#1a1a2e] mb-4">Quote Follow-up Reminders</h2>

      {isLoading ? (
        <p data-testid="loading">Loading...</p>
      ) : quotes.length === 0 ? (
        <p className="text-[#6b7280] text-sm py-8 text-center" data-testid="no-quotes">
          No expiring quotes found.
        </p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Quote #</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Expiry Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {quotes.map((quote) => (
              <TableRow
                key={quote.id}
                data-testid={`quote-row-${quote.id}`}
                className={quote.status === 'expired' ? 'bg-red-50' : quote.daysUntilExpiry <= 7 ? 'bg-yellow-50' : ''}
              >
                <TableCell className="font-medium">{quote.quoteNumber}</TableCell>
                <TableCell>{quote.contactName}</TableCell>
                <TableCell>{formatCurrency(quote.total, quote.currency)}</TableCell>
                <TableCell>{quote.expiryDate}</TableCell>
                <TableCell>
                  {getExpiryBadge(quote.daysUntilExpiry, quote.status)}
                </TableCell>
                <TableCell>
                  {sentIds.has(quote.id) ? (
                    <span className="text-sm text-[#14b8a6]" data-testid={`followup-sent-${quote.id}`}>
                      Sent
                    </span>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleSendFollowUp(quote.id)}
                      disabled={sendFollowUp.isPending}
                      data-testid={`send-followup-${quote.id}`}
                    >
                      Send Follow-up
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
