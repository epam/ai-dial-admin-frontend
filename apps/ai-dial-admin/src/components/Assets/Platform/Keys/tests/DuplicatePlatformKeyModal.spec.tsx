import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useRouter } from 'next/navigation';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import { createKey } from '@/src/app/[lang]/platform-keys/actions';
import { ButtonsI18nKey, EntityFieldsI18nKey, KeysI18nKey } from '@/src/constants/i18n';
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

const stepButton = (name: string) => screen.getByRole('button', { name: new RegExp(`^${name}`) });

describe('DuplicatePlatformKeyModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Name step', () => {
    test('Shows the Name and Key steps with Name current', () => {
      renderModal();

      expect(stepButton(EntityFieldsI18nKey.name)).toHaveAttribute('aria-current', 'step');
      expect(stepButton(KeysI18nKey.KeyValueRevealTitle)).not.toHaveAttribute('aria-current');
    });

    test('Pre-fills the name field with a cloned version of the source name', () => {
      renderModal();

      expect(screen.getByRole('textbox')).toHaveValue('my-key-copy');
    });

    test('Renders a Duplicate finish button and a Cancel button, without Next', () => {
      renderModal();

      expect(screen.getByRole('button', { name: ButtonsI18nKey.Duplicate })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: ButtonsI18nKey.Cancel })).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: ButtonsI18nKey.Next })).toBeNull();
    });

    test('Does not allow jumping to the Key step from the indicator', async () => {
      const user = userEvent.setup();
      renderModal();

      await user.click(stepButton(KeysI18nKey.KeyValueRevealTitle));

      expect(screen.queryByText(GENERATED_KEY)).toBeNull();
      expect(createKey).not.toHaveBeenCalled();
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

  describe('Key step', () => {
    const renderReveal = async () => {
      vi.mocked(createKey).mockResolvedValue({ success: true });
      const user = userEvent.setup();
      const result = renderModal();

      await user.click(screen.getByRole('button', { name: ButtonsI18nKey.Duplicate }));
      await screen.findByText(GENERATED_KEY);

      return { user, ...result };
    };

    test('Transitions to the Key step and displays the generated key value', async () => {
      await renderReveal();

      expect(stepButton(KeysI18nKey.KeyValueRevealTitle)).toHaveAttribute('aria-current', 'step');
      expect(screen.getByText(GENERATED_KEY)).toBeInTheDocument();
    });

    test('Locks the Name step and offers only Close', async () => {
      await renderReveal();

      expect(stepButton(EntityFieldsI18nKey.name)).toBeDisabled();
      expect(screen.getAllByRole('button', { name: ButtonsI18nKey.Close })).toHaveLength(1);
      expect(screen.queryByRole('button', { name: ButtonsI18nKey.Cancel })).toBeNull();
      expect(screen.queryByRole('button', { name: ButtonsI18nKey.Back })).toBeNull();
      expect(screen.queryByRole('button', { name: ButtonsI18nKey.Duplicate })).toBeNull();
    });

    test('Calls onClose and navigates to the new key when Close is clicked', async () => {
      const { user, onClose, mockPush } = await renderReveal();

      await user.click(screen.getByRole('button', { name: ButtonsI18nKey.Close }));

      expect(onClose).toHaveBeenCalledOnce();
      expect(mockPush).toHaveBeenCalledOnce();
    });

    test('Stays on the Name step and does not navigate when createKey fails', async () => {
      vi.mocked(createKey).mockResolvedValue({ success: false });
      const user = userEvent.setup();
      const { mockPush } = renderModal();

      await user.click(screen.getByRole('button', { name: ButtonsI18nKey.Duplicate }));

      expect(screen.queryByText(GENERATED_KEY)).toBeNull();
      expect(stepButton(EntityFieldsI18nKey.name)).toHaveAttribute('aria-current', 'step');
      expect(mockPush).not.toHaveBeenCalled();
    });
  });
});
