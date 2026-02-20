// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SkipToContent } from '../SkipToContent';

describe('SkipToContent', () => {
  it('renders skip link', () => {
    render(<SkipToContent />);
    const link = screen.getByTestId('skip-to-content');
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', '#main-content');
  });

  it('has sr-only class (hidden by default)', () => {
    render(<SkipToContent />);
    const link = screen.getByTestId('skip-to-content');
    expect(link.className).toContain('sr-only');
  });

  it('has correct accessible text', () => {
    render(<SkipToContent />);
    expect(screen.getByText('Skip to main content')).toBeInTheDocument();
  });
});
