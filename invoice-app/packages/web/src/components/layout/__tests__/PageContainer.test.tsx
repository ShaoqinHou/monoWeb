// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PageContainer } from '../PageContainer';

describe('PageContainer', () => {
  it('renders the page title', () => {
    render(
      <PageContainer title="Invoices">
        <p>Content</p>
      </PageContainer>
    );
    expect(screen.getByText('Invoices')).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
  });

  it('renders children content', () => {
    render(
      <PageContainer title="Test">
        <p>Page content here</p>
      </PageContainer>
    );
    expect(screen.getByText('Page content here')).toBeInTheDocument();
  });

  it('renders breadcrumbs when provided', () => {
    render(
      <PageContainer
        title="Invoice #123"
        breadcrumbs={[
          { label: 'Sales', href: '/sales' },
          { label: 'Invoices', href: '/sales/invoices' },
          { label: 'Invoice #123' },
        ]}
      >
        <p>Content</p>
      </PageContainer>
    );
    const breadcrumbNav = screen.getByLabelText('Breadcrumb');
    expect(breadcrumbNav).toBeInTheDocument();
    expect(screen.getByText('Sales')).toBeInTheDocument();
    expect(screen.getByText('Invoices')).toBeInTheDocument();
    // "Invoice #123" appears in both breadcrumb and title, so check within breadcrumb nav
    const breadcrumbTexts = breadcrumbNav.querySelectorAll('li');
    expect(breadcrumbTexts).toHaveLength(3);
  });

  it('renders breadcrumb links for non-last items with href', () => {
    render(
      <PageContainer
        title="Detail"
        breadcrumbs={[
          { label: 'Home', href: '/' },
          { label: 'Detail' },
        ]}
      >
        <p>Content</p>
      </PageContainer>
    );
    const homeLink = screen.getByText('Home').closest('a');
    expect(homeLink).toBeInTheDocument();
    expect(homeLink!.getAttribute('href')).toBe('/');
  });

  it('does not render breadcrumb nav when breadcrumbs is empty', () => {
    render(
      <PageContainer title="Test" breadcrumbs={[]}>
        <p>Content</p>
      </PageContainer>
    );
    expect(screen.queryByLabelText('Breadcrumb')).toBeNull();
  });

  it('does not render breadcrumb nav when breadcrumbs not provided', () => {
    render(
      <PageContainer title="Test">
        <p>Content</p>
      </PageContainer>
    );
    expect(screen.queryByLabelText('Breadcrumb')).toBeNull();
  });

  it('renders actions when provided', () => {
    render(
      <PageContainer
        title="Invoices"
        actions={<button>New Invoice</button>}
      >
        <p>Content</p>
      </PageContainer>
    );
    expect(screen.getByText('New Invoice')).toBeInTheDocument();
  });

  it('does not render actions container when no actions', () => {
    const { container } = render(
      <PageContainer title="Test">
        <p>Content</p>
      </PageContainer>
    );
    // The actions wrapper div should not be in the DOM
    const heading = screen.getByRole('heading', { level: 1 });
    const headerRow = heading.parentElement!;
    // Only the h1 should be a child, no actions div
    expect(headerRow.children.length).toBe(1);
  });

  it('renders last breadcrumb as text (not link) even if it has href', () => {
    render(
      <PageContainer
        title="Detail"
        breadcrumbs={[
          { label: 'Home', href: '/' },
          { label: 'Detail', href: '/detail' },
        ]}
      >
        <p>Content</p>
      </PageContainer>
    );
    // Last breadcrumb should be a span, not a link — find within breadcrumb nav
    const breadcrumbNav = screen.getByLabelText('Breadcrumb');
    const lastLi = breadcrumbNav.querySelectorAll('li')[1];
    const span = lastLi.querySelector('span');
    expect(span).toBeInTheDocument();
    expect(span!.textContent).toBe('Detail');
    expect(lastLi.querySelector('a')).toBeNull();
  });
});
