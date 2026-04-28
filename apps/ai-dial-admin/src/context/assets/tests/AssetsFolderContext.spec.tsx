import { Asset } from '@/src/models/dial/deployment-asset';
import { DialFileNodeType } from '@/src/models/dial/file';
import { act, render } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';
import { AssetsFolderContext, createFolderContext } from '../AssetsFolderContext';

vi.unmock('@/src/context/assets/AssetsFolderContext');

const renderProviderWithCapture = (getFiles: (path: string) => Promise<Asset[] | null | undefined>) => {
  const { Provider, useFolderContext } = createFolderContext(getFiles, 'testFolder');

  let captured: AssetsFolderContext | null = null;

  const Capture = () => {
    captured = useFolderContext();
    return null;
  };

  render(
    <Provider>
      <Capture />
    </Provider>,
  );

  return () => captured as AssetsFolderContext;
};

describe('createFolderContext data initial state', () => {
  test('data is null on first render before any fetch resolves', () => {
    const getFiles = vi.fn().mockResolvedValue([]);
    const get = renderProviderWithCapture(getFiles);

    expect(get().data).toBeNull();
  });

  test('data becomes [] after fetching an empty folder', async () => {
    const getFiles = vi.fn().mockResolvedValue([]);
    const get = renderProviderWithCapture(getFiles);

    await act(async () => {
      get().fetchFiles('/folder/');
    });

    expect(get().data).toEqual([]);
  });

  test('data holds folder items after fetching a populated folder', async () => {
    const items: Asset[] = [
      { name: 'asset-1', path: '/folder/asset-1', nodeType: DialFileNodeType.ITEM } as Asset,
      { name: 'asset-2', path: '/folder/asset-2', nodeType: DialFileNodeType.ITEM } as Asset,
    ];
    const getFiles = vi.fn().mockResolvedValue(items);
    const get = renderProviderWithCapture(getFiles);

    await act(async () => {
      get().fetchFiles('/folder/');
    });

    expect(get().data).toEqual(items);
  });

  test('data becomes null when fetch resolves undefined (error path)', async () => {
    const getFiles = vi.fn().mockResolvedValue(undefined);
    const get = renderProviderWithCapture(getFiles);

    await act(async () => {
      get().fetchFiles('/folder/');
    });

    expect(get().data).toBeNull();
  });
});
