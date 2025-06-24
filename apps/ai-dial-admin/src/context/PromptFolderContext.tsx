'use client';
import { createContext, Dispatch, ReactNode, SetStateAction, useContext, useState } from 'react';

import { getPrompts } from '@/src/app/[lang]/prompts/actions';
import { DialFile, DialFileNodeType } from '@/src/models/dial/file';
import { DialPrompt } from '@/src/models/dial/prompt';
import { mergeFiles } from '@/src/utils/files/folder';

export interface PromptFolderContextType {
  fetchFiles: (path: string, refreshData?: boolean) => void;
  files: DialPrompt[];
  expandedFolders: Set<string>;
  filePath: string;
  toggleFolder: (folder: DialFile) => void;
  data: DialPrompt[] | null;
  fetchedFoldersData: Record<string, DialPrompt[]>;
  exportFoldersData: Record<string, DialPrompt[]>;
  setExportFoldersData: Dispatch<SetStateAction<Record<string, DialPrompt[]>>>;
}

const PromptFolderContext = createContext<PromptFolderContextType | undefined>(undefined);

export const PromptFolderProvider = ({ children }: { children: ReactNode }) => {
  const [files, setFiles] = useState<DialPrompt[]>([]);

  const [filePath, setFilePath] = useState('');
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());

  const [fetchedFoldersData, setFetchedFoldersData] = useState<Record<string, DialPrompt[]>>({});
  const [exportFoldersData, setExportFoldersData] = useState<Record<string, DialPrompt[]>>({});
  const [data, setData] = useState<DialPrompt[] | null>([]);

  const fetchFiles = (path: string, refreshData?: boolean) => {
    if (refreshData) {
      setFetchedFoldersData({});
      setExpandedFolders(new Set());
    }
    getPrompts(path).then((files) => {
      if (files === void 0) {
        setData(null);
        return;
      }
      setFiles((prevFiles) => mergeFiles(prevFiles, files, path));
      const folderPrompts = files?.filter((f) => f.nodeType === DialFileNodeType.ITEM) as DialPrompt[];
      setData(folderPrompts);
      setFetchedFoldersData((prev) => ({
        ...prev,
        [path]: folderPrompts,
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
  return <PromptFolderContext.Provider value={value}>{children}</PromptFolderContext.Provider>;
};

export const usePromptFolder = (): PromptFolderContextType => {
  const context = useContext(PromptFolderContext);
  if (!context) {
    throw new Error('usePromptFolder must be used within a PromptFolderProvider');
  }
  return context;
};
