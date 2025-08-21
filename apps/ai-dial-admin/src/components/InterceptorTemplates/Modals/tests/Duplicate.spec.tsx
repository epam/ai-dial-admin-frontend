import { describe, expect, test, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { PopUpState } from '@/src/types/pop-up';

import Duplicate from '../Duplicate';
import { ButtonsI18nKey, EntityFieldsI18nKey, EntityPlaceholdersI18nKey } from '../../../../constants/i18n';

describe('Duplicate InterceptorTemplate Modal', () => {
  const user = userEvent.setup();
  const onCloseMock = vi.fn();
  const onDuplicateMock = vi.fn();

  test('Should render all important elements', () => {
    render(
      <Duplicate
        modalState={PopUpState.Opened}
        onClose={onCloseMock}
        template={{ name: 't', displayName: '', description: '' }}
        onDuplicate={onDuplicateMock}
        names={['t']}
      />,
    );

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'DuplicateEntity.InterceptorTemplate.Header' })).toBeInTheDocument();
    expect(screen.getByPlaceholderText(EntityPlaceholdersI18nKey.Id)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: ButtonsI18nKey.Cancel })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: ButtonsI18nKey.Duplicate })).toBeInTheDocument();
  });

  test.skip('Should call onDuplicate when Duplicate button is clicked', async () => {
    render(
      <Duplicate
        modalState={PopUpState.Opened}
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
        modalState={PopUpState.Opened}
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
