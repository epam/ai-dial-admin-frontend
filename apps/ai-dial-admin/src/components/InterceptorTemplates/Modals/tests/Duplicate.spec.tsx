import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, test, vi } from 'vitest';

import { PopUpState } from '@/src/types/pop-up';

import { ButtonsI18nKey, DuplicateI18nKey, EntityPlaceholdersI18nKey } from '@/src/constants/i18n';
import Duplicate from '../Duplicate';

describe('Duplicate InterceptorTemplate Modal', () => {
  const user = userEvent.setup();
  const onCloseMock = vi.fn();
  const onDuplicateMock = vi.fn();

  test('Should render all important elements', () => {
    render(
      <Duplicate
        isModalOpen={true}
        onClose={onCloseMock}
        template={{ name: 't', displayName: '', description: '' }}
        onDuplicate={onDuplicateMock}
        names={['t']}
      />,
    );

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: DuplicateI18nKey.InterceptorTemplate })).toBeInTheDocument();
    expect(screen.getByPlaceholderText(EntityPlaceholdersI18nKey.Id)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: ButtonsI18nKey.Cancel })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: ButtonsI18nKey.Duplicate })).toBeInTheDocument();
  });

  test.skip('Should call onDuplicate when Duplicate button is clicked', async () => {
    render(
      <Duplicate
        isModalOpen={true}
        onClose={onCloseMock}
        template={{ name: 't', displayName: '', description: '' }}
        onDuplicate={onDuplicateMock}
        names={['t']}
      />,
    );

    await user.clear(screen.getByPlaceholderText(EntityPlaceholdersI18nKey.Id));
    await user.type(screen.getByPlaceholderText(EntityPlaceholdersI18nKey.Id), 't_copy');
    await user.click(screen.getByRole('button', { name: ButtonsI18nKey.Duplicate }));

    expect(onDuplicateMock).toHaveBeenCalled();
  });

  test('Should call onClose when Cancel button is clicked', async () => {
    render(
      <Duplicate
        isModalOpen={true}
        onClose={onCloseMock}
        template={{ name: 't', displayName: '', description: '' }}
        onDuplicate={onDuplicateMock}
        names={['t']}
      />,
    );

    await user.click(screen.getByRole('button', { name: ButtonsI18nKey.Cancel }));
    expect(onCloseMock).toHaveBeenCalled();
  });
});
