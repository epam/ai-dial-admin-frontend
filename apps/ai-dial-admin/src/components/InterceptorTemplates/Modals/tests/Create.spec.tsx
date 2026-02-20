import { describe, expect, test, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { ApplicationRoute } from '@/src/types/routes';

import Create from '../Create';
import { ButtonsI18nKey } from '../../../../constants/i18n';

const pushMock = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushMock }),
}));

vi.mock('@/src/app/[lang]/interceptor-templates/actions', () => ({
  createInterceptorTemplate: vi.fn(() => Promise.resolve({ success: true })),
}));

describe('Create InterceptorTemplate Modal', () => {
  const onCloseMock = vi.fn();

  test('Should render correctly', () => {
    render(
      <Create
        route={ApplicationRoute.InterceptorTemplates}
        isModalOpen={true}
        onClose={onCloseMock}
        names={['a', 'b']}
      />,
    );

    expect(screen.getByRole('dialog')).toBeInTheDocument();

    expect(screen.getByRole('button', { name: ButtonsI18nKey.Cancel })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: ButtonsI18nKey.Create })).toBeInTheDocument();
  });

  test('Should call onClose when Cancel button is clicked', async () => {
    render(
      <Create
        route={ApplicationRoute.InterceptorTemplates}
        isModalOpen={true}
        onClose={onCloseMock}
        names={['a', 'b']}
      />,
    );

    const cancelButton = screen.getByRole('button', { name: ButtonsI18nKey.Cancel });
    await userEvent.click(cancelButton);

    expect(onCloseMock).toHaveBeenCalled();
  });
});
