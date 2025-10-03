'use client';
import { createContext, Dispatch, ReactNode, SetStateAction, useContext, useState } from 'react';

import { DialFile, DialFileNodeType } from '@/src/models/dial/file';
import { mergeFiles } from '@/src/utils/files/folder';

export interface AssetsFolderContext<T extends DialFile> {
  fetchFiles: (path: string, refreshData?: boolean, resetFolder?: boolean) => void;
  files: T[];
  expandedFolders: Set<string>;
  filePath: string;
  toggleFolder: (folder: T, skipFetch?: boolean, collapseAll?: boolean) => void;
  data: T[] | null;
  fetchedFoldersData: Record<string, T[]>;
  bulkSelectedData: Record<string, T[]>;
  setBulkSelectedData: Dispatch<SetStateAction<Record<string, T[]>>>;
}

export function createFolderContext<T extends DialFile>(
  getFilesFunc: (path: string) => Promise<T[] | null | undefined>,
  contextName: string,
) {
  const Context = createContext<AssetsFolderContext<T> | undefined>(undefined);

  const Provider = ({ children }: { children: ReactNode }) => {
    const [files, setFiles] = useState<T[]>([]);
    const [filePath, setFilePath] = useState('');
    const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
    const [fetchedFoldersData, setFetchedFoldersData] = useState<Record<string, T[]>>({});
    const [bulkSelectedData, setBulkSelectedData] = useState<Record<string, T[]>>({});
    const [data, setData] = useState<T[] | null>([]);

    const fetchFiles = (path: string, refreshData?: boolean, resetFolder?: boolean) => {
      if (refreshData) {
        setFetchedFoldersData({});
        setExpandedFolders(new Set());
      }

      getFilesFunc(path).then((fetched) => {
        if (fetched === undefined) {
          setData(null);
          return;
        }

        setFiles((prevFiles) => {
          const newFiles = mergeFiles(prevFiles, fetched, path) as T[];
          if (prevFiles.length === 0) {
            toggleFolder(newFiles[0], true);
          }

          return newFiles;
        });

        const folderItems = fetched?.filter((f) => f.nodeType === DialFileNodeType.ITEM) as T[];
        setData(folderItems);
        setFetchedFoldersData((prev) => ({ ...prev, [path]: folderItems }));

        if (!filePath || resetFolder) {
          setFilePath(path);
        }
      });
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
        if (!fetchedFoldersData[folderPath] && !skipFetch) {
          fetchFiles(folderPath);
        } else {
          setData(fetchedFoldersData[folderPath]);
        }
      }

      setExpandedFolders(newExpanded);
    };

    const value: AssetsFolderContext<T> = {
      fetchFiles,
      files,
      expandedFolders,
      filePath,
      toggleFolder,
      data,
      fetchedFoldersData,
      bulkSelectedData,
      setBulkSelectedData,
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
