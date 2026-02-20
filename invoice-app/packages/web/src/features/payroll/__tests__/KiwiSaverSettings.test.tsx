// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';

const mockApiFetch = vi.fn();
const mockApiPut = vi.fn();

vi.mock('../../../lib/api-helpers', () => ({
  apiFetch: (...args: unknown[]) => mockApiFetch(...args),
  apiPut: (...args: unknown[]) => mockApiPut(...args),
}));

import { KiwiSaverSettings } from '../components/KiwiSaverSettings';
import type { KiwiSaverSettings as KSSettings } from '../hooks/useKiwiSaver';

const SAMPLE_KIWISAVER: KSSettings = {
  employeeId: 'emp-001',
  employeeName: 'Sarah Chen',
  employeeRate: 3,
  employerRate: 3,
  optedOut: false,
  esctRate: 33,
  annualSalary: 95000,
};

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  });
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}

describe('KiwiSaverSettings', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows loading state initially', () => {
    mockApiFetch.mockReturnValue(new Promise(() => {}));
    render(<KiwiSaverSettings employeeId="emp-001" />, { wrapper: createWrapper() });
    expect(screen.getByTestId('kiwisaver-loading')).toBeInTheDocument();
  });

  it('renders settings after loading', async () => {
    mockApiFetch.mockResolvedValueOnce(SAMPLE_KIWISAVER);
    render(<KiwiSaverSettings employeeId="emp-001" />, { wrapper: createWrapper() });

    expect(await screen.findByTestId('kiwisaver-settings')).toBeInTheDocument();
    expect(screen.getByText('KiwiSaver Settings')).toBeInTheDocument();
    expect(screen.getByText('Sarah Chen')).toBeInTheDocument();
  });

  it('renders employee contribution rate selector', async () => {
    mockApiFetch.mockResolvedValueOnce(SAMPLE_KIWISAVER);
    render(<KiwiSaverSettings employeeId="emp-001" />, { wrapper: createWrapper() });

    await screen.findByTestId('kiwisaver-settings');
    expect(screen.getByText('Employee Contribution Rate')).toBeInTheDocument();
    // Select should show current rate value
    const select = screen.getByRole('combobox');
    expect(select).toHaveValue('3');
  });

  it('renders employer rate info', async () => {
    mockApiFetch.mockResolvedValueOnce(SAMPLE_KIWISAVER);
    render(<KiwiSaverSettings employeeId="emp-001" />, { wrapper: createWrapper() });

    await screen.findByTestId('kiwisaver-settings');
    expect(screen.getByText(/Employer Contribution Rate:/)).toBeInTheDocument();
    // '3%' appears in both the select options and employer rate — use getAllByText
    const threePercent = screen.getAllByText('3%');
    expect(threePercent.length).toBeGreaterThanOrEqual(2);
  });

  it('renders ESCT rate', async () => {
    mockApiFetch.mockResolvedValueOnce(SAMPLE_KIWISAVER);
    render(<KiwiSaverSettings employeeId="emp-001" />, { wrapper: createWrapper() });

    await screen.findByTestId('kiwisaver-settings');
    expect(screen.getByTestId('esct-rate')).toHaveTextContent('33%');
  });

  it('renders opt-out button', async () => {
    mockApiFetch.mockResolvedValueOnce(SAMPLE_KIWISAVER);
    render(<KiwiSaverSettings employeeId="emp-001" />, { wrapper: createWrapper() });

    await screen.findByTestId('kiwisaver-settings');
    expect(screen.getByTestId('kiwisaver-opt-out-btn')).toHaveTextContent('Opt Out of KiwiSaver');
  });

  it('shows confirmation dialog when opt-out clicked', async () => {
    const user = userEvent.setup();
    mockApiFetch.mockResolvedValueOnce(SAMPLE_KIWISAVER);
    render(<KiwiSaverSettings employeeId="emp-001" />, { wrapper: createWrapper() });

    await screen.findByTestId('kiwisaver-settings');
    await user.click(screen.getByTestId('kiwisaver-opt-out-btn'));
    expect(screen.getByText('Confirm KiwiSaver Opt-Out')).toBeInTheDocument();
  });

  it('shows "Opt Back In" when opted out', async () => {
    mockApiFetch.mockResolvedValueOnce({ ...SAMPLE_KIWISAVER, optedOut: true });
    render(<KiwiSaverSettings employeeId="emp-001" />, { wrapper: createWrapper() });

    await screen.findByTestId('kiwisaver-settings');
    expect(screen.getByTestId('kiwisaver-opt-out-btn')).toHaveTextContent('Opt Back In');
    expect(screen.getByTestId('opted-out-badge')).toHaveTextContent('Opted Out');
  });
});
