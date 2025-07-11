import { describe, expect, test, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { ApplicationRoute } from '@/src/types/routes';
import { PopUpState } from '@/src/types/pop-up';

import Create from '../Create';

const pushMock = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushMock }),
}));

vi.mock('@/src/app/[lang]/interceptor-templates/actions', () => ({
  createInterceptorTemplate: vi.fn(() => Promise.resolve({ success: true })),
}));

import { createInterceptorTemplate } from '@/src/app/[lang]/interceptor-templates/actions';

describe('Create InterceptorTemplate Modal', () => {
  const onCloseMock = vi.fn();

  test('Should render correctly', () => {
    render(
      <Create
        route={ApplicationRoute.InterceptorTemplates}
        modalState={PopUpState.Opened}
        onClose={onCloseMock}
        names={['a', 'b']}
      />,
    );

    expect(screen.getByRole('dialog')).toBeInTheDocument();

    expect(screen.getByRole('button', { name: 'Buttons.Cancel' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Buttons.Create' })).toBeInTheDocument();
  });

  test('Should call onClose when Cancel button is clicked', async () => {
    render(
      <Create
        route={ApplicationRoute.InterceptorTemplates}
        modalState={PopUpState.Opened}
        onClose={onCloseMock}
        names={['a', 'b']}
      />,
    );

    const cancelButton = screen.getByRole('button', { name: 'Buttons.Cancel' });
    await userEvent.click(cancelButton);

    expect(onCloseMock).toHaveBeenCalled();
  });

  test('Should call createInterceptorTemplate on Create button click', async () => {
    const onCloseMock = vi.fn();
    render(
      <Create
        route={ApplicationRoute.InterceptorTemplates}
        modalState={PopUpState.Opened}
        onClose={onCloseMock}
        names={['a', 'b']}
      />,
    );

    await userEvent.type(screen.getByPlaceholderText('CreateEntity.id.placeholder'), 'new-id');
    await userEvent.type(screen.getByPlaceholderText('CreateEntity.name.placeholder'), 'New Name');
    await userEvent.type(screen.getByPlaceholderText('CreateEntity.description.placeholder'), 'Some description');

    const createButton = screen.getByRole('button', { name: 'Buttons.Create' });
    await userEvent.click(createButton);

    expect(createInterceptorTemplate).toHaveBeenCalled();
    expect(pushMock).toHaveBeenCalled();
    expect(onCloseMock).toHaveBeenCalled();
  });
});
