// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { EmailTemplateEditor } from '../components/EmailTemplateEditor';

const VARIABLES = ['{contactName}', '{invoiceNumber}', '{amount}', '{dueDate}'];

describe('EmailTemplateEditor', () => {
  it('renders subject input', () => {
    render(
      <EmailTemplateEditor
        subject="Invoice {invoiceNumber}"
        body="Hi {contactName}"
        onChange={vi.fn()}
        variables={VARIABLES}
      />,
    );
    expect(screen.getByLabelText('Subject')).toHaveValue('Invoice {invoiceNumber}');
  });

  it('renders body textarea', () => {
    render(
      <EmailTemplateEditor
        subject="Subject"
        body="Hello World"
        onChange={vi.fn()}
        variables={VARIABLES}
      />,
    );
    expect(screen.getByLabelText('Body')).toHaveValue('Hello World');
  });

  it('renders variable insert buttons', () => {
    render(
      <EmailTemplateEditor
        subject=""
        body=""
        onChange={vi.fn()}
        variables={VARIABLES}
      />,
    );

    expect(screen.getByText('Insert Variable:')).toBeInTheDocument();
    for (const v of VARIABLES) {
      expect(screen.getByTestId(`insert-var-${v}`)).toBeInTheDocument();
    }
  });

  it('calls onChange with subject when subject changes', () => {
    const onChange = vi.fn();
    render(
      <EmailTemplateEditor
        subject="Old Subject"
        body="Body"
        onChange={onChange}
        variables={VARIABLES}
      />,
    );

    fireEvent.change(screen.getByLabelText('Subject'), { target: { value: 'New Subject' } });
    expect(onChange).toHaveBeenCalledWith('subject', 'New Subject');
  });

  it('calls onChange with body when body changes', () => {
    const onChange = vi.fn();
    render(
      <EmailTemplateEditor
        subject="Subject"
        body="Old body"
        onChange={onChange}
        variables={VARIABLES}
      />,
    );

    fireEvent.change(screen.getByLabelText('Body'), { target: { value: 'New body' } });
    expect(onChange).toHaveBeenCalledWith('body', 'New body');
  });

  it('inserts variable into body when variable button clicked', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <EmailTemplateEditor
        subject="Subject"
        body="Hello "
        onChange={onChange}
        variables={VARIABLES}
      />,
    );

    await user.click(screen.getByTestId('insert-var-{contactName}'));
    expect(onChange).toHaveBeenCalledWith('body', expect.stringContaining('{contactName}'));
  });

  it('syncs local state when props change', () => {
    const { rerender } = render(
      <EmailTemplateEditor
        subject="Subject 1"
        body="Body 1"
        onChange={vi.fn()}
        variables={VARIABLES}
      />,
    );

    rerender(
      <EmailTemplateEditor
        subject="Subject 2"
        body="Body 2"
        onChange={vi.fn()}
        variables={VARIABLES}
      />,
    );

    expect(screen.getByLabelText('Subject')).toHaveValue('Subject 2');
    expect(screen.getByLabelText('Body')).toHaveValue('Body 2');
  });
});
