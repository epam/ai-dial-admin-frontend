'use client';
import {
  createContext,
  Dispatch,
  ReactNode,
  SetStateAction,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
} from 'react';

import { OrgUnitMap, useOrgUnits } from '@/src/context/OrgUnitsContext';
import { createInitialFolderState, folderReducer, toggleFolderState } from '@/src/context/assets/folder-reducer';
import { FolderActionType } from '@/src/context/assets/models';
import { AssetListItem } from '@/src/models/dial/asset-list-item';
import { getFolderItems, mergeFolderRows } from '@/src/utils/files/folder';
import { loadFolderHierarchy } from '@/src/utils/files/folder-hierarchy';
import { isPublicPath } from '@/src/utils/files/root-folder';
import { getChildUnitRows, getUnitSetSignature } from '@/src/utils/org-units/units';

export interface AssetsFolderContext<T extends AssetListItem> {
  isFetchingFiles: boolean;
  fetchFiles: (path: string, refreshData?: boolean, resetFolder?: boolean) => void;
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

/**
 * `includeUnits` adds the org units to the tree: a folder row for every unit directly below the loaded
 * path joins the listing of every `public/` folder load, deduplicated by path with the listing's own rows
 * winning. A unit with no content of the type has no folder in that type's tree, so without this it would
 * be invisible. The units read never fails or rejects `getFilesFunc`'s outcome: no units, no extra rows.
 *
 * A tree built from one set of units is dropped when the set of unit folders changes, so the listing
 * rebuilds it the next time it loads.
 */
export function createFolderContext<T extends AssetListItem>(
  getFilesFunc: (path: string) => Promise<T[] | null | undefined>,
  contextName: string,
  includeUnits?: boolean,
) {
  const Context = createContext<AssetsFolderContext<T> | undefined>(undefined);

  const Provider = ({ children }: { children: ReactNode }) => {
    const [state, dispatch] = useReducer(folderReducer<T>, undefined, createInitialFolderState<T>);
    const { files, filePath, expandedFolders, fetchedFoldersData, hasFetchError } = state;
    const { units, loadUnits } = useOrgUnits();
    const builtUnitSignatureRef = useRef<string | null>(null);
    const [inFlightCount, setInFlightCount] = useState(0);
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

    const fetchByPath = useCallback(
      async (path: string): Promise<T[] | null | undefined> => {
        if (!includeUnits || !isPublicPath(path)) {
          return getFilesFunc(path);
        }

        const [own, unitMap] = await Promise.all([getFilesFunc(path), loadUnits().catch((): OrgUnitMap => ({}))]);
        builtUnitSignatureRef.current = getUnitSetSignature(unitMap);
        // Unit rows are shaped like a folder row of any type; the type only differs in optional fields.
        return own === undefined
          ? undefined
          : mergeFolderRows(own ?? [], getChildUnitRows(unitMap, path) as unknown as T[]);
      },
      [loadUnits],
    );

    const unitSignature = useMemo(() => getUnitSetSignature(units), [units]);

    useEffect(() => {
      const builtSignature = builtUnitSignatureRef.current;
      if (!includeUnits || builtSignature == null || builtSignature === unitSignature) {
        return;
      }
      // Cleared so a tree that is not shown is invalidated once; the next build records its own signature.
      builtUnitSignatureRef.current = null;
      dispatch({ type: FolderActionType.TreeInvalidated });
    }, [unitSignature]);

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
          } catch {
            // A rejected fetch is a failed fetch: without this the context stays empty, idle and error-free.
            if (request.isLatest()) {
              dispatch({ type: FolderActionType.FetchFailed });
            }
          } finally {
            request.finish();
          }
        })();
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
        } catch {
          if (request.isLatest()) {
            dispatch({ type: FolderActionType.FetchFailed });
          }
        } finally {
          request.finish();
        }
      },
      [fetchByPath, startRequest],
    );

    const fetchFiles = useCallback(
      (path: string, refreshData?: boolean, resetFolder?: boolean) => {
        void fetchFolder(path, refreshData, resetFolder);
      },
      [fetchFolder],
    );

    const toggleFolder = useCallback(
      (folder: T, skipFetch?: boolean, collapseAll?: boolean) => {
        const options = { skipFetch, collapseAll, failedPaths: new Set<string>() };
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
