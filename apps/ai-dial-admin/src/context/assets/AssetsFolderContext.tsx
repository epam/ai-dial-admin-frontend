'use client';
import { createContext, Dispatch, ReactNode, SetStateAction, useContext, useRef, useState } from 'react';

import { DEFAULT_ROOT_FOLDER_PERMISSIONS } from '@/src/constants/file';
import { AssetListItem, BucketType, EntitySource } from '@/src/models/dial/asset-list-item';
import { DialFile, DialFileNodeType } from '@/src/models/dial/file';
import { fillChildren, getFolderName, mergeFiles } from '@/src/utils/files/folder';
import { isFolder } from '@/src/utils/files/path';
import { isFileRootPath } from '@/src/utils/files/root-folder';

export interface AssetsFolderContext<T extends AssetListItem> {
  isFetchingFiles: boolean;
  /**
   * `path` is a single folder for every view but Applications (see `getRootFolders`), which fetches
   * both the `platform` and `public` roots on mount. An array bypasses the single-root `mergeFiles`
   * wrapping below and constructs both top-level nodes directly, in the given order, in one
   * `setFiles` call — `mergeFiles`'s empty-existing-files branch only ever produces one root, and two
   * fetches racing independently into it would have the later one silently overwrite the earlier.
   */
  fetchFiles: (path: string | string[], refreshData?: boolean, resetFolder?: boolean) => void;
  fetchFolderHierarchy?: (path: string, fullTree?: boolean) => void;
  files: T[];
  expandedFolders: Set<string>;
  setExpandedFolders: Dispatch<SetStateAction<Set<string>>>;
  filePath: string;
  setFilePath: Dispatch<SetStateAction<string>>;
  toggleFolder: (folder: T, skipFetch?: boolean, collapseAll?: boolean) => void;
  data: T[] | null;
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
    const [files, setFiles] = useState<T[]>([]);
    const [filePath, setFilePath] = useState('');
    const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
    const [fetchedFoldersData, setFetchedFoldersData] = useState<Record<string, T[]>>({});
    const [isFetchingFiles, setIsFetchingFiles] = useState(false);
    const failedFilePathsRef = useRef<Set<string>>(new Set());

    const [data, setData] = useState<T[] | null>(null);

    const fetchByPath = async (path: string): Promise<T[] | null | undefined> => {
      if (!isFileRootPath(path)) {
        return getFilesFunc(path);
      }

      if (!getConfigFileNames) {
        return undefined;
      }

      const names = await getConfigFileNames();
      return names?.map(
        (name) =>
          ({
            name,
            path: name,
            nodeType: DialFileNodeType.ITEM,
            bucket: BucketType.Platform,
            entitySource: EntitySource.File,
          }) as T,
      );
    };

    const fetchFolderHierarchy = (fullPath?: string, fullTree?: boolean) => {
      if (!fullPath?.includes('/')) return;

      const pathParts = fullPath.split('/').filter(Boolean);
      const tempFetchedFoldersData: Record<string, T[]> = {};
      const tempExpandedFolders = new Set<string>();
      let tempFiles: T[] = [];
      let currentPath = '';

      const setTempFolder = (name: string, childPath?: string) => {
        const newFile = {
          items: [],
          name,
          path: childPath,
          nodeType: DialFileNodeType.FOLDER,
        } as unknown as T;
        tempFiles = mergeFiles<T>(tempFiles as DialFile[], [newFile] as DialFile[], currentPath);
      };

      setIsFetchingFiles(true);

      (async () => {
        try {
          for (let index = 0; index < pathParts.length; index++) {
            currentPath += pathParts[index] + '/';
            tempExpandedFolders.add(currentPath);

            const nextFolderPath = pathParts[index + 1] ? currentPath + pathParts[index + 1] + '/' : undefined;
            const fetched = await fetchByPath(currentPath);

            if (fetched === undefined) {
              setData(null);
              return;
            }

            const list = fetched ?? [];

            const folderItems = list.filter((f) => f.nodeType === DialFileNodeType.ITEM);
            tempFetchedFoldersData[currentPath] = folderItems;

            if (list.length) {
              const nextFolder = list.find((f) => f.path === nextFolderPath && isFolder(f.nodeType));
              if (nextFolder && !fullTree) {
                const newFile = { ...nextFolder, nodeType: DialFileNodeType.FOLDER } as T;
                tempFiles = mergeFiles<T>(tempFiles as DialFile[], [newFile] as DialFile[], currentPath);
              } else if (fullTree) {
                tempFiles = mergeFiles<T>(tempFiles as DialFile[], list as DialFile[], currentPath);
              } else if (nextFolderPath) {
                setTempFolder(pathParts[index], nextFolderPath);
              }
            } else if (nextFolderPath) {
              setTempFolder(pathParts[index + 1], nextFolderPath);
            }
          }

          setFiles(tempFiles);
          setFetchedFoldersData(tempFetchedFoldersData);
          setExpandedFolders(tempExpandedFolders);
          setFilePath(currentPath);
          setData(tempFetchedFoldersData[currentPath] ?? []);
        } finally {
          setIsFetchingFiles(false);
        }
      })();
    };

    const fetchRoots = (paths: string[], refreshData?: boolean, resetFolder?: boolean) => {
      setIsFetchingFiles(true);
      Promise.all(paths.map((rootPath) => fetchByPath(rootPath)))
        .then((results) => {
          const hasPhysicalRootFailure = results.some(
            (result, index) => !isFileRootPath(paths[index]) && result === undefined,
          );
          if (hasPhysicalRootFailure) {
            setData(null);
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
            newFetchedFoldersData[rootPath] = results[index]?.filter((f) => f.nodeType === DialFileNodeType.ITEM) ?? [];
          });
          const rootNodes = paths.map(
            (rootPath, index) =>
              ({
                name: getFolderName(rootPath),
                path: rootPath,
                nodeType: DialFileNodeType.FOLDER,
                // Root-level nodes are synthesized client-side (Core never returns a permissions-bearing
                // node for a bucket root), so the placeholder permission set has one named source rather
                // than a bare array repeated at each call site — see `DEFAULT_ROOT_FOLDER_PERMISSIONS`'s
                // own comment for why it's not yet read from a real backend permission.
                permissions: DEFAULT_ROOT_FOLDER_PERMISSIONS,
                entitySource: isFileRootPath(rootPath) ? EntitySource.File : EntitySource.Resource,
                items: fillChildren((results[index] ?? []) as DialFile[]),
              }) as unknown as T,
          );

          setFiles(rootNodes);
          setFetchedFoldersData((prev) =>
            refreshData ? newFetchedFoldersData : { ...prev, ...newFetchedFoldersData },
          );

          // The last physical root keeps the pre-existing initial view. A synthetic file root is
          // already populated but remains collapsed until the user explicitly opens it.
          const openPath = paths.findLast((rootPath) => !isFileRootPath(rootPath)) ?? paths[0];
          setData(newFetchedFoldersData[openPath] ?? []);
          setExpandedFolders((prev) => new Set(refreshData ? [openPath] : [...prev, openPath]));
          if (!filePath || resetFolder) {
            setFilePath(openPath);
          }
        })
        .finally(() => setIsFetchingFiles(false));
    };

    const fetchFiles = (path: string | string[], refreshData?: boolean, resetFolder?: boolean) => {
      if (Array.isArray(path)) {
        fetchRoots(path, refreshData, resetFolder);
        return;
      }

      setIsFetchingFiles(true);
      fetchByPath(path)
        .then((fetched) => {
          if (fetched === undefined) {
            setData(null);
            return;
          }

          setFiles((prevFiles) => {
            const newFiles = mergeFiles<T>(prevFiles as DialFile[], (fetched ?? []) as DialFile[], path);
            if (prevFiles.length === 0 || refreshData) {
              toggleFolder(newFiles[0], true, refreshData);
            }

            return newFiles;
          });

          const folderItems = (fetched ?? []).filter((f) => f.nodeType === DialFileNodeType.ITEM);
          setData(folderItems);
          setFetchedFoldersData((prev) => (refreshData ? { [path]: folderItems } : { ...prev, [path]: folderItems }));

          if (!filePath || resetFolder) {
            setFilePath(path);
          }
        })
        .finally(() => setIsFetchingFiles(false));
    };

    const toggleFolder = (folder: T, skipFetch?: boolean, collapseAll?: boolean) => {
      const folderPath = folder.path;
      const newExpanded = new Set(collapseAll ? [] : expandedFolders);

      setFilePath(folderPath);

      if (newExpanded.has(folderPath)) {
        newExpanded.delete(folderPath);
        setData(fetchedFoldersData[folderPath]);
      } else {
        newExpanded.add(folderPath);
        if (failedFilePathsRef.current.has(folderPath)) {
          setData(null);
        } else if (!fetchedFoldersData[folderPath] && !skipFetch) {
          fetchFiles(folderPath);
        } else if (fetchedFoldersData[folderPath]) {
          setData(fetchedFoldersData[folderPath]);
        }
      }

      setExpandedFolders(newExpanded);
    };

    const value: AssetsFolderContext<T> = {
      isFetchingFiles,
      fetchFiles,
      fetchFolderHierarchy,
      files,
      expandedFolders,
      setExpandedFolders,
      filePath,
      setFilePath,
      toggleFolder,
      data,
      fetchedFoldersData,
    };

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
