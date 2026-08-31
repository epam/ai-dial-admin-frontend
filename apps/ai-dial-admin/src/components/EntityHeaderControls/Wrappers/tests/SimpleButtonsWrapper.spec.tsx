import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, test, vi } from 'vitest';

import SimpleButtonsWrapper from '@/src/components/EntityHeaderControls/Wrappers/SimpleButtonsWrapper';
import { ButtonsI18nKey } from '@/src/constants/i18n';
import { ApplicationRoute } from '@/src/types/routes';

vi.mock('@/src/hooks/use-is-read-only-admin', () => ({ useIsReadOnlyAdmin: () => false }));
vi.mock('@/src/hooks/use-is-mobile-screen', () => ({ useIsMobileScreen: () => false }));
vi.mock('@/src/hooks/use-is-tablet-screen', () => ({ useIsOnlyTabletScreen: () => false }));

// Captures the getAssetContext prop passed through by SimpleButtonsWrapper.
vi.mock('@/src/components/EntityView/Modals/Delete/Delete', () => ({
  default: ({ getAssetContext }: { getAssetContext?: () => { fetchFiles: () => void; filePath: string } }) => (
    <div>
      <span>received-getAssetContext:{String(!!getAssetContext)}</span>
      <button onClick={() => getAssetContext?.().fetchFiles()}>invoke-getAssetContext</button>
    </div>
  ),
}));

const baseProps = {
  view: ApplicationRoute.PlatformModels,
  entity: { name: 'example-from-admin' },
  isChanged: false,
  onDiscard: vi.fn(),
  onSave: vi.fn(),
  onRemove: vi.fn(),
};

const openDeleteModal = async () => {
  const user = userEvent.setup();
  await user.click(screen.getByRole('button', { name: ButtonsI18nKey.Delete }));
  return user;
};

describe('SimpleButtonsWrapper :: getAssetContext forwarding', () => {
  test('forwards getAssetContext to DeleteConfirmationModal when provided', async () => {
    const fetchFiles = vi.fn();
    const getAssetContext = vi.fn(() => ({ fetchFiles, filePath: 'platform/' }));

    render(<SimpleButtonsWrapper {...baseProps} getAssetContext={getAssetContext} />);

    const user = await openDeleteModal();
    expect(screen.getByText('received-getAssetContext:true')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'invoke-getAssetContext' }));
    expect(fetchFiles).toHaveBeenCalled();
  });

  test('passes undefined getAssetContext when not provided', async () => {
    render(<SimpleButtonsWrapper {...baseProps} />);

    await openDeleteModal();
    expect(screen.getByText('received-getAssetContext:false')).toBeInTheDocument();
  });
});
