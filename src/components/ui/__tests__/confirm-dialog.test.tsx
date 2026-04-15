import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';

function renderDialog(overrides?: Partial<React.ComponentProps<typeof ConfirmDialog>>) {
  const props = {
    title: 'Galdetu?',
    message: 'Ziur zaude?',
    confirmLabel: 'Bai',
    onConfirm: vi.fn(),
    onCancel: vi.fn(),
    ...overrides,
  };
  render(<ConfirmDialog {...props} />);
  return props;
}

describe('ConfirmDialog', () => {
  it('renders title, message, and confirmLabel', () => {
    renderDialog();
    expect(screen.getByText('Galdetu?')).toBeInTheDocument();
    expect(screen.getByText('Ziur zaude?')).toBeInTheDocument();
    expect(screen.getByText('Bai')).toBeInTheDocument();
  });

  it('calls onConfirm when confirm button is clicked', async () => {
    const { onConfirm } = renderDialog();
    await userEvent.click(screen.getByText('Bai'));
    expect(onConfirm).toHaveBeenCalledOnce();
  });

  it('calls onCancel when cancel button is clicked', async () => {
    const { onCancel } = renderDialog();
    await userEvent.click(screen.getByText('Utzi'));
    expect(onCancel).toHaveBeenCalledOnce();
  });

  it('does not call onConfirm when cancel is clicked', async () => {
    const { onConfirm } = renderDialog();
    await userEvent.click(screen.getByText('Utzi'));
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it('confirmDanger=true: confirm button has red background', () => {
    renderDialog({ confirmDanger: true });
    const confirmBtn = screen.getByText('Bai');
    expect(confirmBtn).toHaveStyle({ background: 'var(--ops-red)' });
  });

  it('confirmDanger=false (default): confirm button has orange background', () => {
    renderDialog({ confirmDanger: false });
    const confirmBtn = screen.getByText('Bai');
    expect(confirmBtn).toHaveStyle({ background: 'var(--ops-orange)' });
  });
});
