import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useRouter } from 'next/navigation';
import { createElement } from 'react';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import { createKey, getKeyRolesOptions } from '@/src/app/[lang]/platform-keys/actions';
import { ButtonsI18nKey, EntityFieldsI18nKey, KeysI18nKey, TabsI18nKey } from '@/src/constants/i18n';
import CreateKeyModal from '../CreateKeyModal';

const GENERATED_KEY = 'created-test-key-123';

vi.mock('@/src/app/[lang]/platform-keys/actions', () => ({
  createKey: vi.fn(),
  getKeyRolesOptions: vi.fn(),
}));

vi.mock('@/src/utils/keys/generate-key', () => ({
  generateKey: vi.fn(() => GENERATED_KEY),
}));

vi.mock('@/src/utils/open-in-new-tab', () => ({
  getUrnForEntity: vi.fn(() => '/en/platform-keys/new-key'),
}));

vi.mock('@/src/components/Grid/GridView/GridView', () => ({
  default: ({
    rowData,
    additionalGridOptions,
  }: {
    rowData: Array<{ name: string }>;
    additionalGridOptions: { onSelectionChanged: (event: unknown) => void };
  }) =>
    createElement(
      'div',
      null,
      rowData.map((row) =>
        createElement(
          'button',
          {
            key: row.name,
            onClick: () => additionalGridOptions.onSelectionChanged({ api: { getSelectedRows: () => [row] } }),
          },
          `select ${row.name}`,
        ),
      ),
    ),
}));

const stepButton = (name: string) => screen.getByRole('button', { name: new RegExp(`^${name}`) });

const renderModal = (onClose = vi.fn()) => {
  const mockPush = vi.fn();
  vi.mocked(useRouter).mockReturnValue({ push: mockPush } as unknown as ReturnType<typeof useRouter>);
  render(<CreateKeyModal isOpen names={[]} onClose={onClose} />);
  return { onClose, mockPush };
};

const fillDetails = () => {
  fireEvent.change(screen.getByRole('textbox', { name: /entityfields.id/i }), { target: { value: 'new-key' } });
  fireEvent.change(screen.getByRole('textbox', { name: new RegExp(EntityFieldsI18nKey.project) }), {
    target: { value: 'my-project' },
  });
};

const goToRoles = async (user: ReturnType<typeof userEvent.setup>) => {
  fillDetails();
  await user.click(screen.getByRole('button', { name: ButtonsI18nKey.Next }));
  await screen.findByText('select admin');
};

describe('CreateKeyModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getKeyRolesOptions).mockResolvedValue([{ name: 'admin' }] as never);
    vi.mocked(createKey).mockResolvedValue({ success: true });
  });

  describe('Details step', () => {
    test('Shows the three steps with Details current', () => {
      renderModal();

      expect(stepButton(TabsI18nKey.Properties)).toHaveAttribute('aria-current', 'step');
      expect(stepButton(TabsI18nKey.Roles)).not.toHaveAttribute('aria-current');
      expect(stepButton(KeysI18nKey.KeyValueRevealTitle)).not.toHaveAttribute('aria-current');
    });

    test('Next is unavailable until name and project are filled', () => {
      renderModal();

      expect(screen.getByRole('button', { name: ButtonsI18nKey.Next })).toBeDisabled();

      fillDetails();

      expect(screen.getByRole('button', { name: ButtonsI18nKey.Next })).toBeEnabled();
    });

    test('Does not allow jumping to Roles from the indicator while details are invalid', async () => {
      const user = userEvent.setup();
      renderModal();

      await user.click(stepButton(TabsI18nKey.Roles));

      expect(stepButton(TabsI18nKey.Properties)).toHaveAttribute('aria-current', 'step');
    });
  });

  describe('Roles step', () => {
    test('Offers Create instead of Next, disabled until a role is selected', async () => {
      const user = userEvent.setup();
      renderModal();
      await goToRoles(user);

      expect(screen.queryByRole('button', { name: ButtonsI18nKey.Next })).toBeNull();
      expect(screen.getByRole('button', { name: ButtonsI18nKey.Create })).toBeDisabled();

      await user.click(screen.getByRole('button', { name: 'select admin' }));

      expect(screen.getByRole('button', { name: ButtonsI18nKey.Create })).toBeEnabled();
    });

    test('Back returns to Details with the entered values kept', async () => {
      const user = userEvent.setup();
      renderModal();
      await goToRoles(user);

      await user.click(screen.getByRole('button', { name: ButtonsI18nKey.Back }));

      expect(screen.getByRole('textbox', { name: /entityfields.id/i })).toHaveValue('new-key');
    });

    test('Create calls createKey with the details, selected roles and generated key', async () => {
      const user = userEvent.setup();
      renderModal();
      await goToRoles(user);
      await user.click(screen.getByRole('button', { name: 'select admin' }));

      await user.click(screen.getByRole('button', { name: ButtonsI18nKey.Create }));

      expect(createKey).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'new-key', project: 'my-project', roles: ['admin'], key: GENERATED_KEY }),
      );
    });

    test('Stays on the Roles step when createKey fails', async () => {
      vi.mocked(createKey).mockResolvedValue({ success: false });
      const user = userEvent.setup();
      renderModal();
      await goToRoles(user);
      await user.click(screen.getByRole('button', { name: 'select admin' }));

      await user.click(screen.getByRole('button', { name: ButtonsI18nKey.Create }));

      expect(screen.queryByText(GENERATED_KEY)).toBeNull();
      expect(stepButton(TabsI18nKey.Roles)).toHaveAttribute('aria-current', 'step');
    });
  });

  describe('Key step', () => {
    const renderReveal = async () => {
      const user = userEvent.setup();
      const result = renderModal();
      await goToRoles(user);
      await user.click(screen.getByRole('button', { name: 'select admin' }));
      await user.click(screen.getByRole('button', { name: ButtonsI18nKey.Create }));
      await screen.findByText(GENERATED_KEY);
      return { user, ...result };
    };

    test('Shows the generated key on the current Key step', async () => {
      await renderReveal();

      expect(stepButton(KeysI18nKey.KeyValueRevealTitle)).toHaveAttribute('aria-current', 'step');
      expect(screen.getByText(GENERATED_KEY)).toBeInTheDocument();
    });

    test('Locks the earlier steps and offers only Close', async () => {
      await renderReveal();

      expect(stepButton(TabsI18nKey.Properties)).toBeDisabled();
      expect(stepButton(TabsI18nKey.Roles)).toBeDisabled();
      expect(screen.getAllByRole('button', { name: ButtonsI18nKey.Close })).toHaveLength(1);
      expect(screen.queryByRole('button', { name: ButtonsI18nKey.Cancel })).toBeNull();
      expect(screen.queryByRole('button', { name: ButtonsI18nKey.Back })).toBeNull();
    });

    test('Close closes the modal and navigates to the new key', async () => {
      const { user, onClose, mockPush } = await renderReveal();

      await user.click(screen.getByRole('button', { name: ButtonsI18nKey.Close }));

      expect(onClose).toHaveBeenCalledOnce();
      expect(mockPush).toHaveBeenCalledWith('/en/platform-keys/new-key');
    });
  });
});
