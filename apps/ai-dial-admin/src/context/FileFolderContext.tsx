'use client';
import { createContext, Dispatch, ReactNode, SetStateAction, useContext, useState } from 'react';

import { getFiles } from '@/src/app/[lang]/files/actions';
import { DialFile, DialFileNodeType } from '@/src/models/dial/file';
import { mergeFiles } from '@/src/utils/files/folder';

export interface FileFolderContextType {
  fetchFiles: (path: string, refreshData?: boolean) => void;
  files: DialFile[];
  expandedFolders: Set<string>;
  filePath: string;
  toggleFolder: (folder: DialFile) => void;
  data: DialFile[] | null;
  fetchedFoldersData: Record<string, DialFile[]>;
  exportFoldersData: Record<string, DialFile[]>;
  setExportFoldersData: Dispatch<SetStateAction<Record<string, DialFile[]>>>;
}

const FileFolderContext = createContext<FileFolderContextType | undefined>(undefined);

export const FileFolderProvider = ({ children }: { children: ReactNode }) => {
  const [files, setFiles] = useState<DialFile[]>([]);

  const [filePath, setFilePath] = useState('');
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());

  const [fetchedFoldersData, setFetchedFoldersData] = useState<Record<string, DialFile[]>>({});
  const [exportFoldersData, setExportFoldersData] = useState<Record<string, DialFile[]>>({});
  const [data, setData] = useState<DialFile[] | null>([]);

  const fetchFiles = (path: string, refreshData?: boolean) => {
    if (refreshData) {
      setFetchedFoldersData({});
      setExpandedFolders(new Set());
    }
    getFiles(path).then((files) => {
      if (files === void 0) {
        setData(null);
        return;
      }
      setFiles((prevFiles) => mergeFiles(prevFiles, files as DialFile[], path));
      const folderFiles = files?.filter((f) => f.nodeType === DialFileNodeType.ITEM) as DialFile[];
      setData(folderFiles);
      setFetchedFoldersData((prev) => ({
        ...prev,
        [path]: folderFiles,
      }));
      if (!filePath) {
        setFilePath(path);
      }
    });
  };

  const toggleFolder = (folder: DialFile) => {
    const folderPath = folder.path;
    const newExpanded = new Set(expandedFolders);
    setFilePath(folderPath);
    if (newExpanded.has(folderPath)) {
      newExpanded.delete(folderPath);
      setData(fetchedFoldersData[folderPath]);
    } else {
      newExpanded.add(folderPath);
      if (!fetchedFoldersData[folderPath]) {
        fetchFiles(folderPath);
      } else {
        setData(fetchedFoldersData[folderPath]);
      }
    }
    setExpandedFolders(newExpanded);
  };

  const value = {
    fetchFiles,
    files,
    expandedFolders,
    filePath,
    toggleFolder,
    data,
    fetchedFoldersData,
    exportFoldersData,
    setExportFoldersData,
  };
  return <FileFolderContext.Provider value={value}>{children}</FileFolderContext.Provider>;
};

export const useFileFolder = (): FileFolderContextType => {
  const context = useContext(FileFolderContext);
  if (!context) {
    throw new Error('useFileFolder must be used within a FileFolderProvider');
  }
  return context;
};
