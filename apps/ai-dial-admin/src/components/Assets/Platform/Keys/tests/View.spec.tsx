import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, test, vi } from 'vitest';

import { ButtonsI18nKey } from '@/src/constants/i18n';
import { useIsReadOnlyAdmin } from '@/src/hooks/use-is-read-only-admin';
import { DialKeyResource } from '@/src/models/dial/resource';
import KeyAssetView from '../View';

vi.mock('@/src/hooks/use-is-read-only-admin', () => ({
  useIsReadOnlyAdmin: vi.fn(() => false),
}));

vi.mock('@/src/app/[lang]/platform-keys/actions', () => ({
  updateKey: vi.fn(async () => ({ success: true })),
  removeKey: vi.fn(async () => ({ success: true })),
  rotateKey: vi.fn(async () => ({ success: true })),
}));

vi.mock('@/src/hooks/use-protected-request', () => ({
  useProtectedRequest: () =>
    vi.fn(async (fn: (...args: unknown[]) => Promise<unknown>, ...args: unknown[]) => fn(...args)),
}));

// Override test-setup's bare `useRouter: vi.fn()` with one that has a refresh spy.
vi.mock('next/navigation', async (importOriginal) => ({
  ...(await importOriginal<typeof import('next/navigation')>()),
  useRouter: vi.fn(() => ({ refresh: vi.fn(), push: vi.fn(), replace: vi.fn() })),
  usePathname: vi.fn(() => '/assets-keys'),
}));

vi.mock('@/src/components/EntityHeaderControls/SimpleHeader', () => ({
  default: ({
    children,
    onSave,
    onDiscard,
  }: {
    children?: React.ReactNode;
    onSave: () => void;
    onDiscard: () => void;
  }) => (
    <div>
      {children}
      <button onClick={onSave}>Save</button>
      <button onClick={onDiscard}>Discard</button>
    </div>
  ),
}));

vi.mock('../TabsContent', () => ({
  default: () => <div>TabsContent</div>,
}));

vi.mock('../KeyRotateModal', () => ({
  default: ({ isOpen }: { isOpen: boolean }) => (isOpen ? <div>KeyRotateModal</div> : null),
}));

vi.mock('@/src/components/EntityTabs/JsonEditor/JsonEditor', () => ({
  default: () => <div>JsonEditor</div>,
}));

const baseKey: DialKeyResource = {
  name: 'my-key',
  path: 'my-key',
  folderId: '',
} as unknown as DialKeyResource;

const renderView = (key: Partial<DialKeyResource> = {}) =>
  render(<KeyAssetView etag='"etag"' originalKey={{ ...baseKey, ...key }} roles={[]} />);

describe('KeyAssetView', () => {
  beforeEach(() => {
    vi.mocked(useIsReadOnlyAdmin).mockReturnValue(false);
  });

  test('Renders the TabsContent by default', () => {
    renderView();

    expect(screen.getByText('TabsContent')).toBeInTheDocument();
  });

  test('Renders the Rotate button for a write admin', () => {
    renderView();

    expect(screen.getByRole('button', { name: ButtonsI18nKey.Rotate })).toBeInTheDocument();
  });

  test('Opens the KeyRotateModal when Rotate is clicked', async () => {
    const user = userEvent.setup();
    renderView();

    await user.click(screen.getByRole('button', { name: ButtonsI18nKey.Rotate }));

    expect(screen.getByText('KeyRotateModal')).toBeInTheDocument();
  });

  test('Does not render the Rotate button for a read-only admin', () => {
    vi.mocked(useIsReadOnlyAdmin).mockReturnValue(true);

    renderView();

    expect(screen.queryByRole('button', { name: ButtonsI18nKey.Rotate })).not.toBeInTheDocument();
  });

  test('Calls updateKey when Save is clicked', async () => {
    const user = userEvent.setup();
    const { updateKey } = vi.mocked(await import('@/src/app/[lang]/platform-keys/actions'));
    renderView();

    await user.click(screen.getByText('Save'));

    expect(updateKey).toHaveBeenCalledWith(expect.objectContaining({ name: 'my-key' }), '"etag"');
  });
});
