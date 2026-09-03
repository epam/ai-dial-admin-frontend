import { DialFileNodeType } from '@epam/ai-dial-ui-kit';
import { fireEvent, render, screen } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import {
  bulkDeleteApps,
  bulkDeletePlatformApplications,
  createApp,
  createPlatformApplication,
  getApp,
  getPlatformApplication,
} from '@/src/app/[lang]/assets-applications/actions';
import { ApplicationRoute } from '@/src/types/routes';
import BaseAssetList from '../BaseAssetList';

vi.mock('@/src/app/[lang]/assets-applications/actions', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/src/app/[lang]/assets-applications/actions')>()),
  getApp: vi.fn().mockResolvedValue({ success: true, response: { name: 'app', path: 'public/folder/app__1.0' } }),
  createApp: vi.fn().mockResolvedValue({ success: true, response: {} }),
  bulkDeleteApps: vi.fn().mockResolvedValue({ success: true }),
  getPlatformApplication: vi
    .fn()
    .mockResolvedValue({ success: true, response: { name: 'platform-app', path: 'platform/platform-app' } }),
  createPlatformApplication: vi.fn().mockResolvedValue({ success: true, response: {} }),
  bulkDeletePlatformApplications: vi.fn().mockResolvedValue({ success: true }),
}));

// Stable references across renders: BaseAssetList's mount effect depends on `data`/
// `fetchedFoldersData` referentially, so a mock returning fresh `{}`/`[]` literals per call would
// retrigger that effect (and its state updates) forever — `vi.hoisted` keeps one shared instance.
const { mockData, mockFetchedFoldersData } = vi.hoisted(() => ({
  mockData: [] as unknown[],
  mockFetchedFoldersData: {} as Record<string, unknown[]>,
}));

vi.mock('@/src/context/assets/AppsFolderContext', () => ({
  useAppsFolder: () => ({
    fetchFiles: vi.fn(),
    filePath: '',
    data: mockData,
    fetchedFoldersData: mockFetchedFoldersData,
    setFilePath: vi.fn(),
  }),
  AppsFolderProvider: ({ children }: any) => <div>{children}</div>,
}));

vi.mock('@/src/components/Common/FileManager/FileManager', () => ({
  __esModule: true,
  default: (props: any) => (
    <>
      <button
        onClick={() =>
          props.customDuplicateAction([
            { name: 'platform-app', path: 'platform/platform-app', nodeType: DialFileNodeType.ITEM },
          ])
        }
      >
        fetch-duplicate-platform
      </button>
      <button
        onClick={() =>
          props.customDuplicateAction([
            { name: 'app', path: 'public/folder/app__1.0', nodeType: DialFileNodeType.ITEM },
          ])
        }
      >
        fetch-duplicate-public
      </button>
      <button
        onClick={() =>
          props.customDeleteItemsAction(
            [{ name: 'platform-app', path: 'platform/platform-app', nodeType: DialFileNodeType.ITEM }],
            'platform/',
          )
        }
      >
        select-delete-platform
      </button>
      <button
        onClick={() =>
          props.customDeleteItemsAction(
            [{ name: 'app', path: 'public/folder/app__1.0', nodeType: DialFileNodeType.ITEM }],
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
      <button onClick={() => props.onCreate({ name: 'new-platform-app', endpoint: '' }, 'platform/')}>
        create-platform
      </button>
      <button onClick={() => props.onCreate({ name: 'new-app', endpoint: '' }, 'public/folder/')}>create-public</button>
      {/* Fixed fixtures, decoupled from `duplicateItem` state — this isolates `handleDuplicate`'s own
          bucket-branch decision from `handleDuplicateModalOpen`'s async fetch, tested separately above. */}
      <button
        onClick={() =>
          props.onDuplicate({ name: 'copy-of-platform-app', path: 'platform/platform-app', folderId: undefined })
        }
      >
        confirm-duplicate-platform
      </button>
      <button
        onClick={() =>
          props.onDuplicate({ name: 'copy-of-app', folderId: 'public/folder/', path: 'public/folder/app__1.0' })
        }
      >
        confirm-duplicate-public
      </button>
      <button onClick={() => props.onRemove()}>confirm-remove</button>
    </>
  ),
}));

/**
 * Applications is the one view where which server action to call depends on the target's bucket
 * (`platform/` vs `public/`), resolved per call rather than by view alone (design.md D2/
 * `platform-applications`). This asserts each of `BaseAssetList`'s bucket-aware branches routes to
 * the platform function for a platform-bucket target and to the existing public function otherwise.
 */
describe('BaseAssetList :: AssetsApplications bucket-aware branches', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useRouter).mockReturnValue({ push: vi.fn() } as unknown as ReturnType<typeof useRouter>);
  });

  test('Fetching a duplicate source on a platform-bucket row calls getPlatformApplication, not getApp', async () => {
    render(<BaseAssetList view={ApplicationRoute.AssetsApplications} />);

    fireEvent.click(screen.getByText('fetch-duplicate-platform'));

    await vi.waitFor(() =>
      expect(getPlatformApplication).toHaveBeenCalledWith('platform/platform-app', expect.anything()),
    );
    expect(getApp).not.toHaveBeenCalled();
  });

  test('Fetching a duplicate source on a public-bucket row calls getApp, not getPlatformApplication', async () => {
    render(<BaseAssetList view={ApplicationRoute.AssetsApplications} />);

    fireEvent.click(screen.getByText('fetch-duplicate-public'));

    await vi.waitFor(() => expect(getApp).toHaveBeenCalledWith('public/folder/app__1.0', expect.anything()));
    expect(getPlatformApplication).not.toHaveBeenCalled();
  });

  test('Confirming a duplicate of a platform-bucket asset calls createPlatformApplication, not createApp', async () => {
    render(<BaseAssetList view={ApplicationRoute.AssetsApplications} />);

    fireEvent.click(screen.getByText('confirm-duplicate-platform'));

    await vi.waitFor(() => expect(createPlatformApplication).toHaveBeenCalledOnce());
    expect(createApp).not.toHaveBeenCalled();
  });

  // Regression: `getPlatformAssetDuplicate` strips `folderId`/`path` from the duplicated asset
  // (Core's platform-bucket write doesn't want them) — the post-duplicate redirect must restore a
  // bucket signal itself, or `getEntityPath` falls through to the versioned-path branch and builds
  // `?path=undefined{name}__` instead of a bare, no-`?path=` platform URL (design.md D5).
  test('Confirming a duplicate of a platform-bucket asset redirects to the bare name, with no ?path=', async () => {
    const push = vi.fn();
    vi.mocked(useRouter).mockReturnValue({ push } as unknown as ReturnType<typeof useRouter>);

    render(<BaseAssetList view={ApplicationRoute.AssetsApplications} />);

    fireEvent.click(screen.getByText('confirm-duplicate-platform'));

    await vi.waitFor(() => expect(push).toHaveBeenCalledWith('/assets-applications/copy-of-platform-app'));
  });

  test('Confirming a duplicate of a public-bucket asset calls createApp, not createPlatformApplication', async () => {
    render(<BaseAssetList view={ApplicationRoute.AssetsApplications} />);

    fireEvent.click(screen.getByText('confirm-duplicate-public'));

    await vi.waitFor(() => expect(createApp).toHaveBeenCalledOnce());
    expect(createPlatformApplication).not.toHaveBeenCalled();
  });

  test('Create targeting the platform bucket calls createPlatformApplication, not createApp', async () => {
    render(<BaseAssetList view={ApplicationRoute.AssetsApplications} />);

    fireEvent.click(screen.getByText('create-platform'));

    await vi.waitFor(() => expect(createPlatformApplication).toHaveBeenCalledOnce());
    expect(createApp).not.toHaveBeenCalled();
  });

  test('Create targeting the public bucket calls createApp, not createPlatformApplication', async () => {
    render(<BaseAssetList view={ApplicationRoute.AssetsApplications} />);

    fireEvent.click(screen.getByText('create-public'));

    await vi.waitFor(() => expect(createApp).toHaveBeenCalledOnce());
    expect(createPlatformApplication).not.toHaveBeenCalled();
  });

  test('Bulk delete of platform-bucket rows calls bulkDeletePlatformApplications, not bulkDeleteApps', async () => {
    render(<BaseAssetList view={ApplicationRoute.AssetsApplications} />);

    fireEvent.click(screen.getByText('select-delete-platform'));
    fireEvent.click(screen.getByText('confirm-remove'));

    await vi.waitFor(() => expect(bulkDeletePlatformApplications).toHaveBeenCalledOnce());
    expect(bulkDeleteApps).not.toHaveBeenCalled();
  });

  test('Bulk delete of public-bucket rows calls bulkDeleteApps, not bulkDeletePlatformApplications', async () => {
    render(<BaseAssetList view={ApplicationRoute.AssetsApplications} />);

    fireEvent.click(screen.getByText('select-delete-public'));
    fireEvent.click(screen.getByText('confirm-remove'));

    await vi.waitFor(() => expect(bulkDeleteApps).toHaveBeenCalledOnce());
    expect(bulkDeletePlatformApplications).not.toHaveBeenCalled();
  });
});
