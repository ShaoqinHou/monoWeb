// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { KeyboardShortcutsDialog } from '../KeyboardShortcutsDialog';

describe('KeyboardShortcutsDialog', () => {
  it('is hidden by default', () => {
    render(<KeyboardShortcutsDialog />);
    expect(screen.queryByText('Keyboard Shortcuts')).not.toBeInTheDocument();
  });

  it('opens when ? key is pressed', () => {
    render(<KeyboardShortcutsDialog />);
    fireEvent.keyDown(document, { key: '?' });
    expect(screen.getByText('Keyboard Shortcuts')).toBeInTheDocument();
  });

  it('shows built-in shortcuts', () => {
    render(<KeyboardShortcutsDialog />);
    fireEvent.keyDown(document, { key: '?' });
    expect(screen.getByText('Open search')).toBeInTheDocument();
    expect(screen.getByText('Create new item')).toBeInTheDocument();
  });

  it('categorizes shortcuts', () => {
    render(<KeyboardShortcutsDialog />);
    fireEvent.keyDown(document, { key: '?' });
    expect(screen.getByText('navigation')).toBeInTheDocument();
    expect(screen.getByText('actions')).toBeInTheDocument();
  });
});
