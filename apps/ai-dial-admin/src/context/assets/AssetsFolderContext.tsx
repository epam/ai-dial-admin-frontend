'use client';
import {
  createContext,
  Dispatch,
  ReactNode,
  SetStateAction,
  useCallback,
  useContext,
  useMemo,
  useReducer,
  useRef,
  useState,
} from 'react';

import { createInitialFolderState, folderReducer, toggleFolderState } from '@/src/context/assets/folder-reducer';
import { FolderActionType } from '@/src/context/assets/models';
import { AssetListItem } from '@/src/models/dial/asset-list-item';
import { getFolderItems } from '@/src/utils/files/folder';
import { loadFolderHierarchy } from '@/src/utils/files/folder-hierarchy';
import { buildRootNodes, toConfigFileItems } from '@/src/utils/files/folder-nodes';
import { isFileRootPath } from '@/src/utils/files/root-folder';

export interface AssetsFolderContext<T extends AssetListItem> {
  isFetchingFiles: boolean;
  /**
   * `path` is a single folder for every view but Applications (see `getRootFolders`), which fetches
   * both the `platform` and `public` roots on mount. An array bypasses the single-root `mergeFiles`
   * wrapping and constructs both top-level nodes directly, in the given order, in one state update —
   * `mergeFiles`'s empty-existing-files branch only ever produces one root, and two fetches racing
   * independently into it would have the later one silently overwrite the earlier.
   */
  fetchFiles: (path: string | string[], refreshData?: boolean, resetFolder?: boolean) => void;
  fetchFolderHierarchy?: (path: string, fullTree?: boolean) => void;
  files: T[];
  expandedFolders: Set<string>;
  setExpandedFolders: Dispatch<SetStateAction<Set<string>>>;
  filePath: string;
  setFilePath: Dispatch<SetStateAction<string>>;
  toggleFolder: (folder: T, skipFetch?: boolean, collapseAll?: boolean) => void;
  /** The most recent fetch for the selected folder failed. */
  hasFetchError: boolean;
  fetchedFoldersData: Record<string, T[]>;
}

/**
 * Every member but `toggleFolder` is covariant in `T` (they only ever produce `T`, never consume
 * it), so a consumer that never calls `toggleFolder` can safely accept any concrete
 * `AssetsFolderContext<SomeEntitySpecificItem>` through this narrower, read-oriented view. The
 * default lets most consumers (Modals, FileManager, wrapper buttons, …) write the type once, with no
 * `AssetListItem` import needed at the call site.
 */
export type AssetsFolderContextReader<T extends AssetListItem = AssetListItem> = Omit<
  AssetsFolderContext<T>,
  'toggleFolder'
>;

export function createFolderContext<T extends AssetListItem>(
  getFilesFunc: (path: string) => Promise<T[] | null | undefined>,
  contextName: string,
  getConfigFileNames?: () => Promise<string[] | null | undefined>,
) {
  const Context = createContext<AssetsFolderContext<T> | undefined>(undefined);

  const Provider = ({ children }: { children: ReactNode }) => {
    const [state, dispatch] = useReducer(folderReducer<T>, undefined, createInitialFolderState<T>);
    const { files, filePath, expandedFolders, fetchedFoldersData, hasFetchError } = state;
    const [inFlightCount, setInFlightCount] = useState(0);
    const failedFilePathsRef = useRef<Set<string>>(new Set());
    const latestRequestIdRef = useRef(0);
    // Handlers outlive the render that created them, so they read the committed state from here.
    const stateRef = useRef(state);
    stateRef.current = state;
    const isFetchingFiles = inFlightCount > 0;

    const startRequest = useCallback(() => {
      setInFlightCount((count) => count + 1);
      latestRequestIdRef.current += 1;
      const requestId = latestRequestIdRef.current;

      return {
        isLatest: () => requestId === latestRequestIdRef.current,
        finish: () => setInFlightCount((count) => count - 1),
      };
    }, []);

    const setFilePath = useCallback<Dispatch<SetStateAction<string>>>(
      (value) => dispatch({ type: FolderActionType.FilePathSet, value }),
      [],
    );
    const setExpandedFolders = useCallback<Dispatch<SetStateAction<Set<string>>>>(
      (value) => dispatch({ type: FolderActionType.ExpandedFoldersSet, value }),
      [],
    );

    const fetchByPath = useCallback(async (path: string): Promise<T[] | null | undefined> => {
      if (!isFileRootPath(path)) {
        return getFilesFunc(path);
      }

      if (!getConfigFileNames) {
        return undefined;
      }

      const names = await getConfigFileNames();
      return names ? (toConfigFileItems(names) as T[]) : undefined;
    }, []);

    const fetchFolderHierarchy = useCallback(
      (fullPath?: string, fullTree?: boolean) => {
        if (!fullPath?.includes('/')) return;

        const request = startRequest();

        (async () => {
          try {
            const hierarchy = await loadFolderHierarchy<T>({ fullPath, fullTree, fetchByPath });

            if (!request.isLatest()) {
              return;
            }

            dispatch(
              hierarchy
                ? { type: FolderActionType.HierarchyLoaded, hierarchy }
                : { type: FolderActionType.FetchFailed },
            );
          } finally {
            request.finish();
          }
        })();
      },
      [fetchByPath, startRequest],
    );

    const fetchRoots = useCallback(
      async (paths: string[], refreshData?: boolean, resetFolder?: boolean) => {
        const request = startRequest();
        try {
          const results = await Promise.all(paths.map((rootPath) => fetchByPath(rootPath)));
          const hasPhysicalRootFailure = results.some(
            (result, index) => !isFileRootPath(paths[index]) && result === undefined,
          );
          if (hasPhysicalRootFailure) {
            if (request.isLatest()) {
              dispatch({ type: FolderActionType.FetchFailed });
            }
            return;
          }

          const failedFilePaths = new Set(
            paths.filter((rootPath, index) => isFileRootPath(rootPath) && results[index] === undefined),
          );
          if (refreshData) {
            failedFilePathsRef.current = failedFilePaths;
          } else {
            failedFilePaths.forEach((path) => failedFilePathsRef.current.add(path));
          }

          const newFetchedFoldersData: Record<string, T[]> = {};
          paths.forEach((rootPath, index) => {
            newFetchedFoldersData[rootPath] = getFolderItems(results[index] ?? []);
          });

          // The last physical root keeps the pre-existing initial view. A synthetic file root is
          // already populated but remains collapsed until the user explicitly opens it.
          const openPath = paths.findLast((rootPath) => !isFileRootPath(rootPath)) ?? paths[0];
          dispatch({
            type: FolderActionType.RootsLoaded,
            files: buildRootNodes<T>(paths, results),
            fetchedFoldersData: newFetchedFoldersData,
            openPath,
            refreshData,
            resetFolder,
            isLatestRequest: request.isLatest(),
          });
        } finally {
          request.finish();
        }
      },
      [fetchByPath, startRequest],
    );

    const fetchFolder = useCallback(
      async (path: string, refreshData?: boolean, resetFolder?: boolean) => {
        const request = startRequest();
        try {
          const fetched = await fetchByPath(path);

          if (fetched === undefined) {
            if (request.isLatest()) {
              dispatch({ type: FolderActionType.FetchFailed });
            }
            return;
          }

          const list = fetched ?? [];
          dispatch({
            type: FolderActionType.FolderLoaded,
            path,
            fetched: list,
            folderItems: getFolderItems(list),
            refreshData,
            resetFolder,
            isLatestRequest: request.isLatest(),
          });
        } finally {
          request.finish();
        }
      },
      [fetchByPath, startRequest],
    );

    const fetchFiles = useCallback(
      (path: string | string[], refreshData?: boolean, resetFolder?: boolean) => {
        if (Array.isArray(path)) {
          void fetchRoots(path, refreshData, resetFolder);
          return;
        }

        void fetchFolder(path, refreshData, resetFolder);
      },
      [fetchRoots, fetchFolder],
    );

    const toggleFolder = useCallback(
      (folder: T, skipFetch?: boolean, collapseAll?: boolean) => {
        const options = { skipFetch, collapseAll, failedPaths: new Set(failedFilePathsRef.current) };
        const { shouldFetch } = toggleFolderState(stateRef.current, folder.path, options);

        dispatch({ type: FolderActionType.FolderToggled, folderPath: folder.path, options });

        if (shouldFetch) {
          fetchFiles(folder.path);
        }
      },
      [fetchFiles],
    );

    const value = useMemo<AssetsFolderContext<T>>(
      () => ({
        isFetchingFiles,
        fetchFiles,
        fetchFolderHierarchy,
        files,
        expandedFolders,
        setExpandedFolders,
        filePath,
        setFilePath,
        toggleFolder,
        hasFetchError,
        fetchedFoldersData,
      }),
      [
        isFetchingFiles,
        fetchFiles,
        fetchFolderHierarchy,
        files,
        expandedFolders,
        setExpandedFolders,
        filePath,
        setFilePath,
        toggleFolder,
        hasFetchError,
        fetchedFoldersData,
      ],
    );

    return <Context.Provider value={value}>{children}</Context.Provider>;
  };

  const useFolderContext = (): AssetsFolderContext<T> => {
    const context = useContext(Context);
    if (!context) {
      throw new Error(`${contextName} must be used within its Provider`);
    }
    return context;
  };

  return { Provider, useFolderContext };
}
