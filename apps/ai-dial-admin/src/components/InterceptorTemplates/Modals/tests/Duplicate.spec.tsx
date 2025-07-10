import { describe, expect, test, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { PopUpState } from '@/src/types/pop-up';

import Duplicate from '../Duplicate';

describe('Duplicate InterceptorTemplate Modal', () => {
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
    expect(screen.getByPlaceholderText('CreateEntity.id.placeholder')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Buttons.Cancel' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Buttons.Duplicate' })).toBeInTheDocument();
  });

  test('Should call onDuplicate when Duplicate button is clicked', async () => {
    render(
      <Duplicate
        modalState={PopUpState.Opened}
        onClose={onCloseMock}
        template={{ name: 't', displayName: '', description: '' }}
        onDuplicate={onDuplicateMock}
        names={['t']}
      />,
    );

    await userEvent.clear(screen.getByPlaceholderText('CreateEntity.id.placeholder'));
    await userEvent.type(screen.getByPlaceholderText('CreateEntity.id.placeholder'), 't_copy');
    await userEvent.click(screen.getByRole('button', { name: 'Buttons.Duplicate' }));

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

    await userEvent.click(screen.getByRole('button', { name: 'Buttons.Cancel' }));
    expect(onCloseMock).toHaveBeenCalled();
  });
});
