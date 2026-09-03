import { render, screen } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';

import { ApplicationRoute } from '@/src/types/routes';
import Modals from '../Modals';
import { ModalType } from '../types';

vi.mock('@/src/components/Assets/Modals/DuplicatePlatformAsset', () => ({
  default: () => <div>duplicate-platform-asset</div>,
}));
vi.mock('@/src/components/Assets/Deployments/DuplicateAsset', () => ({
  default: () => <div>duplicate-asset</div>,
}));

const renderDuplicateModal = (view: ApplicationRoute, duplicateItem: Record<string, unknown>) => {
  render(
    <Modals
      view={view}
      isModalOpen
      modalType={ModalType.duplicate}
      duplicateItem={duplicateItem as never}
      hasSelectedItems={false}
      getContext={() => ({}) as never}
      onClose={vi.fn()}
      onRemove={vi.fn()}
    />,
  );
};

/**
 * Regression: a platform-bucket application/toolset row must duplicate the same flat, unversioned
 * way the six other flat platform views already do (design.md D2/`platform-applications`/
 * `platform-toolsets`) — not the versioned `DuplicateAsset` flow (select new version vs. new entity,
 * enter a version) that a public-bucket row still gets.
 */
describe('Modals :: duplicate modal dispatch for dual-bucket views', () => {
  test.each([ApplicationRoute.AssetsApplications, ApplicationRoute.AssetsToolsets])(
    'renders DuplicatePlatformAsset, not DuplicateAsset, for a platform-bucket %s row',
    (view) => {
      renderDuplicateModal(view, { name: 'pl_Ts', folderId: 'platform/', path: 'platform/pl_Ts' });

      expect(screen.getByText('duplicate-platform-asset')).toBeInTheDocument();
      expect(screen.queryByText('duplicate-asset')).not.toBeInTheDocument();
    },
  );

  test.each([ApplicationRoute.AssetsApplications, ApplicationRoute.AssetsToolsets])(
    'renders DuplicateAsset, unchanged, for a public-bucket %s row',
    (view) => {
      renderDuplicateModal(view, { name: 'MyEntity', folderId: 'public/', path: 'public/MyEntity__1.0' });

      expect(screen.getByText('duplicate-asset')).toBeInTheDocument();
      expect(screen.queryByText('duplicate-platform-asset')).not.toBeInTheDocument();
    },
  );
});
