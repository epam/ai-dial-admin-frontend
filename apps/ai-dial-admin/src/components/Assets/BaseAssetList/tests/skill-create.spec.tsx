import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  AssetFolderContextMap,
  MoveAssetActionMap,
  BulkDeleteAssetActionMap,
} from '@/src/components/Assets/BaseAssetList/utils';
import { DialFileNodeType } from '@epam/ai-dial-react-file-manager';
import { ModalType } from '@/src/components/Assets/BaseAssetList/types';
import { describe, expect, test, vi } from 'vitest';

import { createSkill, createSkillFolder } from '@/src/app/[lang]/skills/actions';
import { ApplicationRoute } from '@/src/types/routes';
import BaseAssetList from '../BaseAssetList';

vi.mock('@/src/app/[lang]/skills/actions', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/src/app/[lang]/skills/actions')>()),
  createSkill: vi.fn().mockResolvedValue({ success: true }),
  createSkillFolder: vi.fn().mockResolvedValue({ success: true }),
}));

vi.mock('@/src/components/Common/FileManager/FileManager', () => ({
  __esModule: true,
  default: (props: any) => (
    <>
      <button onClick={() => props.onCreateFolder(undefined, 'public/new-folder')}>create-folder</button>
      <button
        onClick={() =>
          props.onMoveItems(
            [
              {
                nodeType: DialFileNodeType.ITEM,
                sourceUrl: 'public/team/assistant__internal__stable',
                destinationUrl: 'public/target/assistant__internal__stable',
              },
            ],
            'public/team/',
            'public/target/',
          )
        }
      >
        move-selected
      </button>
      <button
        onClick={() =>
          props.onMoveItems(
            [
              {
                nodeType: DialFileNodeType.ITEM,
                sourceUrl: 'public/team/assistant__stable',
                destinationUrl: 'public/target/copy__internal',
              },
            ],
            'public/team/',
            'public/target/',
          )
        }
      >
        move-renamed
      </button>
      <button
        onClick={() =>
          props.customDeleteItemsAction(
            [
              {
                nodeType: DialFileNodeType.ITEM,
                name: 'assistant__internal',
                version: 'stable',
                path: 'public/team/assistant__internal__stable',
              },
            ],
            'public/team/',
          )
        }
      >
        delete-selected
      </button>
    </>
  ),
}));

vi.mock('../Modals', () => ({
  __esModule: true,
  default: (props: any) => (
    <>
      <button onClick={() => props.onCreate({ name: 'my-skill', description: 'Does a thing' })}>create-skill</button>
      {props.modalType === ModalType.delete && <button onClick={props.onRemove}>confirm-delete</button>}
    </>
  ),
}));

describe('BaseAssetList :: exact selected public paths', () => {
  const renderPublicList = () => {
    const folder = {
      fetchedFoldersData: {
        'public/team/': ['stable', 'preview'].map((version) => ({
          name: 'assistant__internal',
          version,
          path: `public/team/assistant__internal__${version}`,
          folderId: 'public/team/',
        })),
      },
      filePath: 'public/team/',
      fetchFiles: vi.fn(),
      setFilePath: vi.fn(),
    };
    vi.spyOn(AssetFolderContextMap, ApplicationRoute.AssetsApplications).mockReturnValue(folder as never);
    render(<BaseAssetList view={ApplicationRoute.AssetsApplications} />);
  };
  test('moves only the selected path and passes a base destination name for one suffix append', async () => {
    const user = userEvent.setup();
    const move = vi
      .spyOn(MoveAssetActionMap, ApplicationRoute.AssetsApplications)
      .mockResolvedValue([{ success: true }]);
    renderPublicList();
    await user.click(screen.getByRole('button', { name: 'move-selected' }));
    expect(move).toHaveBeenCalledWith(
      ['public/team/assistant__internal__stable'],
      'public/target',
      undefined,
      'assistant__internal',
    );
  });
  test('preserves delimiters in a supplied base destination name', async () => {
    const user = userEvent.setup();
    const move = vi
      .spyOn(MoveAssetActionMap, ApplicationRoute.AssetsApplications)
      .mockResolvedValue([{ success: true }]);
    renderPublicList();
    await user.click(screen.getByRole('button', { name: 'move-renamed' }));
    expect(move).toHaveBeenCalledWith(['public/team/assistant__stable'], 'public/target', undefined, 'copy__internal');
  });
  test('deletes only the selected path rather than its same-name sibling', async () => {
    const user = userEvent.setup();
    const remove = vi
      .spyOn(BulkDeleteAssetActionMap, ApplicationRoute.AssetsApplications)
      .mockResolvedValue({ success: true });
    renderPublicList();
    await user.click(screen.getByRole('button', { name: 'delete-selected' }));
    await user.click(await screen.findByRole('button', { name: 'confirm-delete' }));
    await vi.waitFor(() =>
      expect(remove).toHaveBeenCalledWith([{ path: 'public/team/assistant__internal__stable', etag: '*' }]),
    );
  });
});

/**
 * Folder-create and skill-create are two different Core operations for this type (design D2), so
 * `BaseAssetList` calls them directly rather than through the shared `CreateAssetActionMap` every
 * other asset type uses. This asserts that branch, not the generic map-driven path other types cover.
 */
describe('BaseAssetList :: AssetsSkills create branches', () => {
  test('Create > Folder calls createSkillFolder with no trailing slash, not CreateAssetActionMap', async () => {
    render(<BaseAssetList view={ApplicationRoute.Skills} />);

    fireEvent.click(screen.getByText('create-folder'));

    // `createSkillFolder` (the Core API method behind this action) appends its own trailing slash to
    // build the grouping-folder route — passing a path that already ends in one produced a `//` Core
    // rejected as not found.
    await vi.waitFor(() => expect(createSkillFolder).toHaveBeenCalledWith('public/new-folder'));
  });

  test('Create > Skill calls createSkill with name, description, and the current root folder', async () => {
    render(<BaseAssetList view={ApplicationRoute.Skills} />);

    fireEvent.click(screen.getByText('create-skill'));

    await vi.waitFor(() => expect(createSkill).toHaveBeenCalledWith('my-skill', 'Does a thing', 'public/'));
  });
});
