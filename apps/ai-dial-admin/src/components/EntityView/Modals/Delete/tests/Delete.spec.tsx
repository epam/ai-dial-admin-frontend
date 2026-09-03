import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import { ApplicationRoute } from '@/src/types/routes';
import DeleteConfirmationModal from '../Delete';

const showNotification = vi.fn();
vi.mock('@/src/context/NotificationContext', () => ({
  useNotification: () => ({ showNotification, removeNotification: vi.fn() }),
}));

// The global `t()` mock returns the key as-is and drops interpolation params — override it here so
// the notification description embeds `entityId`, the only way to assert which key was passed.
vi.mock('@/src/locales/client', () => ({
  useI18n: () => (key: string, options?: Record<string, string>) => (options ? `${key}:${options.entityId}` : key),
  useCurrentLocale: () => 'en',
}));

describe('DeleteConfirmationModal :: platform-bucket notification', () => {
  beforeEach(() => {
    showNotification.mockClear();
  });

  const confirmDelete = () => fireEvent.click(screen.getByRole('button', { name: 'Buttons.Delete' }));

  test.each([ApplicationRoute.AssetsApplications, ApplicationRoute.AssetsToolsets])(
    'shows the plain name, not the full platform/ path, when a platform-bucket %s entity is removed',
    async (view) => {
      vi.mocked(useRouter).mockReturnValue({ push: vi.fn() } as unknown as ReturnType<typeof useRouter>);
      const onRemoveEntity = vi.fn().mockResolvedValue({ success: true });

      render(
        <DeleteConfirmationModal
          view={view}
          entity={{ name: 'pl_Ts', folderId: 'platform/', path: 'platform/pl_Ts' } as never}
          onRemoveEntity={onRemoveEntity}
          onCloseModal={vi.fn()}
        />,
      );

      confirmDelete();

      await waitFor(() => expect(onRemoveEntity).toHaveBeenCalledWith('platform/pl_Ts', undefined));
      await waitFor(() => expect(showNotification).toHaveBeenCalled());
      const notification = showNotification.mock.calls[0][0];
      expect(notification.description).not.toContain('platform/pl_Ts');
      expect(notification.description).toContain('pl_Ts');
    },
  );

  test('shows the full versioned path, unchanged, for a public-bucket application entity', async () => {
    vi.mocked(useRouter).mockReturnValue({ push: vi.fn() } as unknown as ReturnType<typeof useRouter>);
    const onRemoveEntity = vi.fn().mockResolvedValue({ success: true });

    render(
      <DeleteConfirmationModal
        view={ApplicationRoute.AssetsApplications}
        entity={{ name: 'MyApp', folderId: 'public/', path: 'public/MyApp__1.0', version: '1.0' } as never}
        onRemoveEntity={onRemoveEntity}
        onCloseModal={vi.fn()}
      />,
    );

    confirmDelete();

    await waitFor(() => expect(showNotification).toHaveBeenCalled());
    const notification = showNotification.mock.calls[0][0];
    expect(notification.description).toContain('public/MyApp__1.0');
  });
});
