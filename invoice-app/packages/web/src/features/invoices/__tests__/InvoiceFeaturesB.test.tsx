// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { InvoiceForm } from '../components/InvoiceForm';
import { InvoiceDetail } from '../components/InvoiceDetail';
import { DeliveryAddressSelect } from '../components/DeliveryAddressSelect';
import { BrandingThemeSelect, BRANDING_THEMES } from '../components/BrandingThemeSelect';
import { RecordPaymentDialog } from '../components/RecordPaymentDialog';
import { InvoiceAttachments } from '../components/InvoiceAttachments';
import type { Invoice } from '../types';

const TEST_CONTACTS = [
  { value: 'ct-1', label: 'Acme Corporation' },
  { value: 'ct-2', label: 'Bay Industries Ltd' },
  { value: 'ct-3', label: 'Creative Solutions NZ' },
];

const TEST_DELIVERY_ADDRESSES = [
  { id: 'addr-1', label: 'Head Office', line1: '100 Queen Street', city: 'Auckland', postalCode: '1010' },
  { id: 'addr-2', label: 'Warehouse', line1: '50 Industrial Ave', city: 'Hamilton', postalCode: '3200' },
];

const SAMPLE_INVOICE: Invoice = {
  id: 'inv-10',
  invoiceNumber: 'INV-0010',
  contactId: 'ct-1',
  contactName: 'Acme Corporation',
  status: 'approved',
  amountType: 'exclusive',
  currency: 'NZD',
  date: '2024-01-15',
  dueDate: '2024-02-14',
  reference: 'PO-100',
  lineItems: [
    {
      id: 'li-1',
      description: 'Web Development',
      quantity: 10,
      unitPrice: 150,
      accountCode: '200',
      taxRate: 15,
      taxAmount: 225,
      lineAmount: 1500,
      discount: 0,
    },
  ],
  subTotal: 1500,
  totalTax: 225,
  total: 1725,
  amountDue: 1725,
  amountPaid: 0,
  createdAt: '2024-01-15T10:00:00.000Z',
  updatedAt: '2024-01-15T10:00:00.000Z',
};

/* ================================================================
   1. DELIVERY ADDRESS SELECT
   ================================================================ */
describe('DeliveryAddressSelect', () => {
  it('renders addresses for a known contact', () => {
    render(
      <DeliveryAddressSelect
        contactId="ct-1"
        addresses={TEST_DELIVERY_ADDRESSES}
        value=""
        onChange={vi.fn()}
      />,
    );
    const select = screen.getByTestId('delivery-address-select');
    expect(select).toBeInTheDocument();
    // Should have "No delivery address" + 2 addresses
    const options = select.querySelectorAll('option');
    expect(options).toHaveLength(3);
  });

  it('shows empty message for contact with no addresses', () => {
    render(
      <DeliveryAddressSelect
        contactId="ct-999"
        addresses={[]}
        value=""
        onChange={vi.fn()}
      />,
    );
    expect(screen.getByTestId('delivery-address-empty')).toBeInTheDocument();
    expect(screen.getByText('No delivery addresses for this contact')).toBeInTheDocument();
  });
});

/* ================================================================
   2. BRANDING THEME SELECT
   ================================================================ */
describe('BrandingThemeSelect', () => {
  it('renders all branding themes', () => {
    render(
      <BrandingThemeSelect value="theme-default" onChange={vi.fn()} />,
    );
    const select = screen.getByTestId('branding-theme-select');
    expect(select).toBeInTheDocument();
    const options = select.querySelectorAll('option');
    expect(options).toHaveLength(BRANDING_THEMES.length);
  });

  it('calls onChange when theme is selected', () => {
    const onChange = vi.fn();
    render(
      <BrandingThemeSelect value="theme-default" onChange={onChange} />,
    );
    fireEvent.change(screen.getByTestId('branding-theme-select'), {
      target: { value: 'theme-modern' },
    });
    expect(onChange).toHaveBeenCalledWith('theme-modern');
  });
});

/* ================================================================
   3. PARTIAL PAYMENTS
   ================================================================ */
describe('RecordPaymentDialog — Partial Payments', () => {
  it('shows remaining amount for partial payment', () => {
    render(
      <RecordPaymentDialog
        open={true}
        onClose={vi.fn()}
        onRecord={vi.fn()}
        amountDue={1000}
        currency="NZD"
      />,
    );
    // Change to partial amount
    fireEvent.change(screen.getByTestId('payment-amount-input'), {
      target: { value: '400' },
    });
    expect(screen.getByTestId('partial-payment-info')).toBeInTheDocument();
    expect(screen.getByTestId('remaining-amount')).toHaveTextContent('$600.00');
  });

  it('calls onRecord with partial payment amount', () => {
    const onRecord = vi.fn();
    render(
      <RecordPaymentDialog
        open={true}
        onClose={vi.fn()}
        onRecord={onRecord}
        amountDue={1000}
        currency="NZD"
      />,
    );
    fireEvent.change(screen.getByTestId('payment-amount-input'), {
      target: { value: '250' },
    });
    fireEvent.click(screen.getByTestId('payment-record-button'));
    expect(onRecord).toHaveBeenCalledWith(
      expect.objectContaining({ amount: 250 }),
    );
  });

  it('shows existing payments list', () => {
    render(
      <RecordPaymentDialog
        open={true}
        onClose={vi.fn()}
        onRecord={vi.fn()}
        amountDue={500}
        currency="NZD"
        existingPayments={[
          { amount: 300, date: '2024-01-20', reference: 'PAY-001' },
          { amount: 200, date: '2024-01-25', reference: 'PAY-002' },
        ]}
      />,
    );
    expect(screen.getByTestId('existing-payments')).toBeInTheDocument();
    expect(screen.getByTestId('existing-payment-0')).toBeInTheDocument();
    expect(screen.getByTestId('existing-payment-1')).toBeInTheDocument();
  });
});

/* ================================================================
   4. OVERPAYMENTS / PREPAYMENTS
   ================================================================ */
describe('RecordPaymentDialog — Overpayments', () => {
  it('shows overpayment warning when amount > amountDue', () => {
    render(
      <RecordPaymentDialog
        open={true}
        onClose={vi.fn()}
        onRecord={vi.fn()}
        amountDue={500}
        currency="NZD"
      />,
    );
    fireEvent.change(screen.getByTestId('payment-amount-input'), {
      target: { value: '750' },
    });
    expect(screen.getByTestId('overpayment-warning')).toBeInTheDocument();
    expect(screen.getByTestId('overpayment-amount')).toHaveTextContent('$250.00');
  });

  it('shows overpayment on InvoiceDetail', () => {
    render(
      <InvoiceDetail
        invoice={{ ...SAMPLE_INVOICE, amountPaid: 2000, amountDue: 0 }}
        onTransition={vi.fn()}
        onEdit={vi.fn()}
        overpaymentAmount={275}
      />,
    );
    expect(screen.getByTestId('detail-overpayment')).toBeInTheDocument();
    expect(screen.getByTestId('detail-overpayment')).toHaveTextContent('$275.00');
  });
});

/* ================================================================
   5. INVOICE ATTACHMENTS
   ================================================================ */
describe('InvoiceAttachments', () => {
  it('renders attachment label and attach button', () => {
    render(
      <InvoiceAttachments files={[]} onAdd={vi.fn()} onRemove={vi.fn()} />,
    );
    expect(screen.getByTestId('invoice-attachments')).toBeInTheDocument();
    expect(screen.getByText('Attachments')).toBeInTheDocument();
    expect(screen.getByText('Attach file')).toBeInTheDocument();
  });

  it('renders attached files and allows removal', () => {
    const onRemove = vi.fn();
    render(
      <InvoiceAttachments
        files={[
          { name: 'receipt.pdf', url: 'data:application/pdf;base64,abc' },
          { name: 'photo.jpg', url: 'data:image/jpeg;base64,def' },
        ]}
        onAdd={vi.fn()}
        onRemove={onRemove}
      />,
    );
    expect(screen.getByText('receipt.pdf')).toBeInTheDocument();
    expect(screen.getByText('photo.jpg')).toBeInTheDocument();
    // Click remove on first file
    fireEvent.click(screen.getByLabelText('Remove receipt.pdf'));
    expect(onRemove).toHaveBeenCalledWith(0);
  });
});

/* ================================================================
   6. INVOICE NOTES ON DETAIL
   ================================================================ */
describe('InvoiceDetail — Notes', () => {
  it('displays notes section when notes are provided', () => {
    render(
      <InvoiceDetail
        invoice={SAMPLE_INVOICE}
        onTransition={vi.fn()}
        onEdit={vi.fn()}
        notes="Please pay by bank transfer to account 12-3456-7890123-00"
      />,
    );
    expect(screen.getByTestId('detail-notes')).toBeInTheDocument();
    expect(screen.getByText('Notes')).toBeInTheDocument();
    expect(screen.getByText('Please pay by bank transfer to account 12-3456-7890123-00')).toBeInTheDocument();
  });

  it('does not display notes section when notes are empty', () => {
    render(
      <InvoiceDetail
        invoice={SAMPLE_INVOICE}
        onTransition={vi.fn()}
        onEdit={vi.fn()}
      />,
    );
    expect(screen.queryByTestId('detail-notes')).not.toBeInTheDocument();
  });
});

/* ================================================================
   7. EXPECTED PAYMENT DATE
   ================================================================ */
describe('Expected Payment Date', () => {
  it('renders expected payment date field on InvoiceForm', () => {
    render(
      <InvoiceForm
        contacts={TEST_CONTACTS}
        onSaveDraft={vi.fn()}
        onSubmit={vi.fn()}
        initialData={{ contactId: 'ct-1' }}
      />,
    );
    expect(screen.getByTestId('form-expected-payment-date')).toBeInTheDocument();
  });

  it('includes expected payment date in form data', () => {
    const onSaveDraft = vi.fn();
    render(
      <InvoiceForm
        contacts={TEST_CONTACTS}
        onSaveDraft={onSaveDraft}
        onSubmit={vi.fn()}
        initialData={{ contactId: 'ct-1' }}
      />,
    );
    // Add a line item description so validation passes
    fireEvent.change(screen.getByTestId('line-description-0'), {
      target: { value: 'Test item' },
    });
    fireEvent.change(screen.getByTestId('form-expected-payment-date'), {
      target: { value: '2024-03-15' },
    });
    fireEvent.click(screen.getByTestId('save-draft-button'));
    expect(onSaveDraft).toHaveBeenCalledTimes(1);
    expect(onSaveDraft.mock.calls[0][0].expectedPaymentDate).toBe('2024-03-15');
  });

  it('displays expected payment date on InvoiceDetail', () => {
    render(
      <InvoiceDetail
        invoice={SAMPLE_INVOICE}
        onTransition={vi.fn()}
        onEdit={vi.fn()}
        expectedPaymentDate="2024-03-15"
      />,
    );
    expect(screen.getByTestId('detail-expected-payment-date')).toBeInTheDocument();
    expect(screen.getByText('Expected Payment Date')).toBeInTheDocument();
  });
});

/* ================================================================
   8. FORM INCLUDES NEW FIELDS (delivery addr, branding theme)
   ================================================================ */
describe('InvoiceForm — New Fields Integration', () => {
  it('includes deliveryAddressId and brandingThemeId in form data', () => {
    const onSaveDraft = vi.fn();
    render(
      <InvoiceForm
        contacts={TEST_CONTACTS}
        onSaveDraft={onSaveDraft}
        onSubmit={vi.fn()}
        initialData={{ contactId: 'ct-1', deliveryAddressId: 'addr-1' }}
      />,
    );
    // Add a line item description so validation passes
    fireEvent.change(screen.getByTestId('line-description-0'), {
      target: { value: 'Test item' },
    });
    // Change branding theme
    fireEvent.change(screen.getByTestId('branding-theme-select'), {
      target: { value: 'theme-modern' },
    });
    fireEvent.click(screen.getByTestId('save-draft-button'));
    const data = onSaveDraft.mock.calls[0][0];
    expect(data.deliveryAddressId).toBe('addr-1');
    expect(data.brandingThemeId).toBe('theme-modern');
  });
});
