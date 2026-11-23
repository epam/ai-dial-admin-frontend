import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import { ButtonsI18nKey, KeysI18nKey } from '@/src/constants/i18n';
import { DialKeyResource } from '@/src/models/dial/resource';
import KeyRotateModal from '../KeyRotateModal';

const GENERATED_KEY = 'rotated-test-key-xyz789';

vi.mock('@/src/utils/keys/generate-key', () => ({
  generateKey: vi.fn(() => GENERATED_KEY),
}));

const asset = { name: 'my-key', project: 'my-project', roles: ['admin'] } as unknown as DialKeyResource;

const renderModal = (onRotate = vi.fn().mockResolvedValue({ success: true })) => {
  const onClose = vi.fn();
  render(<KeyRotateModal isOpen asset={asset} etag="etag-1" onRotate={onRotate} onClose={onClose} />);
  return { onRotate, onClose };
};

const stepButton = (name: string) => screen.getByRole('button', { name: new RegExp(`^${name}`) });

describe('KeyRotateModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Confirm step', () => {
    test('Shows the Confirm and Key steps with Confirm current and the warning text', () => {
      renderModal();

      expect(stepButton(ButtonsI18nKey.Confirm)).toHaveAttribute('aria-current', 'step');
      expect(stepButton(KeysI18nKey.KeyValueRevealTitle)).not.toHaveAttribute('aria-current');
      expect(screen.getByText(KeysI18nKey.RotateKeyDescription)).toBeInTheDocument();
    });

    test('Offers Cancel and Rotate, without Next', () => {
      renderModal();

      expect(screen.getByRole('button', { name: ButtonsI18nKey.Cancel })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: ButtonsI18nKey.Rotate })).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: ButtonsI18nKey.Next })).toBeNull();
    });

    test('Does not allow jumping to the Key step from the indicator', async () => {
      const user = userEvent.setup();
      const { onRotate } = renderModal();

      await user.click(stepButton(KeysI18nKey.KeyValueRevealTitle));

      expect(screen.queryByText(GENERATED_KEY)).toBeNull();
      expect(onRotate).not.toHaveBeenCalled();
    });

    test('Calls onClose on Cancel without rotating', async () => {
      const user = userEvent.setup();
      const { onRotate, onClose } = renderModal();

      await user.click(screen.getByRole('button', { name: ButtonsI18nKey.Cancel }));

      expect(onClose).toHaveBeenCalledOnce();
      expect(onRotate).not.toHaveBeenCalled();
    });

    test('Rotate sends the generated key and the etag', async () => {
      const user = userEvent.setup();
      const { onRotate } = renderModal();

      await user.click(screen.getByRole('button', { name: ButtonsI18nKey.Rotate }));

      expect(onRotate).toHaveBeenCalledWith(expect.objectContaining({ name: 'my-key', key: GENERATED_KEY }), 'etag-1');
    });

    test('Stays on the Confirm step when rotation fails', async () => {
      const user = userEvent.setup();
      renderModal(vi.fn().mockResolvedValue({ success: false }));

      await user.click(screen.getByRole('button', { name: ButtonsI18nKey.Rotate }));

      expect(screen.queryByText(GENERATED_KEY)).toBeNull();
      expect(stepButton(ButtonsI18nKey.Confirm)).toHaveAttribute('aria-current', 'step');
    });
  });

  describe('Key step', () => {
    const renderReveal = async () => {
      const user = userEvent.setup();
      const result = renderModal();
      await user.click(screen.getByRole('button', { name: ButtonsI18nKey.Rotate }));
      await screen.findByText(GENERATED_KEY);
      return { user, ...result };
    };

    test('Shows the new key value on the current Key step', async () => {
      await renderReveal();

      expect(stepButton(KeysI18nKey.KeyValueRevealTitle)).toHaveAttribute('aria-current', 'step');
      expect(screen.getByText(KeysI18nKey.RotateKeySuccessTitle)).toBeInTheDocument();
    });

    test('Locks the Confirm step and offers only Close', async () => {
      await renderReveal();

      expect(stepButton(ButtonsI18nKey.Confirm)).toBeDisabled();
      expect(screen.getAllByRole('button', { name: ButtonsI18nKey.Close })).toHaveLength(1);
      expect(screen.queryByRole('button', { name: ButtonsI18nKey.Cancel })).toBeNull();
      expect(screen.queryByRole('button', { name: ButtonsI18nKey.Rotate })).toBeNull();
    });

    test('Close calls onClose', async () => {
      const { user, onClose } = await renderReveal();

      await user.click(screen.getByRole('button', { name: ButtonsI18nKey.Close }));

      expect(onClose).toHaveBeenCalledOnce();
    });
  });
});
