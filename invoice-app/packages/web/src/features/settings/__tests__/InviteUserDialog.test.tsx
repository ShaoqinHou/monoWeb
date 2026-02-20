// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { InviteUserDialog } from '../components/InviteUserDialog';

describe('InviteUserDialog', () => {
  it('renders dialog when open', () => {
    render(<InviteUserDialog open={true} onClose={vi.fn()} onInvite={vi.fn()} />);
    expect(screen.getByText('Invite User')).toBeInTheDocument();
  });

  it('renders email input', () => {
    render(<InviteUserDialog open={true} onClose={vi.fn()} onInvite={vi.fn()} />);
    expect(screen.getByLabelText('Email Address')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('user@example.com')).toBeInTheDocument();
  });

  it('renders role selector', () => {
    render(<InviteUserDialog open={true} onClose={vi.fn()} onInvite={vi.fn()} />);
    expect(screen.getByLabelText('Role')).toBeInTheDocument();
  });

  it('defaults role to Standard', () => {
    render(<InviteUserDialog open={true} onClose={vi.fn()} onInvite={vi.fn()} />);
    expect(screen.getByLabelText('Role')).toHaveValue('Standard');
  });

  it('disables Send Invite when email is empty', () => {
    render(<InviteUserDialog open={true} onClose={vi.fn()} onInvite={vi.fn()} />);
    expect(screen.getByTestId('send-invite')).toBeDisabled();
  });

  it('enables Send Invite when email is provided', () => {
    render(<InviteUserDialog open={true} onClose={vi.fn()} onInvite={vi.fn()} />);
    fireEvent.change(screen.getByLabelText('Email Address'), { target: { value: 'test@example.com' } });
    expect(screen.getByTestId('send-invite')).not.toBeDisabled();
  });

  it('calls onInvite with email and role when submitted', async () => {
    const user = userEvent.setup();
    const onInvite = vi.fn();
    const onClose = vi.fn();
    render(<InviteUserDialog open={true} onClose={onClose} onInvite={onInvite} />);

    fireEvent.change(screen.getByLabelText('Email Address'), { target: { value: 'newuser@example.com' } });

    await user.click(screen.getByTestId('send-invite'));
    expect(onInvite).toHaveBeenCalledWith('newuser@example.com', 'Standard');
    expect(onClose).toHaveBeenCalled();
  });

  it('calls onClose when Cancel is clicked', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<InviteUserDialog open={true} onClose={onClose} onInvite={vi.fn()} />);

    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('allows selecting different roles', () => {
    render(<InviteUserDialog open={true} onClose={vi.fn()} onInvite={vi.fn()} />);
    fireEvent.change(screen.getByLabelText('Role'), { target: { value: 'Admin' } });
    expect(screen.getByLabelText('Role')).toHaveValue('Admin');
  });

  it('sends correct role when changed', async () => {
    const user = userEvent.setup();
    const onInvite = vi.fn();
    render(<InviteUserDialog open={true} onClose={vi.fn()} onInvite={onInvite} />);

    fireEvent.change(screen.getByLabelText('Email Address'), { target: { value: 'admin@test.com' } });
    fireEvent.change(screen.getByLabelText('Role'), { target: { value: 'Admin' } });

    await user.click(screen.getByTestId('send-invite'));
    expect(onInvite).toHaveBeenCalledWith('admin@test.com', 'Admin');
  });
});
