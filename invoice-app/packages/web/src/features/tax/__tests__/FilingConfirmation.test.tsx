// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { GSTReturnDetailApi } from '../components/GSTReturnDetailApi';
import type { GSTReturnApi } from '../hooks/useGSTReturns';

const MOCK_DRAFT: GSTReturnApi = {
  id: 'gst-1',
  period: 'Jan-Feb 2026',
  startDate: '2026-01-01',
  endDate: '2026-02-28',
  dueDate: '2026-03-28',
  status: 'draft',
  gstCollected: 18750,
  gstPaid: 12300,
  netGst: 6450,
  filedAt: null,
  createdAt: '2026-01-01T00:00:00Z',
};

const MOCK_FILED: GSTReturnApi = {
  id: 'gst-2',
  period: 'Sep-Oct 2025',
  startDate: '2025-09-01',
  endDate: '2025-10-31',
  dueDate: '2025-11-28',
  status: 'filed',
  gstCollected: 21300,
  gstPaid: 13650,
  netGst: 7650,
  filedAt: '2025-11-25T10:00:00Z',
  createdAt: '2025-09-01T00:00:00Z',
};

describe('GSTReturnDetailApi - Filing', () => {
  it('shows File Return button for draft returns', () => {
    const onFile = vi.fn();
    render(<GSTReturnDetailApi gstReturn={MOCK_DRAFT} onBack={vi.fn()} onFile={onFile} />);
    expect(screen.getByTestId('file-return-button')).toBeInTheDocument();
  });

  it('opens confirmation dialog when File Return is clicked', () => {
    render(<GSTReturnDetailApi gstReturn={MOCK_DRAFT} onBack={vi.fn()} onFile={vi.fn()} />);
    fireEvent.click(screen.getByTestId('file-return-button'));
    expect(screen.getByTestId('file-confirmation-dialog')).toBeInTheDocument();
    expect(screen.getByText('File GST Return')).toBeInTheDocument();
    // Jan-Feb 2026 appears in both the heading and dialog
    expect(screen.getAllByText(/Jan-Feb 2026/).length).toBeGreaterThanOrEqual(2);
  });

  it('calls onFile when confirm is clicked', () => {
    const onFile = vi.fn();
    render(<GSTReturnDetailApi gstReturn={MOCK_DRAFT} onBack={vi.fn()} onFile={onFile} />);
    fireEvent.click(screen.getByTestId('file-return-button'));
    fireEvent.click(screen.getByTestId('confirm-file-button'));
    expect(onFile).toHaveBeenCalledWith('gst-1');
  });

  it('closes dialog when cancel is clicked', () => {
    render(<GSTReturnDetailApi gstReturn={MOCK_DRAFT} onBack={vi.fn()} onFile={vi.fn()} />);
    fireEvent.click(screen.getByTestId('file-return-button'));
    expect(screen.getByTestId('file-confirmation-dialog')).toBeInTheDocument();
    fireEvent.click(screen.getByTestId('cancel-file-button'));
    expect(screen.queryByTestId('file-confirmation-dialog')).not.toBeInTheDocument();
  });

  it('displays filing status for filed returns with confirmation number', () => {
    render(
      <GSTReturnDetailApi
        gstReturn={MOCK_FILED}
        onBack={vi.fn()}
        filingConfirmation="IRD-ABC123"
      />,
    );
    expect(screen.getByTestId('filing-status')).toBeInTheDocument();
    expect(screen.getByTestId('filing-confirmation-number')).toHaveTextContent('IRD-ABC123');
  });

  it('does not show filing status for draft returns', () => {
    render(<GSTReturnDetailApi gstReturn={MOCK_DRAFT} onBack={vi.fn()} />);
    expect(screen.queryByTestId('filing-status')).not.toBeInTheDocument();
  });
});
