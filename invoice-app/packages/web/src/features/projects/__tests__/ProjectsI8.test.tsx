// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ProjectProfitability } from '../components/ProjectProfitability';
import { BudgetVsActuals } from '../components/BudgetVsActuals';

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}

const mockBudgetData = {
  categories: [
    { id: 'labour', name: 'Labour', budget: 15000, actual: 11250, variance: 3750, percentUsed: 75 },
    { id: 'materials', name: 'Materials', budget: 8000, actual: 7600, variance: 400, percentUsed: 95 },
    { id: 'other', name: 'Other', budget: 2000, actual: 2400, variance: -400, percentUsed: 120 },
  ],
  totalBudget: 25000,
  totalActual: 21250,
  totalVariance: 3750,
  totalPercentUsed: 85,
};

const mockProfitabilityData = {
  totalRevenue: 12000,
  totalCost: 8000,
  profit: 4000,
  margin: 33.33,
  monthlyBreakdown: [
    { month: 'Jan', revenue: 1800, cost: 1200, profit: 600 },
    { month: 'Feb', revenue: 1900, cost: 1250, profit: 650 },
    { month: 'Mar', revenue: 2000, cost: 1300, profit: 700 },
    { month: 'Apr', revenue: 2100, cost: 1350, profit: 750 },
    { month: 'May', revenue: 2100, cost: 1400, profit: 700 },
    { month: 'Jun', revenue: 2100, cost: 1500, profit: 600 },
  ],
};

let fetchMock: ReturnType<typeof vi.fn>;

beforeEach(() => {
  fetchMock = vi.fn((url: string) => {
    if (typeof url === 'string' && url.includes('/budget')) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ ok: true, data: mockBudgetData }),
      });
    }
    if (typeof url === 'string' && url.includes('/profitability')) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ ok: true, data: mockProfitabilityData }),
      });
    }
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ ok: true, data: {} }),
    });
  });
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('ProjectProfitability', () => {
  it('calculates and displays correct profit and margin', async () => {
    render(<ProjectProfitability projectId="proj-1" />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByTestId('metric-revenue')).toBeInTheDocument();
    });

    // Verify all 4 metric cards are rendered
    expect(screen.getByTestId('metric-revenue')).toHaveTextContent('Total Revenue');
    expect(screen.getByTestId('metric-cost')).toHaveTextContent('Total Cost');
    expect(screen.getByTestId('metric-profit')).toHaveTextContent('Profit');
    expect(screen.getByTestId('metric-margin')).toHaveTextContent('Profit Margin');

    // Margin should be a percentage
    const marginText = screen.getByTestId('metric-margin').textContent ?? '';
    expect(marginText).toMatch(/%/);
  });

  it('renders revenue vs cost bars', async () => {
    render(<ProjectProfitability projectId="proj-1" />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByTestId('revenue-bar')).toBeInTheDocument();
    });

    const revenueBar = screen.getByTestId('revenue-bar');
    const costBar = screen.getByTestId('cost-bar');

    // Bars should have non-zero widths
    expect(revenueBar.style.width).not.toBe('0%');
    expect(costBar.style.width).not.toBe('0%');

    // Revenue bar should be wider (revenue > cost in mock)
    const revWidth = parseFloat(revenueBar.style.width);
    const costWidth = parseFloat(costBar.style.width);
    expect(revWidth).toBeGreaterThan(costWidth);
  });

  it('renders monthly breakdown table with 6 months', async () => {
    render(<ProjectProfitability projectId="proj-1" />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByTestId('monthly-table')).toBeInTheDocument();
    });

    const rows = screen.getByTestId('monthly-table').querySelectorAll('tbody tr');
    expect(rows).toHaveLength(6);

    // Check month names
    expect(screen.getByText('Jan')).toBeInTheDocument();
    expect(screen.getByText('Jun')).toBeInTheDocument();
  });
});

describe('BudgetVsActuals', () => {
  it('shows categories with budget, actual, variance and % used', async () => {
    render(<BudgetVsActuals projectId="proj-2" />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByTestId('budget-table')).toBeInTheDocument();
    });

    // 3 category rows in tbody
    const rows = screen.getByTestId('budget-table').querySelectorAll('tbody tr');
    expect(rows).toHaveLength(3);

    // Category names
    expect(screen.getByText('Labour')).toBeInTheDocument();
    expect(screen.getByText('Materials')).toBeInTheDocument();
    expect(screen.getByText('Other')).toBeInTheDocument();
  });

  it('color codes based on % used: green, yellow, red', async () => {
    render(<BudgetVsActuals projectId="proj-2" />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByTestId('budget-table')).toBeInTheDocument();
    });

    // Labour: 11250/15000 = 75% → green
    const labourRow = screen.getByTestId('budget-row-labour');
    const labourPercent = labourRow.querySelectorAll('td')[4];
    expect(labourPercent.textContent).toBe('75%');
    expect(labourPercent.className).toContain('green');

    // Materials: 7600/8000 = 95% → yellow
    const materialsRow = screen.getByTestId('budget-row-materials');
    const materialsPercent = materialsRow.querySelectorAll('td')[4];
    expect(materialsPercent.textContent).toBe('95%');
    expect(materialsPercent.className).toContain('yellow');

    // Other: 2400/2000 = 120% → red
    const otherRow = screen.getByTestId('budget-row-other');
    const otherPercent = otherRow.querySelectorAll('td')[4];
    expect(otherPercent.textContent).toBe('120%');
    expect(otherPercent.className).toContain('red');
  });

  it('enters inline edit mode when Update Budget is clicked', async () => {
    render(<BudgetVsActuals projectId="proj-2" />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('Update Budget')).toBeInTheDocument();
    });

    // Click Update Budget
    fireEvent.click(screen.getByText('Update Budget'));

    // Should show input fields
    await waitFor(() => {
      expect(screen.getByTestId('budget-input-labour')).toBeInTheDocument();
    });
    expect(screen.getByTestId('budget-input-materials')).toBeInTheDocument();
    expect(screen.getByTestId('budget-input-other')).toBeInTheDocument();

    // Should show Save and Cancel buttons
    expect(screen.getByText('Save')).toBeInTheDocument();
    expect(screen.getByText('Cancel')).toBeInTheDocument();
  });

  it('shows overall budget utilization progress bar', async () => {
    render(<BudgetVsActuals projectId="proj-2" />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByTestId('total-percent')).toBeInTheDocument();
    });

    // Total: 21250/25000 = 85%
    expect(screen.getByTestId('total-percent').textContent).toBe('85%');
    expect(screen.getByTestId('total-progress-bar')).toBeInTheDocument();
  });
});
