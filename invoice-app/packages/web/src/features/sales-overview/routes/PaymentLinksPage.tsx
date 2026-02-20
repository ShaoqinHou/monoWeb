import { PageContainer } from '../../../components/layout/PageContainer';
import { Button } from '../../../components/ui/Button';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '../../../components/ui/Table';
import { Badge } from '../../../components/ui/Badge';
import { Plus, Settings } from 'lucide-react';
import { NotImplemented } from '../../../components/patterns/NotImplemented';

interface PaymentLink {
  id: string;
  description: string;
  contact: string;
  issueDate: string;
  amount: number;
  currency: string;
  status: 'active' | 'expired' | 'paid';
  invoiceNumber?: string;
  link?: string;
}

// Mock data — in production this would be fetched from API
const MOCK_PAYMENT_LINKS: PaymentLink[] = [];

const STATUS_COLORS: Record<string, string> = {
  active: 'bg-green-100 text-green-800',
  expired: 'bg-gray-100 text-gray-600',
  paid: 'bg-blue-100 text-blue-800',
};

export function PaymentLinksPage() {
  return (
    <PageContainer
      title="Payment Links"
      breadcrumbs={[
        { label: 'Sales', href: '/sales' },
        { label: 'Payment Links' },
      ]}
      actions={
        <div className="flex items-center gap-2">
          <NotImplemented label="Create payment link — not yet implemented">
            <Button
              variant="primary"
              size="sm"
              onClick={() => {}}
              data-testid="create-payment-link-button"
            >
              <Plus className="h-4 w-4 mr-1" />
              Create payment link
            </Button>
          </NotImplemented>
        </div>
      }
    >
      <div className="space-y-4">
        {/* Setup prompt for Stripe */}
        <div
          className="rounded-md border border-gray-200 bg-gray-50 p-4 flex items-center justify-between"
          data-testid="setup-cards-banner"
        >
          <div>
            <p className="text-sm font-medium text-gray-900">
              Wish your customers could pay you on the spot?
            </p>
            <p className="text-sm text-gray-500">
              Create your Stripe account from within Xero.
            </p>
          </div>
          <NotImplemented label="Setup cards — not yet implemented">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {}}
              data-testid="setup-cards-button"
            >
              <Settings className="h-4 w-4 mr-1" />
              Setup cards
            </Button>
          </NotImplemented>
        </div>

        {/* Payment links table */}
        {MOCK_PAYMENT_LINKS.length === 0 ? (
          <div className="py-12 text-center" data-testid="payment-links-empty">
            <h3 className="text-lg font-medium text-gray-900">No payment links yet</h3>
            <p className="mt-1 text-sm text-gray-500">
              Create a payment link to let customers pay you instantly
            </p>
            <div className="mt-4">
              <NotImplemented label="Create payment link — not yet implemented">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => {}}
                  data-testid="create-first-link-button"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Create payment link
                </Button>
              </NotImplemented>
            </div>
          </div>
        ) : (
          <Table aria-label="List of payment links" data-testid="payment-links-table">
            <TableHeader>
              <TableRow>
                <TableHead>Description</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Issue date</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Invoice</TableHead>
                <TableHead>Link</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {MOCK_PAYMENT_LINKS.map((link) => (
                <TableRow key={link.id} data-testid={`payment-link-row-${link.id}`}>
                  <TableCell>{link.description}</TableCell>
                  <TableCell>{link.contact}</TableCell>
                  <TableCell>{link.issueDate}</TableCell>
                  <TableCell className="text-right">
                    {link.currency} {link.amount.toFixed(2)}
                  </TableCell>
                  <TableCell>
                    <Badge className={STATUS_COLORS[link.status] ?? ''}>
                      {link.status.charAt(0).toUpperCase() + link.status.slice(1)}
                    </Badge>
                  </TableCell>
                  <TableCell>{link.invoiceNumber ?? '—'}</TableCell>
                  <TableCell>
                    {link.link ? (
                      <a
                        href={link.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#0078c8] hover:underline text-sm"
                        data-testid={`payment-link-url-${link.id}`}
                      >
                        View link
                      </a>
                    ) : (
                      '—'
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </PageContainer>
  );
}
