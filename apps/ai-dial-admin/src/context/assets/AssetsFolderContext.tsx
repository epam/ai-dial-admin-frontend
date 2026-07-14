'use client';
import { createContext, Dispatch, ReactNode, SetStateAction, useContext, useState } from 'react';

import { Asset } from '@/src/models/dial/deployment-asset';
import { DialFileNodeType } from '@/src/models/dial/file';
import { mergeFiles } from '@/src/utils/files/folder';
import { isFolder } from '@/src/utils/files/path';

export interface AssetsFolderContext {
  isFetchingFiles: boolean;
  fetchFiles: (path: string, refreshData?: boolean, resetFolder?: boolean) => void;
  fetchFolderHierarchy?: (path: string, fullTree?: boolean) => void;
  files: Asset[];
  expandedFolders: Set<string>;
  setExpandedFolders: Dispatch<SetStateAction<Set<string>>>;
  filePath: string;
  setFilePath: Dispatch<SetStateAction<string>>;
  toggleFolder: (folder: Asset, skipFetch?: boolean, collapseAll?: boolean) => void;
  data: Asset[] | null;
  fetchedFoldersData: Record<string, Asset[]>;
}

export function createFolderContext(
  getFilesFunc: (path: string) => Promise<Asset[] | null | undefined>,
  contextName: string,
) {
  const Context = createContext<AssetsFolderContext | undefined>(undefined);

  const Provider = ({ children }: { children: ReactNode }) => {
    const [files, setFiles] = useState<Asset[]>([]);
    const [filePath, setFilePath] = useState('');
    const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
    const [fetchedFoldersData, setFetchedFoldersData] = useState<Record<string, Asset[]>>({});
    const [isFetchingFiles, setIsFetchingFiles] = useState(false);

    const [data, setData] = useState<Asset[] | null>(null);

    const fetchFolderHierarchy = (fullPath?: string, fullTree?: boolean) => {
      if (!fullPath?.includes('/')) return;

      const pathParts = fullPath.split('/').filter(Boolean);
      const tempFetchedFoldersData: Record<string, Asset[]> = {};
      const tempExpandedFolders = new Set<string>();
      let tempFiles: Asset[] = [];
      let currentPath = '';

      const setTempFolder = (name: string, childPath?: string) => {
        const newFile = {
          items: [],
          name,
          path: childPath,
          nodeType: DialFileNodeType.FOLDER,
        } as unknown as Asset;
        tempFiles = mergeFiles(tempFiles, [newFile], currentPath) as Asset[];
      };

      setIsFetchingFiles(true);

      (async () => {
        try {
          for (let index = 0; index < pathParts.length; index++) {
            currentPath += pathParts[index] + '/';
            tempExpandedFolders.add(currentPath);

            const nextFolderPath = pathParts[index + 1] ? currentPath + pathParts[index + 1] + '/' : undefined;
            const fetched = await getFilesFunc(currentPath);

            if (fetched === undefined) {
              setData(null);
              return;
            }

            const list = fetched ?? [];

            const folderItems = list.filter((f) => f.nodeType === DialFileNodeType.ITEM) as Asset[];
            tempFetchedFoldersData[currentPath] = folderItems;

            if (list.length) {
              const nextFolder = list.find((f) => f.path === nextFolderPath && isFolder(f.nodeType));
              if (nextFolder && !fullTree) {
                const newFile = { ...nextFolder, nodeType: DialFileNodeType.FOLDER } as Asset;
                tempFiles = mergeFiles(tempFiles, [newFile], currentPath) as Asset[];
              } else if (fullTree) {
                tempFiles = mergeFiles(tempFiles, list, currentPath) as Asset[];
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

    const fetchFiles = (path: string, refreshData?: boolean, resetFolder?: boolean) => {
      setIsFetchingFiles(true);
      getFilesFunc(path)
        .then((fetched) => {
          if (fetched === undefined) {
            setData(null);
            return;
          }

          setFiles((prevFiles) => {
            const newFiles = mergeFiles(prevFiles, fetched, path) as Asset[];
            if (prevFiles.length === 0 || refreshData) {
              toggleFolder(newFiles[0], true, refreshData);
            }

            return newFiles;
          });

          const folderItems = fetched?.filter((f) => f.nodeType === DialFileNodeType.ITEM) as Asset[];
          setData(folderItems);
          setFetchedFoldersData((prev) => (refreshData ? { [path]: folderItems } : { ...prev, [path]: folderItems }));

          if (!filePath || resetFolder) {
            setFilePath(path);
          }
        })
        .finally(() => setIsFetchingFiles(false));
    };

    const toggleFolder = (folder: Asset, skipFetch?: boolean, collapseAll?: boolean) => {
      const folderPath = folder.path;
      const newExpanded = new Set(collapseAll ? [] : expandedFolders);

      setFilePath(folderPath);

      if (newExpanded.has(folderPath)) {
        newExpanded.delete(folderPath);
        setData(fetchedFoldersData[folderPath]);
      } else {
        newExpanded.add(folderPath);
        if (!fetchedFoldersData[folderPath] && !skipFetch) {
          fetchFiles(folderPath);
        } else if (fetchedFoldersData[folderPath]) {
          setData(fetchedFoldersData[folderPath]);
        }
      }

      setExpandedFolders(newExpanded);
    };

    const value: AssetsFolderContext = {
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

  const useFolderContext = (): AssetsFolderContext => {
    const context = useContext(Context);
    if (!context) {
      throw new Error(`${contextName} must be used within its Provider`);
    }
    return context;
  };

  return { Provider, useFolderContext };
}
