import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import { getGridOptions } from '@/src/components/Common/FileManager/utils';
import { MovableAssetListItem } from '@/src/models/dial/asset-list-item';
import EntitySelectManager from '../EntitySelectManager';
import { EntitySelectType } from '../models';

const mockFolder = {
  files: [] as unknown[],
  fetchFiles: vi.fn(),
  fetchFolderHierarchy: vi.fn(),
  isFetchingFiles: false,
  filePath: '',
  setFilePath: vi.fn(),
  expandedFolders: new Set<string>(),
  setExpandedFolders: vi.fn(),
  fetchedFoldersData: {} as Record<string, Partial<MovableAssetListItem>[]>,
};

vi.mock('@/src/context/assets/SkillFolderContext', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/src/context/assets/SkillFolderContext')>()),
  useSkillFolder: () => mockFolder,
}));
vi.mock('@/src/hooks/use-is-read-only-admin', () => ({ useIsReadOnlyAdmin: () => false }));
vi.mock('@/src/components/Common/FileManager/utils', () => ({
  getGridOptions: vi.fn(() => ({})),
  getTreeOptions: vi.fn(() => ({})),
}));

// Stand-in for the library: exposes the selection and path callbacks the component hands it.
vi.mock('@epam/ai-dial-react-file-manager', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@epam/ai-dial-react-file-manager')>()),
  DialFileManager: ({ handleSelectionClick, onPathChange }: any) => (
    <div>
      <button
        onClick={() => handleSelectionClick([{ nodeType: 'item', path: 'public/team/my-skill', id: 'unused-id' }])}
      >
        click-skill
      </button>
      <button onClick={() => handleSelectionClick([{ nodeType: 'folder', path: 'public/team/' }])}>click-folder</button>
      <button onClick={() => handleSelectionClick([])}>click-nothing</button>
      <button
        onClick={() =>
          handleSelectionClick([
            { nodeType: 'item', path: 'public/a.csv' },
            { nodeType: 'folder', path: 'public/team/' },
            { nodeType: 'item', path: 'public/team/b.pdf' },
          ])
        }
      >
        click-many
      </button>
      <button onClick={() => onPathChange('public/team/')}>open-folder</button>
    </div>
  ),
}));

describe('EntitySelectManager', () => {
  const onChangeSelectedPath = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockFolder.files = [];
    mockFolder.expandedFolders = new Set<string>();
    mockFolder.fetchedFoldersData = {};
  });

  const renderManager = (props?: Partial<Parameters<typeof EntitySelectManager>[0]>) =>
    render(
      <EntitySelectManager
        entityType={EntitySelectType.Skill}
        value=""
        isModalOpen
        onChangeSelectedPath={onChangeSelectedPath}
        {...props}
      />,
    );

  test('reports the path of a clicked skill row', async () => {
    const user = userEvent.setup();
    renderManager();

    await user.click(screen.getByRole('button', { name: 'click-skill' }));

    expect(onChangeSelectedPath).toHaveBeenCalledWith('public/team/my-skill');
  });

  test('reports no selection for a grouping folder row or an empty selection', async () => {
    const user = userEvent.setup();
    renderManager();

    await user.click(screen.getByRole('button', { name: 'click-folder' }));
    await user.click(screen.getByRole('button', { name: 'click-nothing' }));

    expect(onChangeSelectedPath).toHaveBeenNthCalledWith(1, null);
    expect(onChangeSelectedPath).toHaveBeenNthCalledWith(2, null);
    expect(onChangeSelectedPath).not.toHaveBeenCalledWith('public/team/');
  });

  test('asks the grid for single selection when only the single callback is given', () => {
    renderManager();

    expect(vi.mocked(getGridOptions).mock.calls.at(-1)?.[4]).toBe(true);
  });

  describe('multi-selection', () => {
    const onChangeSelectedPaths = vi.fn();

    const renderMulti = () => renderManager({ onChangeSelectedPath: undefined, onChangeSelectedPaths });

    test('asks the grid for multiple selection', () => {
      renderMulti();

      expect(vi.mocked(getGridOptions).mock.calls.at(-1)?.[4]).toBe(false);
    });

    test('reports every selected entity and never a grouping folder', async () => {
      const user = userEvent.setup();
      renderMulti();

      await user.click(screen.getByRole('button', { name: 'click-many' }));

      expect(onChangeSelectedPaths).toHaveBeenCalledWith(['public/a.csv', 'public/team/b.pdf']);
    });

    test('reports an empty list for an empty selection or only folders', async () => {
      const user = userEvent.setup();
      renderMulti();

      await user.click(screen.getByRole('button', { name: 'click-nothing' }));
      await user.click(screen.getByRole('button', { name: 'click-folder' }));

      expect(onChangeSelectedPaths).toHaveBeenNthCalledWith(1, []);
      expect(onChangeSelectedPaths).toHaveBeenNthCalledWith(2, []);
    });

    test('does not use the single-selection callback', async () => {
      const user = userEvent.setup();
      renderManager({ onChangeSelectedPaths });

      await user.click(screen.getByRole('button', { name: 'click-skill' }));

      expect(onChangeSelectedPath).not.toHaveBeenCalled();
      expect(onChangeSelectedPaths).toHaveBeenCalledWith(['public/team/my-skill']);
    });
  });

  test('loads the public root when opened with no value and nothing loaded', () => {
    renderManager();

    expect(mockFolder.fetchFiles).toHaveBeenCalledWith('public/');
    expect(mockFolder.fetchFolderHierarchy).not.toHaveBeenCalled();
  });

  test('loads the hierarchy down to the current value when opened with one', () => {
    renderManager({ value: 'public/team/my-skill' });

    expect(mockFolder.fetchFolderHierarchy).toHaveBeenCalledWith('public/team/', true);
    expect(mockFolder.fetchFiles).not.toHaveBeenCalled();
  });

  test('falls back to the root when the folder of the current value lists as empty', () => {
    const { rerender } = renderManager({ value: 'bucket1/missing-skill' });
    expect(mockFolder.fetchFiles).not.toHaveBeenCalled();

    mockFolder.fetchedFoldersData = { 'bucket1/': [] };
    rerender(<EntitySelectManager entityType={EntitySelectType.Skill} value="bucket1/missing-skill" isModalOpen />);

    expect(mockFolder.fetchFiles).toHaveBeenCalledOnce();
    expect(mockFolder.fetchFiles).toHaveBeenCalledWith(['public/'], true, true);
  });

  test('does not request the hierarchy again once the value folder is known to be empty', () => {
    mockFolder.fetchedFoldersData = { 'bucket1/': [] };
    renderManager({ value: 'bucket1/missing-skill' });

    expect(mockFolder.fetchFolderHierarchy).not.toHaveBeenCalled();
    expect(mockFolder.fetchFiles).toHaveBeenCalledOnce();
    expect(mockFolder.fetchFiles).toHaveBeenCalledWith(['public/'], true, true);
  });

  test('does not request the value hierarchy again after falling back to the root', () => {
    mockFolder.files = [{ path: 'public/' }];
    mockFolder.fetchedFoldersData = { 'bucket1/': [] };
    const { rerender } = renderManager({ value: 'bucket1/missing-skill' });
    expect(mockFolder.fetchFiles).toHaveBeenCalledWith(['public/'], true, true);
    mockFolder.fetchFolderHierarchy.mockClear();

    mockFolder.files = [{ path: 'public/' }, { path: 'public/team/' }];
    rerender(<EntitySelectManager entityType={EntitySelectType.Skill} value="bucket1/missing-skill" isModalOpen />);

    expect(mockFolder.fetchFolderHierarchy).not.toHaveBeenCalled();
  });

  test('resolves a different value afresh after falling back for the previous one', () => {
    mockFolder.files = [{ path: 'public/' }];
    mockFolder.fetchedFoldersData = { 'bucket1/': [] };
    const { rerender } = renderManager({ value: 'bucket1/missing-skill' });
    mockFolder.fetchFolderHierarchy.mockClear();

    rerender(<EntitySelectManager entityType={EntitySelectType.Skill} value="public/team/my-skill" isModalOpen />);

    expect(mockFolder.fetchFolderHierarchy).toHaveBeenCalledWith('public/team/', true);
  });

  test('falls back again for a second missing value in the same bucket', () => {
    mockFolder.files = [{ path: 'public/' }];
    mockFolder.fetchedFoldersData = { 'bucket1/': [] };
    const { rerender } = renderManager({ value: 'bucket1/first-missing' });
    expect(mockFolder.fetchFiles).toHaveBeenCalledOnce();

    // The root reload replaced the cache, so the next value's folder is requested again and lists empty.
    mockFolder.fetchedFoldersData = {};
    mockFolder.fetchFolderHierarchy.mockClear();
    rerender(<EntitySelectManager entityType={EntitySelectType.Skill} value="bucket1/second-missing" isModalOpen />);
    expect(mockFolder.fetchFolderHierarchy).toHaveBeenCalledWith('bucket1/', true);

    mockFolder.fetchedFoldersData = { 'bucket1/': [] };
    rerender(<EntitySelectManager entityType={EntitySelectType.Skill} value="bucket1/second-missing" isModalOpen />);

    expect(mockFolder.fetchFiles).toHaveBeenCalledTimes(2);
  });

  test('does not fall back for a value without a folder', () => {
    mockFolder.files = [{ path: 'public/' }];
    mockFolder.fetchedFoldersData = { '/': [] };
    renderManager({ value: 'bucket1' });

    expect(mockFolder.fetchFiles).not.toHaveBeenCalled();
  });

  test('keeps the current value when its folder still holds entries', () => {
    mockFolder.fetchedFoldersData = { 'public/team/': [{ path: 'public/team/other-skill' }] };
    renderManager({ value: 'public/team/missing-skill' });

    expect(mockFolder.fetchFiles).not.toHaveBeenCalled();
  });

  test('does not fall back to the root while the popup is closed', () => {
    mockFolder.fetchedFoldersData = { 'bucket1/': [] };
    renderManager({ value: 'bucket1/missing-skill', isModalOpen: false });

    expect(mockFolder.fetchFiles).not.toHaveBeenCalled();
  });

  test('loads nothing while the popup is closed', () => {
    renderManager({ isModalOpen: false });

    expect(mockFolder.fetchFiles).not.toHaveBeenCalled();
    expect(mockFolder.fetchFolderHierarchy).not.toHaveBeenCalled();
  });

  test('fetches a folder the first time it is opened and expands it', async () => {
    const user = userEvent.setup();
    renderManager();
    mockFolder.fetchFiles.mockClear();

    await user.click(screen.getByRole('button', { name: 'open-folder' }));

    expect(mockFolder.fetchFiles).toHaveBeenCalledWith('public/team/');
    expect(mockFolder.setFilePath).toHaveBeenCalledWith('public/team/');
    expect(mockFolder.setExpandedFolders).toHaveBeenCalledWith(new Set(['public/team/']));
  });
});
