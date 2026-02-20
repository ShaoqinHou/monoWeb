// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { FormSkeleton } from '../FormSkeleton';

describe('FormSkeleton', () => {
  it('renders with default 5 fields', () => {
    render(<FormSkeleton />);
    const skeleton = screen.getByTestId('form-skeleton');
    expect(skeleton).toBeInTheDocument();
    expect(skeleton.getAttribute('aria-busy')).toBe('true');
  });

  it('renders custom number of fields', () => {
    render(<FormSkeleton fields={3} />);
    const skeleton = screen.getByTestId('form-skeleton');
    expect(skeleton).toBeInTheDocument();
  });

  it('hides header when showHeader is false', () => {
    const { container } = render(<FormSkeleton showHeader={false} />);
    const headerEl = container.querySelector('.w-1\\/3');
    expect(headerEl).toBeNull();
  });

  it('has aria-label for accessibility', () => {
    render(<FormSkeleton />);
    expect(screen.getByLabelText('Loading form')).toBeInTheDocument();
  });
});
