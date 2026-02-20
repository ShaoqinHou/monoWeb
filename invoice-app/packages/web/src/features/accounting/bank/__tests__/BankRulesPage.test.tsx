// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

vi.mock('../../../../components/layout/PageContainer', () => ({
  PageContainer: ({ children, title }: { children: React.ReactNode; title: string }) => (
    <div data-testid="page-container">
      <h1>{title}</h1>
      {children}
    </div>
  ),
}));

vi.mock('../../../../components/ui/Button', () => ({
  Button: (props: Record<string, unknown>) => (
    <button
      type={((props.type as string) || 'button') as 'button' | 'submit' | 'reset'}
      onClick={props.onClick as () => void}
      disabled={!!props.disabled}
      data-testid={props['data-testid'] as string}
    >
      {props.children as React.ReactNode}
    </button>
  ),
}));

vi.mock('../../../../components/ui/Input', () => ({
  Input: (props: Record<string, unknown>) => (
    <input
      value={props.value as string}
      onChange={props.onChange as () => void}
      placeholder={props.placeholder as string}
      data-testid={props['data-testid'] as string}
    />
  ),
}));

import { BankRulesPage } from '../routes/BankRulesPage';

beforeEach(() => {
  vi.clearAllMocks();
});

describe('BankRulesPage', () => {
  it('renders page title', () => {
    render(<BankRulesPage />);
    expect(screen.getByText('Bank rules')).toBeInTheDocument();
  });

  it('renders help banner with video link', () => {
    render(<BankRulesPage />);
    expect(screen.getByTestId('bank-rules-help-banner')).toBeInTheDocument();
    expect(screen.getByText(/Automate your bank reconciliation/)).toBeInTheDocument();
    expect(screen.getByTestId('bank-rules-video-link')).toBeInTheDocument();
    expect(screen.getByText(/Watch video/)).toBeInTheDocument();
  });

  it('renders three tabs: spend, receive, transfer', () => {
    render(<BankRulesPage />);
    expect(screen.getByTestId('bank-rules-tabs')).toBeInTheDocument();
    expect(screen.getByTestId('tab-spend')).toBeInTheDocument();
    expect(screen.getByTestId('tab-receive')).toBeInTheDocument();
    expect(screen.getByTestId('tab-transfer')).toBeInTheDocument();
    expect(screen.getByText('Spend money rules')).toBeInTheDocument();
    expect(screen.getByText('Receive money rules')).toBeInTheDocument();
    expect(screen.getByText('Transfer money rules')).toBeInTheDocument();
  });

  it('defaults to spend money rules tab with rules visible', () => {
    render(<BankRulesPage />);
    expect(screen.getByTestId('rule-row-r1')).toBeInTheDocument();
    expect(screen.getByTestId('rule-row-r2')).toBeInTheDocument();
    expect(screen.getByText('Office Supplies')).toBeInTheDocument();
    expect(screen.getByText('Internet Subscription')).toBeInTheDocument();
  });

  it('renders numbered badges on rules', () => {
    render(<BankRulesPage />);
    expect(screen.getByTestId('rule-badge-r1')).toHaveTextContent('1');
    expect(screen.getByTestId('rule-badge-r2')).toHaveTextContent('2');
  });

  it('renders drag handles on rules', () => {
    render(<BankRulesPage />);
    expect(screen.getByTestId('rule-drag-r1')).toBeInTheDocument();
    expect(screen.getByTestId('rule-drag-r2')).toBeInTheDocument();
  });

  it('switches to receive tab and shows receive rules', () => {
    render(<BankRulesPage />);
    fireEvent.click(screen.getByTestId('tab-receive'));
    expect(screen.getByTestId('rule-row-r3')).toBeInTheDocument();
    expect(screen.getByText('Client Payment')).toBeInTheDocument();
    expect(screen.queryByText('Office Supplies')).not.toBeInTheDocument();
  });

  it('switches to transfer tab and shows empty state', () => {
    render(<BankRulesPage />);
    fireEvent.click(screen.getByTestId('tab-transfer'));
    expect(screen.getByTestId('no-rules')).toBeInTheDocument();
    expect(screen.getByText(/No transfer money rules found/)).toBeInTheDocument();
  });

  it('renders search input', () => {
    render(<BankRulesPage />);
    expect(screen.getByTestId('bank-rules-search')).toBeInTheDocument();
    expect(screen.getByTestId('bank-rules-search-input')).toBeInTheDocument();
  });

  it('filters rules by search text', () => {
    render(<BankRulesPage />);
    const input = screen.getByTestId('bank-rules-search-input');
    fireEvent.change(input, { target: { value: 'Office' } });
    expect(screen.getByText('Office Supplies')).toBeInTheDocument();
    expect(screen.queryByText('Internet Subscription')).not.toBeInTheDocument();
  });

  it('shows Clear button when search has text and clears on click', () => {
    render(<BankRulesPage />);
    const input = screen.getByTestId('bank-rules-search-input');
    expect(screen.queryByTestId('bank-rules-search-clear')).not.toBeInTheDocument();

    fireEvent.change(input, { target: { value: 'ISP' } });
    expect(screen.getByTestId('bank-rules-search-clear')).toBeInTheDocument();

    fireEvent.click(screen.getByTestId('bank-rules-search-clear'));
    // After clearing, both rules should be visible again
    expect(screen.getByText('Office Supplies')).toBeInTheDocument();
    expect(screen.getByText('Internet Subscription')).toBeInTheDocument();
  });
});
