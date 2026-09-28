import { MovableAssetListItem } from '@/src/models/dial/asset-list-item';
import { DialFileNodeType } from '@/src/models/dial/file';
import { act, render } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';
import { PromptFolderProvider, usePromptFolder } from '../PromptFolderContext';

// test-setup.tsx globally stubs this context (`usePromptFolder: () => vi.fn()`) for every other
// spec's convenience — this file exercises the real provider, so it needs the genuine module back.
vi.unmock('@/src/context/assets/PromptFolderContext');

vi.mock('@/src/app/[lang]/prompts/actions', () => ({ getPrompts: vi.fn() }));

import { getPrompts } from '@/src/app/[lang]/prompts/actions';

const renderWithCapture = () => {
  let captured: ReturnType<typeof usePromptFolder> | null = null;

  const Capture = () => {
    captured = usePromptFolder();
    return null;
  };

  render(
    <PromptFolderProvider>
      <Capture />
    </PromptFolderProvider>,
  );

  return () => captured as ReturnType<typeof usePromptFolder>;
};

describe('usePromptFolder', () => {
  test('fetches through the real prompts action and shapes the response as MovableAssetListItem rows', async () => {
    // `data` only ever holds ITEM rows (folders are held in `files`/`fetchedFoldersData` instead —
    // see `AssetsFolderContext.tsx`'s `fetchFiles`), so this fixture must be a leaf item.
    const item: MovableAssetListItem = {
      name: 'prompt-1',
      path: '/prompts/prompt-1',
      folderId: '/prompts/',
      nodeType: DialFileNodeType.ITEM,
    } as MovableAssetListItem;
    vi.mocked(getPrompts).mockResolvedValue([item]);

    const get = renderWithCapture();

    await act(async () => {
      get().fetchFiles('/prompts/');
    });

    expect(getPrompts).toHaveBeenCalledWith('/prompts/');
    expect(get().data).toEqual([item]);
  });

  test('toggleFolder expands a folder row and fetches its children on first expand', async () => {
    const folder: MovableAssetListItem = {
      name: 'sub',
      path: '/prompts/sub/',
      folderId: '/prompts/',
      nodeType: DialFileNodeType.FOLDER,
    } as MovableAssetListItem;
    vi.mocked(getPrompts).mockResolvedValueOnce([folder]).mockResolvedValueOnce([]);

    const get = renderWithCapture();

    await act(async () => {
      get().fetchFiles('/prompts/');
    });

    await act(async () => {
      get().toggleFolder(folder);
    });

    expect(getPrompts).toHaveBeenCalledWith(folder.path);
    expect(get().expandedFolders.has(folder.path)).toBe(true);
  });
});
