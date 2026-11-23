import { render, screen } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';

import { ApplicationRoute } from '@/src/types/routes';
import Modals from '../Modals';
import { ModalType } from '../types';

vi.mock('@/src/components/Assets/Modals/DuplicateAsset', () => ({
  default: () => <div>duplicate-asset</div>,
}));

const renderDuplicateModal = (view: ApplicationRoute, duplicateItem: Record<string, unknown>) => {
  render(
    <Modals
      view={view}
      isModalOpen
      modalType={ModalType.duplicate}
      duplicateItem={duplicateItem as never}
      getContext={() => ({}) as never}
      onClose={vi.fn()}
      onRemove={vi.fn()}
    />,
  );
};

describe('Modals :: duplicate modal dispatch', () => {
  test.each([ApplicationRoute.AssetsApplications, ApplicationRoute.AssetsToolsets])(
    'renders DuplicateAsset for a %s row',
    (view) => {
      renderDuplicateModal(view, {
        name: 'MyEntity',
        _metadata: { folderId: 'public/' },
        path: 'public/MyEntity__1.0',
      });

      expect(screen.getByText('duplicate-asset')).toBeInTheDocument();
    },
  );
});
