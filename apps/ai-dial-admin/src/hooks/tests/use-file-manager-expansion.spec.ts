import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import { AssetsFolderContextReader } from '@/src/context/assets/AssetsFolderContext';
import { useFileManagerExpansion } from '@/src/hooks/use-file-manager-expansion';
import { BucketType } from '@/src/models/dial/asset-list-item';

const ROOT = 'public/';
const FOLDER = 'public/examples/';
const CHILD = { name: 'nested', path: `${FOLDER}nested/`, bucket: BucketType.Public };

const expanded = () => new Set([ROOT, FOLDER]);
const collapsed = () => new Set([ROOT]);

describe('useFileManagerExpansion', () => {
  const renderExpansion = (overrides: Partial<AssetsFolderContextReader> = {}) => {
    const context: AssetsFolderContextReader = {
      files: [],
      fetchFiles: vi.fn(),
      isFetchingFiles: false,
      filePath: ROOT,
      setFilePath: vi.fn(),
      expandedFolders: collapsed(),
      setExpandedFolders: vi.fn(),
      hasFetchError: false,
      fetchedFoldersData: { [ROOT]: [] },
      ...overrides,
    };
    const hook = renderHook(useFileManagerExpansion, { initialProps: context });
    return { ...hook, context };
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('loads only newly expanded uncached paths without selecting a folder', () => {
    const { result, context } = renderExpansion();

    act(() => result.current.onExpandedPathsChange(expanded()));

    expect(context.setExpandedFolders).toHaveBeenCalledWith(expanded());
    expect(context.fetchFiles).toHaveBeenCalledOnce();
    expect(context.fetchFiles).toHaveBeenCalledWith(FOLDER);
    expect(context.setFilePath).not.toHaveBeenCalled();
  });

  test('collapses a folder without requesting its children', () => {
    const { result, context } = renderExpansion({ expandedFolders: expanded() });

    act(() => result.current.onExpandedPathsChange(collapsed()));

    expect(context.setExpandedFolders).toHaveBeenCalledWith(collapsed());
    expect(context.fetchFiles).not.toHaveBeenCalled();
  });

  test.each([{ children: [] }, { children: [CHILD] }])(
    'reuses successfully cached children including an empty result ($children)',
    ({ children }) => {
      const { result, context } = renderExpansion({ fetchedFoldersData: { [ROOT]: [], [FOLDER]: children } });

      act(() => {
        result.current.onExpandedPathsChange(expanded());
        result.current.onExpandedPathsChange(collapsed());
        result.current.onExpandedPathsChange(expanded());
      });

      expect(context.fetchFiles).not.toHaveBeenCalled();
    },
  );

  test.each(['public/', 'platform/', 'file/'])('reuses the preloaded %s root', (root) => {
    const { result, context } = renderExpansion({
      expandedFolders: new Set(),
      fetchedFoldersData: { [root]: [] },
    });

    act(() => result.current.onExpandedPathsChange(new Set([root])));

    expect(context.fetchFiles).not.toHaveBeenCalled();
  });

  test('suppresses duplicate expansion requests before the fetching render', () => {
    const { result, context } = renderExpansion();

    act(() => {
      result.current.onExpandedPathsChange(expanded());
      result.current.onExpandedPathsChange(collapsed());
      result.current.onExpandedPathsChange(expanded());
    });

    expect(context.fetchFiles).toHaveBeenCalledOnce();
  });

  test('shares pending requests between selection and expansion callbacks', () => {
    const { result, context } = renderExpansion();

    act(() => {
      result.current.onFetchFolder(FOLDER);
      result.current.onExpandedPathsChange(expanded());
      result.current.onFetchFolder(FOLDER);
    });

    expect(context.fetchFiles).toHaveBeenCalledOnce();
    expect(context.fetchFiles).toHaveBeenCalledWith(FOLDER);
  });

  test('does not release a pending path on an unrelated idle render', () => {
    const { result, rerender, context } = renderExpansion();
    act(() => result.current.onExpandedPathsChange(expanded()));
    rerender({ ...context, expandedFolders: expanded(), fetchedFoldersData: { [ROOT]: [] } });

    act(() => {
      result.current.onExpandedPathsChange(collapsed());
      result.current.onExpandedPathsChange(expanded());
    });

    expect(context.fetchFiles).toHaveBeenCalledOnce();
  });

  test('suppresses duplicate expansion requests while a folder is fetching', () => {
    const { result, rerender, context } = renderExpansion();
    act(() => result.current.onExpandedPathsChange(expanded()));
    rerender({ ...context, expandedFolders: expanded(), isFetchingFiles: true });

    act(() => {
      result.current.onExpandedPathsChange(collapsed());
      result.current.onExpandedPathsChange(expanded());
    });

    expect(context.fetchFiles).toHaveBeenCalledOnce();
  });

  test('does not reopen a folder collapsed while its children were loading', () => {
    const { result, rerender, context } = renderExpansion();
    act(() => result.current.onExpandedPathsChange(expanded()));
    rerender({ ...context, expandedFolders: expanded(), isFetchingFiles: true });
    act(() => result.current.onExpandedPathsChange(collapsed()));
    rerender({ ...context, fetchedFoldersData: { [ROOT]: [], [FOLDER]: [CHILD] } });

    expect(context.setExpandedFolders).toHaveBeenCalledTimes(2);
    expect(context.setExpandedFolders).toHaveBeenLastCalledWith(collapsed());
    expect(context.setFilePath).not.toHaveBeenCalled();

    act(() => result.current.onExpandedPathsChange(expanded()));
    expect(context.fetchFiles).toHaveBeenCalledOnce();
  });

  test('retries a failed folder load on a later expansion after fetching settles', () => {
    const { result, rerender, context } = renderExpansion();
    act(() => result.current.onExpandedPathsChange(expanded()));
    rerender({ ...context, expandedFolders: expanded(), isFetchingFiles: true });
    rerender({ ...context, expandedFolders: expanded(), hasFetchError: true });

    act(() => {
      result.current.onExpandedPathsChange(collapsed());
      result.current.onExpandedPathsChange(expanded());
    });

    expect(context.fetchFiles).toHaveBeenCalledTimes(2);
    expect(context.fetchFiles).toHaveBeenLastCalledWith(FOLDER);
    expect(context.setFilePath).not.toHaveBeenCalled();
  });

  test('loads a different folder while another expansion request is pending', () => {
    const { result, context } = renderExpansion();
    const otherFolder = 'public/other/';

    act(() => {
      result.current.onExpandedPathsChange(expanded());
      result.current.onExpandedPathsChange(new Set([ROOT, FOLDER, otherFolder]));
    });

    expect(context.fetchFiles).toHaveBeenCalledTimes(2);
    expect(context.fetchFiles).toHaveBeenCalledWith(otherFolder);
  });

  test('reflects programmatic expansion changes when deciding which paths are new', () => {
    const { result, rerender, context } = renderExpansion({ expandedFolders: expanded() });
    rerender(context);
    rerender({ ...context, expandedFolders: collapsed() });

    act(() => result.current.onExpandedPathsChange(expanded()));

    expect(context.fetchFiles).toHaveBeenCalledOnce();
    expect(context.fetchFiles).toHaveBeenCalledWith(FOLDER);
  });
});
