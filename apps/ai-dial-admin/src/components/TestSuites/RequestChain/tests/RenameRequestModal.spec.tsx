import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, test, vi } from 'vitest';

import { ButtonsI18nKey, TestSuitesI18nKey } from '@/src/constants/i18n';
import RenameRequestModal from '../RenameRequestModal';

describe('RenameRequestModal', () => {
  test('shows the header and pre-fills the name input with the initial name', () => {
    render(<RenameRequestModal isOpen initialName="Requests 2" onClose={vi.fn()} onConfirm={vi.fn()} />);

    expect(screen.getByText(TestSuitesI18nKey.RenameRequest)).toBeInTheDocument();
    expect(screen.getByDisplayValue('Requests 2')).toBeInTheDocument();
  });

  test('confirms with the edited name', async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();
    render(<RenameRequestModal isOpen initialName="Requests 2" onClose={vi.fn()} onConfirm={onConfirm} />);

    fireEvent.change(screen.getByDisplayValue('Requests 2'), { target: { value: 'Follow-up call' } });
    await user.click(screen.getByRole('button', { name: ButtonsI18nKey.Confirm }));

    expect(onConfirm).toHaveBeenCalledWith('Follow-up call');
  });

  test('disables Confirm when the name is blank', () => {
    render(<RenameRequestModal isOpen initialName="" onClose={vi.fn()} onConfirm={vi.fn()} />);

    expect(screen.getByRole('button', { name: ButtonsI18nKey.Confirm })).toBeDisabled();
  });

  test('calls onClose when Cancel is clicked', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<RenameRequestModal isOpen initialName="Requests 2" onClose={onClose} onConfirm={vi.fn()} />);

    await user.click(screen.getByRole('button', { name: ButtonsI18nKey.Cancel }));

    expect(onClose).toHaveBeenCalledOnce();
  });

  test('resets the input to the initial name each time it is reopened', () => {
    const { rerender } = render(
      <RenameRequestModal isOpen={false} initialName="Requests 2" onClose={vi.fn()} onConfirm={vi.fn()} />,
    );

    rerender(<RenameRequestModal isOpen initialName="Requests 2" onClose={vi.fn()} onConfirm={vi.fn()} />);
    fireEvent.change(screen.getByDisplayValue('Requests 2'), { target: { value: 'Edited' } });

    rerender(<RenameRequestModal isOpen={false} initialName="Requests 2" onClose={vi.fn()} onConfirm={vi.fn()} />);
    rerender(<RenameRequestModal isOpen initialName="Requests 2" onClose={vi.fn()} onConfirm={vi.fn()} />);

    expect(screen.getByDisplayValue('Requests 2')).toBeInTheDocument();
  });
});
