// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { InlineValidation } from '../InlineValidation';

describe('InlineValidation', () => {
  it('renders nothing when no error', () => {
    const { container } = render(<InlineValidation error={null} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders nothing when not touched', () => {
    const { container } = render(<InlineValidation error="Required" touched={false} />);
    expect(container.firstChild).toBeNull();
  });

  it('shows error when touched and has error', () => {
    render(<InlineValidation error="This field is required" touched={true} />);
    expect(screen.getByTestId('field-error')).toBeInTheDocument();
    expect(screen.getByText('This field is required')).toBeInTheDocument();
  });

  it('has alert role for accessibility', () => {
    render(<InlineValidation error="Error" touched={true} />);
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('defaults touched to true', () => {
    render(<InlineValidation error="Error" />);
    expect(screen.getByTestId('field-error')).toBeInTheDocument();
  });
});
