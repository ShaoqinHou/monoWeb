// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ImportWizard } from '../components/ImportWizard';
import type { ReactNode } from 'react';

beforeEach(() => {
  vi.restoreAllMocks();
  // Mock fetch for import API
  global.fetch = vi.fn().mockResolvedValue({
    ok: true,
    status: 200,
    json: async () => ({ ok: true, data: { imported: 2 } }),
  }) as unknown as typeof fetch;
});

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    );
  };
}

const sampleCsv = `Date,Description,Amount
2026-01-15,Payment from Client,1500
2026-01-16,Office rent,-2000`;

/** Helper: advance wizard to the given step */
async function advanceToStep(step: number) {
  if (step >= 2) {
    const textarea = screen.getByTestId('csv-text-input');
    fireEvent.change(textarea, { target: { value: sampleCsv } });
    fireEvent.click(screen.getByTestId('wizard-next-btn'));
    await waitFor(() => {
      expect(screen.getByTestId('wizard-step-2-active')).toBeInTheDocument();
    });
  }
  if (step >= 3) {
    fireEvent.click(screen.getByTestId('wizard-next-btn'));
    await waitFor(() => {
      expect(screen.getByTestId('wizard-step-3-active')).toBeInTheDocument();
    });
  }
  if (step >= 4) {
    fireEvent.click(screen.getByTestId('wizard-next-btn'));
    await waitFor(() => {
      expect(screen.getByTestId('wizard-step-4-active')).toBeInTheDocument();
    });
  }
}

describe('ImportWizard', () => {
  it('renders step 1 (upload) initially', () => {
    render(
      <ImportWizard open={true} onClose={() => {}} accountId="acc-1" />,
      { wrapper: createWrapper() },
    );
    // Step 1 is active
    expect(screen.getByTestId('wizard-step-1-active')).toBeInTheDocument();
    // Should have a textarea for CSV data
    expect(screen.getByTestId('csv-text-input')).toBeInTheDocument();
  });

  it('does not render when open is false', () => {
    render(
      <ImportWizard open={false} onClose={() => {}} accountId="acc-1" />,
      { wrapper: createWrapper() },
    );
    expect(screen.queryByTestId('csv-text-input')).not.toBeInTheDocument();
  });

  it('advances to step 2 after CSV paste and Next', async () => {
    render(
      <ImportWizard open={true} onClose={() => {}} accountId="acc-1" />,
      { wrapper: createWrapper() },
    );

    await advanceToStep(2);

    // Step 2 heading should be visible
    expect(screen.getByText('Column Mapping')).toBeInTheDocument();
  });

  it('shows column mapping dropdowns in step 2', async () => {
    render(
      <ImportWizard open={true} onClose={() => {}} accountId="acc-1" />,
      { wrapper: createWrapper() },
    );

    await advanceToStep(2);

    expect(screen.getByLabelText(/date/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/amount/i)).toBeInTheDocument();
  });

  it('shows parsed transactions in step 3 (review)', async () => {
    render(
      <ImportWizard open={true} onClose={() => {}} accountId="acc-1" />,
      { wrapper: createWrapper() },
    );

    await advanceToStep(3);

    // Step 3 heading
    expect(screen.getByText('Review Transactions')).toBeInTheDocument();
    // Should display the parsed transaction descriptions
    expect(screen.getByText('Payment from Client')).toBeInTheDocument();
    expect(screen.getByText('Office rent')).toBeInTheDocument();
  });

  it('final step shows summary with import button', async () => {
    render(
      <ImportWizard open={true} onClose={() => {}} accountId="acc-1" />,
      { wrapper: createWrapper() },
    );

    await advanceToStep(4);

    // Step 4: confirm
    expect(screen.getByText('Confirm Import')).toBeInTheDocument();
    expect(screen.getByTestId('wizard-import-btn')).toBeInTheDocument();
    // Should show count in the summary text
    expect(screen.getByText(/ready to import/i)).toBeInTheDocument();
  });

  it('allows going back to previous steps', async () => {
    render(
      <ImportWizard open={true} onClose={() => {}} accountId="acc-1" />,
      { wrapper: createWrapper() },
    );

    // Advance to step 2
    await advanceToStep(2);
    expect(screen.getByText('Column Mapping')).toBeInTheDocument();

    // Click Back
    fireEvent.click(screen.getByTestId('wizard-back-btn'));

    await waitFor(() => {
      expect(screen.getByTestId('wizard-step-1-active')).toBeInTheDocument();
    });
    // Should be back on step 1 with the textarea visible
    expect(screen.getByTestId('csv-text-input')).toBeInTheDocument();
  });

  it('calls onClose when Cancel is clicked', () => {
    const onClose = vi.fn();
    render(
      <ImportWizard open={true} onClose={onClose} accountId="acc-1" />,
      { wrapper: createWrapper() },
    );

    fireEvent.click(screen.getByText('Cancel'));
    expect(onClose).toHaveBeenCalled();
  });

  it('shows step indicators', () => {
    render(
      <ImportWizard open={true} onClose={() => {}} accountId="acc-1" />,
      { wrapper: createWrapper() },
    );

    // Should show step number indicators (1, 2, 3, 4)
    expect(screen.getByTestId('wizard-step-1-active')).toBeInTheDocument();
    expect(screen.getByTestId('wizard-step-2')).toBeInTheDocument();
    expect(screen.getByTestId('wizard-step-3')).toBeInTheDocument();
    expect(screen.getByTestId('wizard-step-4')).toBeInTheDocument();
  });

  it('disables Next button when no CSV data entered', () => {
    render(
      <ImportWizard open={true} onClose={() => {}} accountId="acc-1" />,
      { wrapper: createWrapper() },
    );

    const nextBtn = screen.getByTestId('wizard-next-btn');
    expect(nextBtn).toBeDisabled();
  });
});
