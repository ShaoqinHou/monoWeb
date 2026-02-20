// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrandingPreview } from '../components/BrandingPreview';

describe('BrandingPreview', () => {
  it('renders data-testid', () => {
    render(<BrandingPreview logo="" accentColor="#0078c8" font="Arial" />);
    expect(screen.getByTestId('branding-preview')).toBeInTheDocument();
  });

  it('renders "No Logo" placeholder when logo is empty', () => {
    render(<BrandingPreview logo="" accentColor="#0078c8" font="Arial" />);
    expect(screen.getByText('No Logo')).toBeInTheDocument();
  });

  it('renders logo image when logo is provided', () => {
    render(<BrandingPreview logo="data:image/png;base64,abc" accentColor="#0078c8" font="Arial" />);
    const img = screen.getByAltText('Company logo');
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute('src', 'data:image/png;base64,abc');
  });

  it('renders INVOICE heading with accent color', () => {
    render(<BrandingPreview logo="" accentColor="#ff0000" font="Arial" />);
    const heading = screen.getByText('INVOICE');
    expect(heading).toBeInTheDocument();
    expect(heading).toHaveStyle({ color: '#ff0000' });
  });

  it('applies font family', () => {
    render(<BrandingPreview logo="" accentColor="#0078c8" font="Georgia" />);
    const container = screen.getByTestId('branding-preview');
    expect(container).toHaveStyle({ fontFamily: 'Georgia' });
  });

  it('renders mock invoice content', () => {
    render(<BrandingPreview logo="" accentColor="#0078c8" font="Arial" />);
    expect(screen.getByText('INV-1042')).toBeInTheDocument();
    expect(screen.getByText('Professional Services')).toBeInTheDocument();
    expect(screen.getByText('$2,500.00')).toBeInTheDocument();
  });

  it('renders total with accent color', () => {
    render(<BrandingPreview logo="" accentColor="#14b8a6" font="Arial" />);
    const total = screen.getByText('$2,875.00');
    expect(total).toHaveStyle({ color: '#14b8a6' });
  });
});
