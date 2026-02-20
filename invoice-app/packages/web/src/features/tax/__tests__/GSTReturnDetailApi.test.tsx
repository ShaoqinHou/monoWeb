// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { GSTReturnDetailApi } from '../components/GSTReturnDetailApi';
import type { GSTReturnApi } from '../hooks/useGSTReturns';

const MOCK_DRAFT_RETURN: GSTReturnApi = {
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

const MOCK_FILED_RETURN: GSTReturnApi = {
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

describe('GSTReturnDetailApi', () => {
  it('renders the period heading', () => {
    render(<GSTReturnDetailApi gstReturn={MOCK_DRAFT_RETURN} onBack={vi.fn()} />);
    expect(screen.getByText('GST Return: Jan-Feb 2026')).toBeInTheDocument();
  });

  it('renders the Draft status badge', () => {
    render(<GSTReturnDetailApi gstReturn={MOCK_DRAFT_RETURN} onBack={vi.fn()} />);
    expect(screen.getByText('Draft')).toBeInTheDocument();
  });

  it('renders the Filed status badge', () => {
    render(<GSTReturnDetailApi gstReturn={MOCK_FILED_RETURN} onBack={vi.fn()} />);
    expect(screen.getByText('Filed')).toBeInTheDocument();
  });

  it('displays GST collected value', () => {
    render(<GSTReturnDetailApi gstReturn={MOCK_DRAFT_RETURN} onBack={vi.fn()} />);
    const collected = screen.getByTestId('gst-collected');
    expect(collected).toHaveTextContent('$18,750.00');
  });

  it('displays GST paid value', () => {
    render(<GSTReturnDetailApi gstReturn={MOCK_DRAFT_RETURN} onBack={vi.fn()} />);
    const paid = screen.getByTestId('gst-paid');
    expect(paid).toHaveTextContent('$12,300.00');
  });

  it('displays net GST value', () => {
    render(<GSTReturnDetailApi gstReturn={MOCK_DRAFT_RETURN} onBack={vi.fn()} />);
    const net = screen.getByTestId('net-gst');
    expect(net).toHaveTextContent('$6,450.00');
  });

  it('renders Back button and calls onBack', () => {
    const onBack = vi.fn();
    render(<GSTReturnDetailApi gstReturn={MOCK_DRAFT_RETURN} onBack={onBack} />);
    const backBtn = screen.getByTestId('back-button');
    expect(backBtn).toHaveTextContent('Back to returns');
    fireEvent.click(backBtn);
    expect(onBack).toHaveBeenCalled();
  });

  it('renders File Return button for draft returns', () => {
    const onFile = vi.fn();
    render(
      <GSTReturnDetailApi
        gstReturn={MOCK_DRAFT_RETURN}
        onBack={vi.fn()}
        onFile={onFile}
      />,
    );
    const fileBtn = screen.getByTestId('file-return-button');
    expect(fileBtn).toHaveTextContent('File Return');
    // Clicking opens confirmation dialog; confirm to trigger onFile
    fireEvent.click(fileBtn);
    fireEvent.click(screen.getByTestId('confirm-file-button'));
    expect(onFile).toHaveBeenCalledWith('gst-1');
  });

  it('renders Delete button for draft returns', () => {
    const onDelete = vi.fn();
    render(
      <GSTReturnDetailApi
        gstReturn={MOCK_DRAFT_RETURN}
        onBack={vi.fn()}
        onDelete={onDelete}
      />,
    );
    const deleteBtn = screen.getByTestId('delete-return-button');
    fireEvent.click(deleteBtn);
    expect(onDelete).toHaveBeenCalledWith('gst-1');
  });

  it('does not render File/Delete buttons for filed returns', () => {
    render(
      <GSTReturnDetailApi
        gstReturn={MOCK_FILED_RETURN}
        onBack={vi.fn()}
        onFile={vi.fn()}
        onDelete={vi.fn()}
      />,
    );
    expect(screen.queryByTestId('file-return-button')).not.toBeInTheDocument();
    expect(screen.queryByTestId('delete-return-button')).not.toBeInTheDocument();
  });

  it('shows filed date for filed returns', () => {
    render(<GSTReturnDetailApi gstReturn={MOCK_FILED_RETURN} onBack={vi.fn()} />);
    expect(screen.getByTestId('filed-date')).toBeInTheDocument();
  });

  it('does not show filed date for draft returns', () => {
    render(<GSTReturnDetailApi gstReturn={MOCK_DRAFT_RETURN} onBack={vi.fn()} />);
    expect(screen.queryByTestId('filed-date')).not.toBeInTheDocument();
  });

  it('shows due date', () => {
    render(<GSTReturnDetailApi gstReturn={MOCK_DRAFT_RETURN} onBack={vi.fn()} />);
    expect(screen.getByTestId('due-date')).toBeInTheDocument();
  });

  it('shows period dates', () => {
    render(<GSTReturnDetailApi gstReturn={MOCK_DRAFT_RETURN} onBack={vi.fn()} />);
    expect(screen.getByTestId('period-dates')).toBeInTheDocument();
  });
});
