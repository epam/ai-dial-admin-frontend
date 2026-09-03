import { DialFileNodeType } from '@epam/ai-dial-ui-kit';
import { fireEvent, render, screen } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import {
  bulkDeletePlatformToolsets,
  bulkDeleteToolsets,
  createPlatformToolset,
  createToolset,
  getPlatformToolset,
  getToolset,
} from '@/src/app/[lang]/assets-toolsets/actions';
import { ApplicationRoute } from '@/src/types/routes';
import BaseAssetList from '../BaseAssetList';

vi.mock('@/src/app/[lang]/assets-toolsets/actions', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/src/app/[lang]/assets-toolsets/actions')>()),
  getToolset: vi
    .fn()
    .mockResolvedValue({ success: true, response: { name: 'toolset', path: 'public/folder/toolset__1.0' } }),
  createToolset: vi.fn().mockResolvedValue({ success: true, response: {} }),
  bulkDeleteToolsets: vi.fn().mockResolvedValue({ success: true }),
  getPlatformToolset: vi
    .fn()
    .mockResolvedValue({ success: true, response: { name: 'platform-toolset', path: 'platform/platform-toolset' } }),
  createPlatformToolset: vi.fn().mockResolvedValue({ success: true, response: {} }),
  bulkDeletePlatformToolsets: vi.fn().mockResolvedValue({ success: true }),
}));

// Stable references across renders: BaseAssetList's mount effect depends on `data`/
// `fetchedFoldersData` referentially, so a mock returning fresh `{}`/`[]` literals per call would
// retrigger that effect (and its state updates) forever — `vi.hoisted` keeps one shared instance.
const { mockData, mockFetchedFoldersData } = vi.hoisted(() => ({
  mockData: [] as unknown[],
  mockFetchedFoldersData: {} as Record<string, unknown[]>,
}));

vi.mock('@/src/context/assets/ToolsetsFolderContext', () => ({
  useToolsetFolder: () => ({
    fetchFiles: vi.fn(),
    filePath: '',
    data: mockData,
    fetchedFoldersData: mockFetchedFoldersData,
    setFilePath: vi.fn(),
  }),
  ToolsetFolderProvider: ({ children }: any) => <div>{children}</div>,
}));

vi.mock('@/src/components/Common/FileManager/FileManager', () => ({
  __esModule: true,
  default: (props: any) => (
    <>
      <button
        onClick={() =>
          props.customDuplicateAction([
            { name: 'platform-toolset', path: 'platform/platform-toolset', nodeType: DialFileNodeType.ITEM },
          ])
        }
      >
        fetch-duplicate-platform
      </button>
      <button
        onClick={() =>
          props.customDuplicateAction([
            { name: 'toolset', path: 'public/folder/toolset__1.0', nodeType: DialFileNodeType.ITEM },
          ])
        }
      >
        fetch-duplicate-public
      </button>
      <button
        onClick={() =>
          props.customDeleteItemsAction(
            [{ name: 'platform-toolset', path: 'platform/platform-toolset', nodeType: DialFileNodeType.ITEM }],
            'platform/',
          )
        }
      >
        select-delete-platform
      </button>
      <button
        onClick={() =>
          props.customDeleteItemsAction(
            [{ name: 'toolset', path: 'public/folder/toolset__1.0', nodeType: DialFileNodeType.ITEM }],
            'public/folder/',
          )
        }
      >
        select-delete-public
      </button>
    </>
  ),
}));

vi.mock('../Modals', () => ({
  __esModule: true,
  default: (props: any) => (
    <>
      <button onClick={() => props.onCreate({ name: 'new-platform-toolset', endpoint: '' }, 'platform/')}>
        create-platform
      </button>
      <button onClick={() => props.onCreate({ name: 'new-toolset', endpoint: '' }, 'public/folder/')}>
        create-public
      </button>
      {/* Fixed fixtures, decoupled from `duplicateItem` state — this isolates `handleDuplicate`'s own
          bucket-branch decision from `handleDuplicateModalOpen`'s async fetch, tested separately above. */}
      <button
        onClick={() =>
          props.onDuplicate({
            name: 'copy-of-platform-toolset',
            path: 'platform/platform-toolset',
            folderId: undefined,
          })
        }
      >
        confirm-duplicate-platform
      </button>
      <button
        onClick={() =>
          props.onDuplicate({ name: 'copy-of-toolset', folderId: 'public/folder/', path: 'public/folder/toolset__1.0' })
        }
      >
        confirm-duplicate-public
      </button>
      <button onClick={() => props.onRemove()}>confirm-remove</button>
    </>
  ),
}));

/**
 * Toolsets is the second view where which server action to call depends on the target's bucket
 * (`platform/` vs `public/`), resolved per call rather than by view alone (design.md D2/
 * `platform-toolsets`) — mirrors `platform-applications-bucket.spec.tsx`. This asserts each of
 * `BaseAssetList`'s bucket-aware branches routes to the platform function for a platform-bucket
 * target and to the existing public function otherwise.
 */
describe('BaseAssetList :: AssetsToolsets bucket-aware branches', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useRouter).mockReturnValue({ push: vi.fn() } as unknown as ReturnType<typeof useRouter>);
  });

  test('Fetching a duplicate source on a platform-bucket row calls getPlatformToolset, not getToolset', async () => {
    render(<BaseAssetList view={ApplicationRoute.AssetsToolsets} />);

    fireEvent.click(screen.getByText('fetch-duplicate-platform'));

    await vi.waitFor(() =>
      expect(getPlatformToolset).toHaveBeenCalledWith('platform/platform-toolset', expect.anything()),
    );
    expect(getToolset).not.toHaveBeenCalled();
  });

  test('Fetching a duplicate source on a public-bucket row calls getToolset, not getPlatformToolset', async () => {
    render(<BaseAssetList view={ApplicationRoute.AssetsToolsets} />);

    fireEvent.click(screen.getByText('fetch-duplicate-public'));

    await vi.waitFor(() => expect(getToolset).toHaveBeenCalledWith('public/folder/toolset__1.0', expect.anything()));
    expect(getPlatformToolset).not.toHaveBeenCalled();
  });

  test('Confirming a duplicate of a platform-bucket asset calls createPlatformToolset, not createToolset', async () => {
    render(<BaseAssetList view={ApplicationRoute.AssetsToolsets} />);

    fireEvent.click(screen.getByText('confirm-duplicate-platform'));

    await vi.waitFor(() => expect(createPlatformToolset).toHaveBeenCalledOnce());
    expect(createToolset).not.toHaveBeenCalled();
  });

  // Regression: `getPlatformAssetDuplicate` strips `folderId`/`path` from the duplicated asset
  // (Core's platform-bucket write doesn't want them) — the post-duplicate redirect must restore a
  // bucket signal itself, or `getEntityPath` falls through to the versioned-path branch and builds
  // `?path=undefined{name}__` instead of a bare, no-`?path=` platform URL (design.md D5).
  test('Confirming a duplicate of a platform-bucket asset redirects to the bare name, with no ?path=', async () => {
    const push = vi.fn();
    vi.mocked(useRouter).mockReturnValue({ push } as unknown as ReturnType<typeof useRouter>);

    render(<BaseAssetList view={ApplicationRoute.AssetsToolsets} />);

    fireEvent.click(screen.getByText('confirm-duplicate-platform'));

    await vi.waitFor(() => expect(push).toHaveBeenCalledWith('/assets-toolsets/copy-of-platform-toolset'));
  });

  test('Confirming a duplicate of a public-bucket asset calls createToolset, not createPlatformToolset', async () => {
    render(<BaseAssetList view={ApplicationRoute.AssetsToolsets} />);

    fireEvent.click(screen.getByText('confirm-duplicate-public'));

    await vi.waitFor(() => expect(createToolset).toHaveBeenCalledOnce());
    expect(createPlatformToolset).not.toHaveBeenCalled();
  });

  test('Create targeting the platform bucket calls createPlatformToolset, not createToolset', async () => {
    render(<BaseAssetList view={ApplicationRoute.AssetsToolsets} />);

    fireEvent.click(screen.getByText('create-platform'));

    await vi.waitFor(() => expect(createPlatformToolset).toHaveBeenCalledOnce());
    expect(createToolset).not.toHaveBeenCalled();
  });

  test('Create targeting the public bucket calls createToolset, not createPlatformToolset', async () => {
    render(<BaseAssetList view={ApplicationRoute.AssetsToolsets} />);

    fireEvent.click(screen.getByText('create-public'));

    await vi.waitFor(() => expect(createToolset).toHaveBeenCalledOnce());
    expect(createPlatformToolset).not.toHaveBeenCalled();
  });

  test('Bulk delete of platform-bucket rows calls bulkDeletePlatformToolsets, not bulkDeleteToolsets', async () => {
    render(<BaseAssetList view={ApplicationRoute.AssetsToolsets} />);

    fireEvent.click(screen.getByText('select-delete-platform'));
    fireEvent.click(screen.getByText('confirm-remove'));

    await vi.waitFor(() => expect(bulkDeletePlatformToolsets).toHaveBeenCalledOnce());
    expect(bulkDeleteToolsets).not.toHaveBeenCalled();
  });

  test('Bulk delete of public-bucket rows calls bulkDeleteToolsets, not bulkDeletePlatformToolsets', async () => {
    render(<BaseAssetList view={ApplicationRoute.AssetsToolsets} />);

    fireEvent.click(screen.getByText('select-delete-public'));
    fireEvent.click(screen.getByText('confirm-remove'));

    await vi.waitFor(() => expect(bulkDeleteToolsets).toHaveBeenCalledOnce());
    expect(bulkDeletePlatformToolsets).not.toHaveBeenCalled();
  });
});
