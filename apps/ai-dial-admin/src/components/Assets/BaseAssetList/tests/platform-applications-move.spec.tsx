import { DialFileNodeType } from '@epam/ai-dial-ui-kit';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';

import { moveApps } from '@/src/app/[lang]/assets-applications/actions';
import { ApplicationRoute } from '@/src/types/routes';
import BaseAssetList from '../BaseAssetList';

vi.mock('@/src/app/[lang]/assets-applications/actions', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/src/app/[lang]/assets-applications/actions')>()),
  moveApps: vi.fn().mockResolvedValue([{ success: true }]),
}));

// Stable references across renders — see the identical note in platform-applications-bucket.spec.tsx.
const { mockData, mockFetchedFoldersData } = vi.hoisted(() => ({
  mockData: [] as unknown[],
  mockFetchedFoldersData: {} as Record<string, unknown[]>,
}));

vi.mock('@/src/context/assets/AppsFolderContext', () => ({
  useAppsFolder: () => ({
    fetchFiles: vi.fn(),
    filePath: 'public/folder/',
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
          props.onMoveItems(
            [
              {
                sourceUrl: 'platform/platform-app',
                destinationUrl: 'platform/other-folder/platform-app',
                nodeType: DialFileNodeType.ITEM,
              },
            ],
            'platform/',
            'platform/other-folder/',
          )
        }
      >
        move-platform-row
      </button>
      <button
        onClick={() =>
          props.onMoveItems(
            [
              {
                sourceUrl: 'public/folder/app__1.0',
                destinationUrl: 'public/other-folder/app__1.0',
                nodeType: DialFileNodeType.ITEM,
              },
            ],
            'public/folder/',
            'public/other-folder/',
          )
        }
      >
        move-public-row
      </button>
    </>
  ),
}));

/**
 * Regression (4.4): a platform-bucket row (AssetsApplications browsed under `platform/`) has no
 * folder concept — Core has no move route for it — so `handleMoveItems` must skip it rather than
 * issue a bogus `moveApps` call. Public-bucket rows in the same dual-bucket view stay movable.
 */
describe('BaseAssetList :: handleMoveItems skips platform-bucket rows', () => {
  test('moving a platform-bucket row does not call moveApps', async () => {
    render(<BaseAssetList view={ApplicationRoute.AssetsApplications} />);

    fireEvent.click(screen.getByText('move-platform-row'));

    // No promise is queued for a platform-bucket row, so there is nothing to await beyond this tick.
    await vi.waitFor(() => expect(moveApps).not.toHaveBeenCalled());
  });

  test('moving a public-bucket row calls moveApps', async () => {
    render(<BaseAssetList view={ApplicationRoute.AssetsApplications} />);

    fireEvent.click(screen.getByText('move-public-row'));

    await vi.waitFor(() => expect(moveApps).toHaveBeenCalledOnce());
  });
});
