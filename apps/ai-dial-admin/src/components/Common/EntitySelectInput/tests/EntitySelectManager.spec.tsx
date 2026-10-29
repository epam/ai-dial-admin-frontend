import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, test, vi } from 'vitest';

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
