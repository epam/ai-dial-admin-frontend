import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, test, vi } from 'vitest';

import { ButtonsI18nKey } from '@/src/constants/i18n';
import { PopUpState } from '@/src/types/pop-up';

import AddVersionModal from './AddVersionModal';

describe('Common components - AddVersionModal', () => {
  test('renders input and buttons', () => {
    render(
      <AddVersionModal
        heading="header"
        existingVersions={[]}
        modalState={PopUpState.Opened}
        onClose={vi.fn()}
        onConfirm={vi.fn()}
      />,
    );

    expect(screen.getByRole('textbox')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: ButtonsI18nKey.Cancel })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: ButtonsI18nKey.Create })).toBeInTheDocument();
  });

  test('handles close and confirm actions', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    const onConfirm = vi.fn();

    render(
      <AddVersionModal
        heading="header"
        existingVersions={[]}
        modalState={PopUpState.Opened}
        onClose={onClose}
        onConfirm={onConfirm}
      />,
    );

    await user.click(screen.getByRole('button', { name: ButtonsI18nKey.Cancel }));
    expect(onClose).toHaveBeenCalledTimes(1);

    const input = screen.getByRole('textbox');
    await user.type(input, '3');

    await user.click(screen.getByRole('button', { name: ButtonsI18nKey.Create }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(onConfirm).toHaveBeenCalledWith('3');
  });

  test('renders provided versions and handles version change', async () => {
    const user = userEvent.setup();
    const existingVersions = ['1.0.0', '2.0.0'];
    render(
      <AddVersionModal
        heading="header"
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
