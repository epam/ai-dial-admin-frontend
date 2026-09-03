import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useRouter } from 'next/navigation';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import { ButtonsI18nKey, KeysI18nKey } from '@/src/constants/i18n';
import { DialKeyResource } from '@/src/models/dial/resource';
import DuplicatePlatformKeyModal from '../DuplicatePlatformKeyModal';

const GENERATED_KEY = 'generated-test-key-abc123';

vi.mock('@/src/app/[lang]/platform-keys/actions', () => ({
  createKey: vi.fn(),
}));

vi.mock('@/src/utils/keys/generate-key', () => ({
  generateKey: vi.fn(() => GENERATED_KEY),
}));

vi.mock('@/src/utils/open-in-new-tab', () => ({
  getUrnForEntity: vi.fn(() => '/en/platform-keys/my-key-copy'),
}));

import { createKey } from '@/src/app/[lang]/platform-keys/actions';

const sourceEntity: DialKeyResource = {
  name: 'my-key',
  project: 'my-project',
  roles: ['admin'],
  path: 'my-key',
  folderId: '',
} as unknown as DialKeyResource;

const renderModal = (entity: DialKeyResource = sourceEntity, names: string[] = [], onClose = vi.fn()) => {
  const mockPush = vi.fn();
  vi.mocked(useRouter).mockReturnValue({ push: mockPush } as unknown as ReturnType<typeof useRouter>);

  render(<DuplicatePlatformKeyModal isOpen entity={entity} names={names} onClose={onClose} />);

  return { onClose, mockPush };
};

describe.skip('DuplicatePlatformKeyModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Name step', () => {
    test('Pre-fills the name field with a cloned version of the source name', () => {
      renderModal();

      expect(screen.getByRole('textbox')).toHaveValue('my-key-copy');
    });

    test('Renders a Duplicate submit button and a Cancel button', () => {
      renderModal();

      expect(screen.getByRole('button', { name: ButtonsI18nKey.Duplicate })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: ButtonsI18nKey.Cancel })).toBeInTheDocument();
    });

    test('Calls onClose when Cancel is clicked without creating a key', async () => {
      const user = userEvent.setup();
      const { onClose } = renderModal();

      await user.click(screen.getByRole('button', { name: ButtonsI18nKey.Cancel }));

      expect(onClose).toHaveBeenCalledOnce();
      expect(createKey).not.toHaveBeenCalled();
    });

    test('Submitting calls createKey with the cloned name, copied project and roles, and generated key value', async () => {
      const user = userEvent.setup();
      vi.mocked(createKey).mockResolvedValue({ success: true });

      renderModal();

      await user.click(screen.getByRole('button', { name: ButtonsI18nKey.Duplicate }));

      expect(createKey).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'my-key-copy',
          project: 'my-project',
          roles: ['admin'],
          key: GENERATED_KEY,
        }),
      );
    });

    test('Allows the user to change the name before submitting', async () => {
      const user = userEvent.setup();
      vi.mocked(createKey).mockResolvedValue({ success: true });

      renderModal();

      fireEvent.change(screen.getByRole('textbox'), { target: { value: 'new-key-name' } });
      await user.click(screen.getByRole('button', { name: ButtonsI18nKey.Duplicate }));

      expect(createKey).toHaveBeenCalledWith(expect.objectContaining({ name: 'new-key-name' }));
    });
  });

  describe('Reveal step', () => {
    const renderReveal = async () => {
      vi.mocked(createKey).mockResolvedValue({ success: true });
      const user = userEvent.setup();
      const result = renderModal();

      await user.click(screen.getByRole('button', { name: ButtonsI18nKey.Duplicate }));

      return { user, ...result };
    };

    test('Transitions to the Reveal step after a successful create', async () => {
      await renderReveal();

      expect(screen.getByText(KeysI18nKey.KeyValueRevealTitle)).toBeInTheDocument();
    });

    test('Displays the generated key value on the Reveal step', async () => {
      await renderReveal();

      expect(screen.getByText(GENERATED_KEY)).toBeInTheDocument();
    });

    test('Calls onClose when Close is clicked on the Reveal step', async () => {
      const { user, onClose } = await renderReveal();

      await user.click(screen.getByRole('button', { name: ButtonsI18nKey.Close }));

      expect(onClose).toHaveBeenCalledOnce();
    });

    test('Navigates to the new key on Close', async () => {
      const { user, mockPush } = await renderReveal();

      await user.click(screen.getByRole('button', { name: ButtonsI18nKey.Close }));

      expect(mockPush).toHaveBeenCalledOnce();
    });

    test('Stays on Name step and does not navigate when createKey fails', async () => {
      vi.mocked(createKey).mockResolvedValue({ success: false });
      const user = userEvent.setup();
      const { mockPush } = renderModal();

      await user.click(screen.getByRole('button', { name: ButtonsI18nKey.Duplicate }));

      expect(screen.queryByText(KeysI18nKey.KeyValueRevealTitle)).toBeNull();
      expect(mockPush).not.toHaveBeenCalled();
    });
  });
});
