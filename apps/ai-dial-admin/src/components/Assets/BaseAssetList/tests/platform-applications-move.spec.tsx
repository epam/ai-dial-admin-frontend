import { DialFileNodeType } from '@epam/ai-dial-react-file-manager';
import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import { moveApps } from '@/src/app/[lang]/assets-applications/actions';
import { ApplicationRoute } from '@/src/types/routes';
import BaseAssetList from '../BaseAssetList';

vi.mock('@/src/app/[lang]/assets-applications/actions', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/src/app/[lang]/assets-applications/actions')>()),
  moveApps: vi.fn().mockResolvedValue([{ success: true }]),
}));

// Stable references across renders — see the identical note in platform-applications-bucket.spec.tsx.
const { mockFetchedFoldersData } = vi.hoisted(() => ({
  mockFetchedFoldersData: {} as Record<string, unknown[]>,
}));

vi.mock('@/src/context/assets/AppsFolderContext', () => ({
  useAppsFolder: () => ({
    fetchFiles: vi.fn(),
    filePath: 'public/folder/',
    fetchedFoldersData: mockFetchedFoldersData,
    setFilePath: vi.fn(),
  }),
  AppsFolderProvider: ({ children }: any) => <div>{children}</div>,
}));

vi.mock('@/src/components/Common/FileManager/FileManager', () => ({
  __esModule: true,
  default: (props: any) => (
    <>
      <output>moving:{props.movingItems}</output>
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

describe('BaseAssetList :: handleMoveItems', () => {
  beforeEach(() => {
    vi.mocked(moveApps).mockClear();
  });

  test('moving a public-bucket row calls moveApps', async () => {
    render(<BaseAssetList view={ApplicationRoute.AssetsApplications} />);

    fireEvent.click(screen.getByText('move-public-row'));

    await vi.waitFor(() => expect(moveApps).toHaveBeenCalledOnce());
  });
});
