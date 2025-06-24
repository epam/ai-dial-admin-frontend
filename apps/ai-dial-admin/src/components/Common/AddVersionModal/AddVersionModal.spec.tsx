import { PopUpState } from '@/src/types/pop-up';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, test, vi } from 'vitest';
import AddVersionModal from './AddVersionModal';

describe('Common components - AddVersionModal', () => {
  test('renders input and buttons', () => {
    render(
      <AddVersionModal existingVersions={[]} modalState={PopUpState.Opened} onClose={vi.fn()} onConfirm={vi.fn()} />,
    );

    expect(screen.getByRole('textbox')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Buttons.Cancel' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Buttons.Create' })).toBeInTheDocument();
  });

  test('handles close and confirm actions', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    const onConfirm = vi.fn();

    render(
      <AddVersionModal existingVersions={[]} modalState={PopUpState.Opened} onClose={onClose} onConfirm={onConfirm} />,
    );

    await user.click(screen.getByRole('button', { name: 'Buttons.Cancel' }));
    expect(onClose).toHaveBeenCalledTimes(1);

    const input = screen.getByRole('textbox');
    await user.type(input, '3.0.0');

    await user.click(screen.getByRole('button', { name: 'Buttons.Create' }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(onConfirm).toHaveBeenCalledWith('3.0.0');
  });

  test('renders provided versions and handles version change', async () => {
    const user = userEvent.setup();
    const existingVersions = ['1.0.0', '2.0.0'];
    render(
      <AddVersionModal
        existingVersions={existingVersions}
        modalState={PopUpState.Opened}
        onClose={vi.fn()}
        onConfirm={vi.fn()}
      />,
    );

    const input = screen.getByRole('textbox');
    expect(input).toBeInTheDocument();
    expect(input).toHaveValue('');

    await user.clear(input);
    await user.paste('3.0.0');
    expect(input).toHaveValue('3.0.0');
  });
});
