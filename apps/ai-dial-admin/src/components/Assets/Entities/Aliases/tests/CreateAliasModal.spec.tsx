import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useRouter } from 'next/navigation';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import { ButtonsI18nKey } from '@/src/constants/i18n';
import { useNotification } from '@/src/context/NotificationContext';
import { AssetSource } from '@/src/models/dial/asset-source';
import { NotificationType } from '@/src/models/notification';
import CreateAliasModal from '../CreateAliasModal';

vi.mock('@/src/hooks/use-protected-request', () => ({
  useProtectedRequest:
    () =>
    (action: (...args: unknown[]) => unknown, ...args: unknown[]) =>
      action(...args),
}));

// The two bodies have their own spec; the stub shows a name on the first step and a target picker on the second.
vi.mock('../CreateProperties', () => ({
  default: ({ step, entity, onChangeEntity }: any) =>
    step === 'details' ? (
      <input
        aria-label="entity-name"
        value={entity.name ?? ''}
        onChange={(event) => onChangeEntity({ ...entity, name: event.target.value })}
      />
    ) : (
      <button onClick={() => onChangeEntity({ ...entity, target: { path: 'models/gpt' } })}>pick-target</button>
    ),
}));

describe('CreateAliasModal', () => {
  const { showNotification } = useNotification();
  const user = userEvent.setup();
  const push = vi.fn();
  const onClose = vi.fn();
  const createEntity = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useRouter).mockReturnValue({ push } as never);
  });

  const renderModal = (extra: Record<string, unknown> = {}) =>
    render(<CreateAliasModal isOpen names={['taken']} createEntity={createEntity} onClose={onClose} {...extra} />);

  const fillAndCreate = async (name: string) => {
    fireEvent.change(screen.getByRole('textbox', { name: 'entity-name' }), { target: { value: name } });
    await user.click(screen.getByRole('button', { name: ButtonsI18nKey.Next }));
    await user.click(screen.getByRole('button', { name: 'pick-target' }));
    await user.click(screen.getByRole('button', { name: ButtonsI18nKey.Create }));
  };

  test('writes an alias to the platform bucket by default and opens it by its bare name', async () => {
    createEntity.mockResolvedValue({ success: true, response: { name: 'assistant' } });
    renderModal();

    await fillAndCreate('assistant');

    await vi.waitFor(() =>
      expect(createEntity).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'assistant', folderId: 'platform/', target: { path: 'models/gpt' } }),
      ),
    );
    expect(push).toHaveBeenCalledWith('/assets-aliases/assistant');
    expect(showNotification).toHaveBeenCalledWith(expect.objectContaining({ type: NotificationType.success }));
    expect(onClose).toHaveBeenCalled();
  });

  test('writes an alias to the public bucket when the Public tab is active and opens it with its path', async () => {
    createEntity.mockResolvedValue({ success: true, response: { name: 'search' } });
    renderModal({ bucket: AssetSource.Public });

    await fillAndCreate('search');

    await vi.waitFor(() =>
      expect(createEntity).toHaveBeenCalledWith(expect.objectContaining({ name: 'search', folderId: 'public/' })),
    );
    expect(push).toHaveBeenCalledWith('/assets-aliases/search?path=public%2Fsearch');
  });

  test('seeds the form from the values of a duplicated alias', async () => {
    createEntity.mockResolvedValue({ success: true });
    renderModal({ initialValues: { name: 'copy', target: { path: 'models/gpt' } } });

    expect(screen.getByRole('textbox', { name: 'entity-name' })).toHaveValue('copy');
  });

  test('offers Next on the first step and Create only on the second, and Back returns to the name', async () => {
    renderModal();

    expect(screen.queryByRole('button', { name: ButtonsI18nKey.Create })).toBeNull();
    fireEvent.change(screen.getByRole('textbox', { name: 'entity-name' }), { target: { value: 'assistant' } });
    await user.click(screen.getByRole('button', { name: ButtonsI18nKey.Next }));

    expect(screen.queryByRole('textbox', { name: 'entity-name' })).toBeNull();
    expect(screen.getByRole('button', { name: ButtonsI18nKey.Create })).toBeDisabled();

    await user.click(screen.getByRole('button', { name: ButtonsI18nKey.Back }));

    expect(screen.getByRole('textbox', { name: 'entity-name' })).toHaveValue('assistant');
  });

  test('keeps Next disabled until the name is valid', () => {
    renderModal();
    expect(screen.getByRole('button', { name: ButtonsI18nKey.Next })).toBeDisabled();

    fireEvent.change(screen.getByRole('textbox', { name: 'entity-name' }), { target: { value: 'a:b' } });

    expect(screen.getByRole('button', { name: ButtonsI18nKey.Next })).toBeDisabled();
  });

  test('keeps the modal open and shows the error when Core refuses the create', async () => {
    createEntity.mockResolvedValue({ success: false, errorHeader: 'Conflict', errorMessage: 'exists' });
    renderModal();

    await fillAndCreate('assistant');

    await vi.waitFor(() =>
      expect(showNotification).toHaveBeenCalledWith(expect.objectContaining({ type: NotificationType.error })),
    );
    expect(onClose).not.toHaveBeenCalled();
    expect(push).not.toHaveBeenCalled();
  });
});
