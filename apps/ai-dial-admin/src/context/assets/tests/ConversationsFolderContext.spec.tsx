import { TreeAssetListItem } from '@/src/models/dial/asset-list-item';
import { DialFileNodeType } from '@/src/models/dial/file';
import { act, render } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';
import { ConversationFolderProvider, useConversationFolder } from '../ConversationsFolderContext';

vi.mock('@/src/app/[lang]/conversations/actions', () => ({ getConversations: vi.fn() }));

import { getConversations } from '@/src/app/[lang]/conversations/actions';

const renderWithCapture = () => {
  let captured: ReturnType<typeof useConversationFolder> | null = null;

  const Capture = () => {
    captured = useConversationFolder();
    return null;
  };

  render(
    <ConversationFolderProvider>
      <Capture />
    </ConversationFolderProvider>,
  );

  return () => captured as ReturnType<typeof useConversationFolder>;
};

describe('useConversationFolder', () => {
  test('fetches through the real conversations action and shapes the response as TreeAssetListItem rows', async () => {
    const item: TreeAssetListItem = {
      name: 'chat-1',
      path: '/conversations/chat-1',
      folderId: '/conversations/',
      nodeType: DialFileNodeType.ITEM,
    } as TreeAssetListItem;
    vi.mocked(getConversations).mockResolvedValue([item]);

    const get = renderWithCapture();

    await act(async () => {
      get().fetchFiles('/conversations/');
    });

    expect(getConversations).toHaveBeenCalledWith('/conversations/');
    expect(get().data).toEqual([item]);
  });

  test('toggleFolder expands a tree folder row without a move-eligible folderId change', async () => {
    const folder: TreeAssetListItem = {
      name: 'sub',
      path: '/conversations/sub/',
      folderId: '/conversations/',
      nodeType: DialFileNodeType.FOLDER,
    } as TreeAssetListItem;
    vi.mocked(getConversations).mockResolvedValueOnce([folder]).mockResolvedValueOnce([]);

    const get = renderWithCapture();

    await act(async () => {
      get().fetchFiles('/conversations/');
    });

    await act(async () => {
      get().toggleFolder(folder);
    });

    expect(getConversations).toHaveBeenCalledWith(folder.path);
    expect(get().expandedFolders.has(folder.path)).toBe(true);
    expect(get().filePath).toBe(folder.path);
  });
});
