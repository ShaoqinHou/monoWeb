import { useState } from 'react';
import { useParams, useNavigate } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { PageContainer } from '../../../components/layout/PageContainer';
import { Button } from '../../../components/ui/Button';
import { Card, CardContent } from '../../../components/ui/Card';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '../../../components/ui/Table';
import { QuoteStatusBadge } from '../components/QuoteStatusBadge';
import { QuoteForm, type QuoteFormData } from '../components/QuoteForm';
import {
  useQuote,
  useCreateQuote,
  useUpdateQuote,
  useTransitionQuote,
  useConvertQuote,
} from '../hooks/useQuotes';
import type { QuoteStatus } from '../hooks/useQuotes';
import { Badge } from '../../../components/ui/Badge';
import { useContacts } from '../../contacts/hooks/useContacts';
import { useAccounts } from '../../accounting/hooks/useAccounts';
import { useProjects } from '../../projects/hooks/useProjects';
import { useTrackingCategories } from '../../accounting/hooks/useTrackingCategories';
import { useCurrencies } from '../../settings/hooks/useCurrencies';
import { useTaxRates } from '../../accounting/hooks/useTaxRates';
import { showToast } from '../../dashboard/components/ToastContainer';
import { apiFetch, apiPut } from '../../../lib/api-helpers';
import { Pencil, ArrowRight, X } from 'lucide-react';

/* ════════════════════════════════════════════
   QuoteDetailPage — View a single quote (with inline edit)
   ════════════════════════════════════════════ */
export function QuoteDetailPage() {
  const { quoteId } = useParams({ from: '/sales/quotes/$quoteId' });
  const navigate = useNavigate();
  const { data: quote, isLoading } = useQuote(quoteId);
  const transitionMutation = useTransitionQuote();
  const convertMutation = useConvertQuote();
  const updateMutation = useUpdateQuote();
  const [isEditing, setIsEditing] = useState(false);
  const { data: contactsRaw = [] } = useContacts();
  const contactOptions = contactsRaw.map(c => ({ value: c.id, label: c.name }));
  const { data: accountsRaw = [] } = useAccounts();
  const accountOptions = accountsRaw.map(a => ({ value: a.code, label: `${a.code} - ${a.name}` }));
  const { data: projectsRaw = [] } = useProjects();
  const projectOptions = projectsRaw.map(p => ({ value: p.id, label: p.name }));
  const { data: trackingCatsRaw = [] } = useTrackingCategories();
  const regionOptions = trackingCatsRaw.flatMap(tc =>
    (tc.options || []).map((opt: { name: string }) => ({ value: opt.name, label: opt.name }))
  );
  const { data: currenciesRaw = [] } = useCurrencies();
  const currencyOptions = currenciesRaw.map(c => ({ value: c.code, label: `${c.code} - ${c.name}` }));
  const { data: taxRatesRaw = [] } = useTaxRates();
  const taxRateOptions = taxRatesRaw.map(tr => ({ value: String(tr.rate), label: tr.name }));
  const { data: products = [] } = useQuery({
    queryKey: ['quotes', 'products'],
    queryFn: () => apiFetch<Array<{ id: string; code: string; name: string; salePrice: number }>>('/products'),
    staleTime: 5 * 60 * 1000,
  });
  const items = products.map(p => ({ code: p.code, name: p.name, salePrice: p.salePrice }));

  const handleTransition = (newStatus: QuoteStatus) => {
    transitionMutation.mutate(
      { id: quoteId, status: newStatus },
      {
        onSuccess: () => showToast('success', 'Quote updated'),
        onError: (err: Error) => showToast('error', err.message || 'Failed to update quote'),
      },
    );
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
  };

  const handleSaveEdit = (data: QuoteFormData) => {
    updateMutation.mutate(
      {
        id: quoteId,
        data: {
          contactId: data.contactId,
          title: data.title,
          summary: data.summary,
          reference: data.reference,
          date: data.date,
          expiryDate: data.expiryDate,
          currency: data.currency,
          lineItems: data.lineItems.map((li) => ({
            description: li.description,
            quantity: li.quantity,
            unitPrice: li.unitPrice,
            accountCode: li.accountCode,
            taxRate: li.taxRate,
            discount: li.discount,
          })),
        },
      },
      {
        onSuccess: () => {
          setIsEditing(false);
          showToast('success', 'Quote saved');
        },
        onError: (err: Error) => {
          showToast('error', err.message || 'Failed to save quote');
        },
      },
    );
  };

  const handleConvert = () => {
    convertMutation.mutate(quoteId, {
      onSuccess: () => {
        showToast('success', 'Quote converted to invoice');
        navigate({ to: '/sales/invoices' });
      },
      onError: (err: Error) => {
        showToast('error', err.message || 'Failed to convert quote');
      },
    });
  };

  if (isLoading) {
    return (
      <PageContainer title="Quote" breadcrumbs={[{ label: 'Quotes', href: '/sales/quotes' }]}>
        <div className="py-12 text-center text-gray-500" data-testid="quote-detail-loading">
          Loading quote...
        </div>
      </PageContainer>
    );
  }

  if (!quote) {
    return (
      <PageContainer title="Quote" breadcrumbs={[{ label: 'Quotes', href: '/sales/quotes' }]}>
        <div className="py-12 text-center text-gray-500" data-testid="quote-not-found">
          Quote not found
        </div>
      </PageContainer>
    );
  }

  const canEdit = quote.status === 'draft';
  const canConvert = quote.status === 'accepted';
  const isExpired = quote.expiryDate && new Date(quote.expiryDate) < new Date(new Date().toISOString().split('T')[0]);

  /* ─── Inline edit mode ─── */
  if (isEditing && canEdit) {
    const initialData: Partial<QuoteFormData> = {
      contactId: quote.contactId,
      contactName: quote.contactName,
      title: quote.title ?? '',
      summary: quote.summary ?? '',
      reference: quote.reference ?? '',
      date: quote.date,
      expiryDate: quote.expiryDate,
      lineItems: quote.lineItems?.map((li) => ({
        key: li.id,
        description: li.description,
        quantity: li.quantity,
        unitPrice: li.unitPrice,
        accountCode: li.accountCode ?? '200',
        taxRate: li.taxRate,
        discount: li.discount,
        discountType: 'percent' as const,
      })),
    };

    return (
      <PageContainer
        title={`Edit: ${quote.quoteNumber ?? 'Quote'}`}
        breadcrumbs={[
          { label: 'Quotes', href: '/sales/quotes' },
          { label: quote.quoteNumber ?? quoteId },
          { label: 'Edit' },
        ]}
        actions={
          <Button variant="outline" size="sm" onClick={handleCancelEdit} data-testid="cancel-edit-button">
            <X className="h-4 w-4 mr-1" />
            Cancel
          </Button>
        }
      >
        <QuoteForm
          initialData={initialData}
          quoteNumber={quote.quoteNumber}
          onSaveDraft={handleSaveEdit}
          onSubmit={handleSaveEdit}
          isSaving={updateMutation.isPending}
          contacts={contactOptions}
          items={items}
          accountOptions={accountOptions}
          projectOptions={projectOptions}
          regionOptions={regionOptions}
          currencyOptions={currencyOptions}
          taxRateOptions={taxRateOptions}
        />
      </PageContainer>
    );
  }

  /* ─── Detail view (read-only) ─── */
  return (
    <PageContainer
      title={quote.quoteNumber ?? 'Quote'}
      breadcrumbs={[
        { label: 'Quotes', href: '/sales/quotes' },
        { label: quote.quoteNumber ?? quoteId },
      ]}
    >
      <div className="space-y-6" data-testid="quote-detail">
        {/* Header row: status badge + actions */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <QuoteStatusBadge status={quote.status} />
            {isExpired && (
              <Badge variant="error" data-testid="expired-badge">
                Expired
              </Badge>
            )}
            {canEdit && (
              <Button variant="outline" size="sm" onClick={handleEdit} data-testid="edit-quote-button">
                <Pencil className="h-4 w-4 mr-1" />
                Edit
              </Button>
            )}
            {canConvert && (
              <Button
                variant="primary"
                size="sm"
                onClick={handleConvert}
                loading={convertMutation.isPending}
                data-testid="convert-quote-button"
              >
                <ArrowRight className="h-4 w-4 mr-1" />
                Convert to Invoice
              </Button>
            )}
          </div>
          <div className="flex items-center gap-2" data-testid="quote-actions">
            {quote.status === 'draft' && (
              <Button
                variant="primary"
                onClick={() => handleTransition('sent')}
                disabled={transitionMutation.isPending}
                loading={transitionMutation.isPending}
                data-testid="action-send"
              >
                Send
              </Button>
            )}
            {quote.status === 'sent' && (
              <>
                <Button
                  variant="primary"
                  onClick={() => handleTransition('accepted')}
                  disabled={transitionMutation.isPending || !!isExpired}
                  data-testid="action-accept"
                >
                  Mark Accepted
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => handleTransition('declined')}
                  disabled={transitionMutation.isPending}
                  data-testid="action-decline"
                >
                  Mark Declined
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Quote preview card */}
        <Card>
          <CardContent className="space-y-6 p-8">
            {/* From / To row */}
            <div className="grid grid-cols-2 gap-8">
              <div>
                <p className="text-xs font-semibold uppercase text-gray-500 mb-1">From</p>
                <p className="font-medium text-gray-900">My Organisation</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase text-gray-500 mb-1">To</p>
                <p className="font-medium text-gray-900" data-testid="detail-contact">
                  {quote.contactName}
                </p>
              </div>
            </div>

            {/* Quote metadata */}
            <div className="grid grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-gray-500">Quote Number</p>
                <p className="font-medium" data-testid="detail-number">
                  {quote.quoteNumber}
                </p>
              </div>
              <div>
                <p className="text-gray-500">Reference</p>
                <p className="font-medium">{quote.reference ?? '-'}</p>
              </div>
              <div>
                <p className="text-gray-500">Date</p>
                <p className="font-medium">{quote.date}</p>
              </div>
              <div>
                <p className="text-gray-500">Expiry Date</p>
                <p className="font-medium">{quote.expiryDate}</p>
              </div>
            </div>

            {quote.title && (
              <div className="text-sm">
                <p className="text-gray-500">Title</p>
                <p className="font-medium" data-testid="detail-title">{quote.title}</p>
              </div>
            )}

            {quote.summary && (
              <div className="text-sm">
                <p className="text-gray-500">Summary</p>
                <p className="font-medium">{quote.summary}</p>
              </div>
            )}

            {/* Line items table */}
            {quote.lineItems && quote.lineItems.length > 0 && (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-right">Qty</TableHead>
                    <TableHead className="text-right">Unit Price</TableHead>
                    <TableHead className="text-right">Tax</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {quote.lineItems.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>{item.description}</TableCell>
                      <TableCell className="text-right">{item.quantity}</TableCell>
                      <TableCell className="text-right">{item.unitPrice.toFixed(2)}</TableCell>
                      <TableCell className="text-right">{item.taxAmount.toFixed(2)}</TableCell>
                      <TableCell className="text-right font-medium">
                        {item.lineAmount.toFixed(2)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}

            {/* Totals */}
            <div className="flex justify-end">
              <div className="w-72 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal</span>
                  <span data-testid="detail-subtotal">
                    {quote.currency} {quote.subTotal.toFixed(2)}
                  </span>
                </div>
                {quote.totalTax > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tax</span>
                    <span data-testid="detail-tax">
                      {quote.currency} {quote.totalTax.toFixed(2)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between border-t border-gray-200 pt-2 font-semibold">
                  <span>Total</span>
                  <span data-testid="detail-total">
                    {quote.currency} {quote.total.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}

/* ════════════════════════════════════════════
   QuoteEditPage — Redirects to detail page (edit route removed)
   Kept for backward compatibility; renders same inline edit.
   ════════════════════════════════════════════ */
export function QuoteEditPage() {
  // The /edit route was removed from the router.
  // If this component somehow renders, redirect to the detail page.
  // The QuoteDetailPage now handles editing inline.
  const navigate = useNavigate();
  const params = new URLSearchParams(
    typeof window !== 'undefined' ? window.location.search : '',
  );
  const quoteId = window.location.pathname.split('/').filter(Boolean).at(-2) ?? '';

  // Redirect to the detail page
  navigate({ to: '/sales/quotes/$quoteId', params: { quoteId } });

  return (
    <PageContainer title="Redirecting..." breadcrumbs={[{ label: 'Quotes', href: '/sales/quotes' }]}>
      <div className="py-12 text-center text-gray-500">Redirecting to quote detail...</div>
    </PageContainer>
  );
}

/* ════════════════════════════════════════════
   QuoteCreatePage — New quote
   ════════════════════════════════════════════ */
export function QuoteCreatePage() {
  const navigate = useNavigate();
  const createMutation = useCreateQuote();
  const { data: contactsRaw = [] } = useContacts();
  const contactOptions = contactsRaw.map(c => ({ value: c.id, label: c.name }));
  const { data: accountsRaw = [] } = useAccounts();
  const accountOptions = accountsRaw.map(a => ({ value: a.code, label: `${a.code} - ${a.name}` }));
  const { data: projectsRaw = [] } = useProjects();
  const projectOptions = projectsRaw.map(p => ({ value: p.id, label: p.name }));
  const { data: trackingCatsRaw = [] } = useTrackingCategories();
  const regionOptions = trackingCatsRaw.flatMap(tc =>
    (tc.options || []).map((opt: { name: string }) => ({ value: opt.name, label: opt.name }))
  );
  const { data: currenciesRaw = [] } = useCurrencies();
  const currencyOptions = currenciesRaw.map(c => ({ value: c.code, label: `${c.code} - ${c.name}` }));
  const { data: taxRatesRaw = [] } = useTaxRates();
  const taxRateOptions = taxRatesRaw.map(tr => ({ value: String(tr.rate), label: tr.name }));
  const { data: products = [] } = useQuery({
    queryKey: ['quotes', 'products'],
    queryFn: () => apiFetch<Array<{ id: string; code: string; name: string; salePrice: number }>>('/products'),
    staleTime: 5 * 60 * 1000,
  });
  const items = products.map(p => ({ code: p.code, name: p.name, salePrice: p.salePrice }));

  const handleSaveDraft = (data: QuoteFormData) => {
    createMutation.mutate(
      {
        contactId: data.contactId,
        date: data.date,
        expiryDate: data.expiryDate,
        title: data.title || undefined,
        summary: data.summary || undefined,
        reference: data.reference || undefined,
        currency: data.currency || 'NZD',
        lineItems: data.lineItems
          .filter(li => li.description.trim() || li.unitPrice > 0)
          .map((li) => ({
            description: li.description,
            quantity: li.quantity,
            unitPrice: li.unitPrice,
            accountCode: li.accountCode,
            taxRate: li.taxRate,
            discount: li.discount,
          })),
      },
      {
        onSuccess: () => {
          showToast('success', 'Quote saved as draft');
          navigate({ to: '/sales/quotes' });
        },
        onError: (error) => {
          showToast('error', `Failed to save quote: ${error.message}`);
        },
      },
    );
  };

  const handleSubmit = (data: QuoteFormData) => {
    createMutation.mutate(
      {
        contactId: data.contactId,
        date: data.date,
        expiryDate: data.expiryDate,
        title: data.title || undefined,
        summary: data.summary || undefined,
        reference: data.reference || undefined,
        currency: data.currency || 'NZD',
        lineItems: data.lineItems
          .filter(li => li.description.trim() || li.unitPrice > 0)
          .map((li) => ({
            description: li.description,
            quantity: li.quantity,
            unitPrice: li.unitPrice,
            accountCode: li.accountCode,
            taxRate: li.taxRate,
            discount: li.discount,
          })),
      },
      {
        onSuccess: async (result) => {
          try {
            await apiPut(`/quotes/${result.id}/status`, { status: 'sent' });
            showToast('success', `Quote ${result.quoteNumber} submitted`);
          } catch {
            showToast('warning', `Quote ${result.quoteNumber} saved as draft (could not submit)`);
          }
          navigate({ to: '/sales/quotes' });
        },
        onError: (error) => {
          showToast('error', `Failed to create quote: ${error.message}`);
        },
      },
    );
  };

  return (
    <PageContainer
      title="New Quote"
      breadcrumbs={[
        { label: 'Quotes', href: '/sales/quotes' },
        { label: 'New Quote' },
      ]}
    >
      <QuoteForm
        onSaveDraft={handleSaveDraft}
        onSubmit={handleSubmit}
        isSaving={createMutation.isPending}
        contacts={contactOptions}
        items={items}
        accountOptions={accountOptions}
        projectOptions={projectOptions}
        regionOptions={regionOptions}
        currencyOptions={currencyOptions}
        taxRateOptions={taxRateOptions}
      />
    </PageContainer>
  );
}
