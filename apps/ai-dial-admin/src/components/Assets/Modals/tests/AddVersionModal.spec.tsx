import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, test, vi } from 'vitest';

import { ButtonsI18nKey } from '@/src/constants/i18n';
import AddVersionModal from '../AddVersionModal';

describe('Common components - AddVersionModal', () => {
  const user = userEvent.setup();
  const onClose = vi.fn();
  const onConfirm = vi.fn();

  test('renders input and buttons', () => {
    render(
      <AddVersionModal
        header="header"
        existingVersions={{}}
        isModalOpen={true}
        onClose={onClose}
        onConfirm={onConfirm}
      />,
    );

    expect(screen.getByRole('textbox')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: ButtonsI18nKey.Cancel })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: ButtonsI18nKey.Create })).toBeInTheDocument();
  });

  test('handles close and confirm actions', async () => {
    render(
      <AddVersionModal
        header="header"
        existingVersions={{}}
        isModalOpen={true}
        onClose={onClose}
        onConfirm={onConfirm}
      />,
    );

    await user.click(screen.getByRole('button', { name: ButtonsI18nKey.Cancel }));
    expect(onClose).toHaveBeenCalled();

    const input = screen.getByRole('textbox');
    await user.type(input, '3');

    await user.click(screen.getByRole('button', { name: ButtonsI18nKey.Create }));
    expect(onConfirm).toHaveBeenCalled();
  });
});
