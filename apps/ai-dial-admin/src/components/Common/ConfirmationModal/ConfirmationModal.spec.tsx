import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PopUpState } from '@/src/types/pop-up';
import ConfirmationModal from './ConfirmationModal';
import { describe, expect, test, vi } from 'vitest';

describe('Common :: ConfirmationModal', () => {
  test('Should render successfully', async () => {
    render(
      <ConfirmationModal
        modalState={PopUpState.Opened}
        onConfirm={vi.fn()}
        onClose={vi.fn()}
        description="description"
        heading="heading"
        confirmLabel="Confirm"
      />,
    );

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('heading')).toBeInTheDocument();
    expect(screen.getByText('description')).toBeInTheDocument();
  });

  test('Should render successfully with loading', () => {
    render(
      <ConfirmationModal
        modalState={PopUpState.Opened}
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
        onClose={vi.fn()}
        isLoading={true}
        description="description"
        heading="heading"
        confirmLabel="Confirm"
      />,
    );

    expect(screen.queryByRole('button', { name: /confirm/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /cancel/i })).not.toBeInTheDocument();
  });

  test('Should handle confirm', async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();

    render(
      <ConfirmationModal
        modalState={PopUpState.Opened}
        onConfirm={onConfirm}
        onClose={vi.fn()}
        description="description"
        heading="heading"
        confirmLabel="Confirm"
      />,
    );

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('heading')).toBeInTheDocument();
    expect(screen.getByText('description')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /confirm/i }));
    expect(onConfirm).toHaveBeenCalled();
  });

  test('Should handle close', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();

    render(
      <ConfirmationModal
        modalState={PopUpState.Opened}
        onConfirm={vi.fn()}
        onClose={onClose}
        description="description"
        heading="heading"
        confirmLabel="Confirm"
      />,
    );

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('heading')).toBeInTheDocument();
    expect(screen.getByText('description')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /close/i }));
    expect(onClose).toHaveBeenCalled();
  });

  test('Should handle cancel', async () => {
    const user = userEvent.setup();
    const onCancel = vi.fn();

    render(
      <ConfirmationModal
        modalState={PopUpState.Opened}
        onConfirm={vi.fn()}
        onCancel={onCancel}
        onClose={vi.fn()}
        description="description"
        heading="heading"
        confirmLabel="Confirm"
      >
        <div></div>
      </ConfirmationModal>,
    );

    await user.click(screen.getByRole('button', { name: /cancel/i }));
    expect(onCancel).toHaveBeenCalled();
  });

  test('Should handle cancel with close handler', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();

    render(
      <ConfirmationModal
        modalState={PopUpState.Opened}
        onConfirm={vi.fn()}
        onClose={onClose}
        description="description"
        heading="heading"
        confirmLabel="Confirm"
      />,
    );

    await user.click(screen.getByRole('button', { name: /cancel/i }));
    expect(onClose).toHaveBeenCalled();
  });
});
