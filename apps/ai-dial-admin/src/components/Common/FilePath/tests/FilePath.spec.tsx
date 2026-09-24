import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, test, vi } from 'vitest';

import FilePath from '../FilePath';
import { AssetsFolderContextReader } from '@/src/context/assets/AssetsFolderContext';
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

      const isExcluded = (path?: string) => !!path && excludedPaths.some((excluded) => path.startsWith(excluded));

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

const { mockFeatureFlags } = vi.hoisted(() => ({
  mockFeatureFlags: {
    catalogEnabled: true,
  },
}));

vi.mock('@/src/context/AppContext', () => ({
  useAppContext: () => ({ featureFlags: mockFeatureFlags }),
}));

const renderFilePath = (files: Asset[], view = ApplicationRoute.AssetsApplications) => {
  const fetchFiles = vi.fn();
  const context = () => ({ files, fetchFiles }) as unknown as AssetsFolderContextReader;

  render(
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

  return fetchFiles;
};

describe('FilePath', () => {
  test('does not offer the platform bucket as a Move-to destination for a dual-bucket view', async () => {
    const user = userEvent.setup();
    renderFilePath([platformRoot, publicRoot]);

    await user.click(screen.getByRole('button', { name: 'ActionMenuOperation.Move_to' }));

    expect(screen.getByText('item:public')).toBeInTheDocument();
    expect(screen.queryByText('item:platform')).not.toBeInTheDocument();
    expect(screen.queryByText('item:platform')).not.toBeInTheDocument();
  });

  test('offers every root as a Move-to destination for a non-dual-bucket view', async () => {
    const user = userEvent.setup();
    renderFilePath([publicRoot], ApplicationRoute.Prompts);

    await user.click(screen.getByRole('button', { name: 'ActionMenuOperation.Move_to' }));

    expect(screen.getByText('root:public')).toBeInTheDocument();
  });

  test('fetches both bucket roots for a dual-bucket view when Catalog is enabled', () => {
    mockFeatureFlags.catalogEnabled = true;

    const fetchFiles = renderFilePath([]);

    expect(fetchFiles).toHaveBeenCalledOnce();
    expect(fetchFiles).toHaveBeenCalledWith(['platform/', 'public/']);
  });

  test('fetches only the public root for a dual-bucket view when Catalog is disabled', () => {
    mockFeatureFlags.catalogEnabled = false;

    const fetchFiles = renderFilePath([]);

    expect(fetchFiles).toHaveBeenCalledOnce();
    expect(fetchFiles).toHaveBeenCalledWith('public/');
  });
});
