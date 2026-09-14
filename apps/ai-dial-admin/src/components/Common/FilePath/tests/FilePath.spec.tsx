import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, test, vi } from 'vitest';

import FilePath from '../FilePath';
import { AssetsFolderContext } from '@/src/context/assets/AssetsFolderContext';
import { Asset } from '@/src/models/dial/deployment-asset';
import { ApplicationRoute } from '@/src/types/routes';

vi.mock('@epam/ai-dial-ui-kit', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@epam/ai-dial-ui-kit')>();
  return {
    ...actual,
    // Mirrors the real component's own `excludedPaths` filtering, so the test exercises the actual
    // contract FilePath relies on rather than assuming FilePath pre-filters `rootItem`/`items` itself.
    DialDestinationFolderPopup: ({
      open,
      rootItem,
      items,
      excludedPaths = [],
    }: {
      open: boolean;
      rootItem?: Asset;
      items: Asset[];
      excludedPaths?: string[];
    }) => {
      if (!open) return null;

      const isExcluded = (path?: string) => !!path && excludedPaths.some((excluded) => `/${path}`.startsWith(excluded));

      return (
        <div>
          {!isExcluded(rootItem?.path) && <span>root:{rootItem?.name}</span>}
          {items
            .filter((item) => !isExcluded(item.path))
            .map((item) => (
              <span key={item.path}>item:{item.name}</span>
            ))}
        </div>
      );
    },
  };
});

const platformRoot = { name: 'platform', path: 'platform/', nodeType: 'FOLDER', items: [] } as unknown as Asset;
const publicRoot = { name: 'public', path: 'public/', nodeType: 'FOLDER', items: [] } as unknown as Asset;

const renderFilePath = (files: Asset[], view = ApplicationRoute.AssetsApplications) => {
  const context = () => ({ files, fetchFiles: vi.fn() }) as unknown as AssetsFolderContext;

  return render(
    <FilePath
      label="label"
      placeholder="placeholder"
      modalTitle="modalTitle"
      value=""
      onChange={vi.fn()}
      context={context}
      view={view}
    />,
  );
};

describe('FilePath', () => {
  test('does not offer the platform bucket as a Move-to destination for a dual-bucket view', async () => {
    const user = userEvent.setup();
    renderFilePath([platformRoot, publicRoot]);

    await user.click(screen.getByRole('button', { name: 'ActionMenuOperation.Move_to' }));

    expect(screen.getByText('item:public')).toBeInTheDocument();
    expect(screen.queryByText('root:platform')).not.toBeInTheDocument();
    expect(screen.queryByText('item:platform')).not.toBeInTheDocument();
  });

  test('offers every root as a Move-to destination for a non-dual-bucket view', async () => {
    const user = userEvent.setup();
    renderFilePath([publicRoot], ApplicationRoute.Prompts);

    await user.click(screen.getByRole('button', { name: 'ActionMenuOperation.Move_to' }));

    expect(screen.getByText('root:public')).toBeInTheDocument();
  });
});
