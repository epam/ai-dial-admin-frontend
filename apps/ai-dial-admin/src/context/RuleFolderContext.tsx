'use client';
import { createContext, ReactNode, useContext, useState } from 'react';

import { getFolders, getRules } from '@/src/app/[lang]/folders-storage/actions';
import { DialFile, DialFileNodeType } from '@/src/models/dial/file';
import { DialFolder } from '@/src/models/dial/folder';
import { DialRule } from '@/src/models/dial/rule';
import { fillFolderRules, mergeFiles } from '@/src/utils/files/folder';
import { addTrailingSlash, getFolderNameAndPath, isFolder } from '@/src/utils/files/path';

export interface RuleFolderContextType {
  fetchFiles: (path: string) => void;
  fetchRules?: (path: string) => void;
  fetchFolderHierarchy?: (path: string) => void;
  files: DialFolder[];
  expandedFolders: Set<string>;
  filePath: string;
  toggleFolder: (folder: DialFolder) => void;
  fetchedFoldersData: Record<string, DialFolder[]>;
  fetchedFoldersRule?: Record<string, Record<string, DialRule[]>>;
  currentFolder?: DialFolder;
  availableAttributes?: string[];
  isLoading: boolean;
}

const RuleFolderContext = createContext<RuleFolderContextType | undefined>(undefined);

export const RuleFolderProvider = ({ children, attributes }: { children: ReactNode; attributes?: string }) => {
  const [files, setFiles] = useState<DialFolder[]>([]);
  const [currentFolder, setCurrentFolder] = useState<DialFolder>();
  const [isLoading, setIsLoading] = useState(false);
  const [filePath, setFilePath] = useState('');
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [fetchedFoldersData, setFetchedFoldersData] = useState<Record<string, DialFolder[]>>({});
  const [fetchedFoldersRule, setFetchedFoldersRule] = useState<Record<string, Record<string, DialRule[]>>>({});

  const availableAttributes = attributes?.split(',');

  const fetchRules = (path: string) => {
    getRules(path).then((rules) => {
      setFetchedFoldersRule((prev) => ({
        ...prev,
        [path]: fillFolderRules(path, rules) as Record<string, DialRule[]>,
      }));
    });
  };

  const setFolderToggled = (path: string) => {
    const newExpanded = new Set(expandedFolders);
    newExpanded.delete(path);
    setExpandedFolders(newExpanded);
  };

  const fetchFolderHierarchy = (fullPath?: string) => {
    const pathParts = fullPath?.split('/').filter(Boolean);
    let currentPath = '';
    let index = 0;

    const tempRules: Record<string, Record<string, DialRule[]>> = {};
    const tempFoldersData: Record<string, DialFolder[]> = {};
    const tempExpandedFolders: Set<string> = new Set<string>();
    let tempFiles: DialFolder[] = [];
    setIsLoading(true);

    const setTempFolder = (name: string, path?: string) => {
      const newFile = {
        items: [],
        name,
        path,
        nodeType: DialFileNodeType.FOLDER,
      } as unknown as DialFolder;
      tempFiles = mergeFiles(tempFiles, [newFile] as DialFile[], currentPath);
      tempFoldersData[currentPath] = [newFile];
    };

    const processNext = (hasNext: boolean) => {
      if (!pathParts || index >= pathParts.length || !hasNext) {
        getRules(currentPath).then((rules) => {
          tempRules[currentPath] = fillFolderRules(currentPath, rules) as Record<string, DialRule[]>;
          const { name, path } = getFolderNameAndPath(currentPath);
          setCurrentFolder(tempFoldersData[addTrailingSlash(path)]?.find((folder) => folder.name === name));
          setFetchedFoldersRule(tempRules);
          setFiles(tempFiles);
          setFetchedFoldersData(tempFoldersData);
          setFilePath(currentPath);
          setExpandedFolders(tempExpandedFolders);
          setIsLoading(false);
        });
        return;
      }

      currentPath += pathParts[index] + '/';
      tempExpandedFolders.add(currentPath);

      Promise.all([getFolders(currentPath), getRules(currentPath)])
        .then(([folders, rules]) => {
          tempRules[currentPath] = fillFolderRules(currentPath, rules) as Record<string, DialRule[]>;

          const nextFolderPath = pathParts[index + 1] ? currentPath + pathParts[index + 1] + '/' : void 0;

          if (folders && folders.length) {
            const file = folders?.find((f) => f.path === nextFolderPath);
            if (file) {
              const newFile = { ...file, nodeType: DialFileNodeType.FOLDER };
              tempFiles = mergeFiles(tempFiles, [newFile] as DialFile[], currentPath);
              tempFoldersData[currentPath] = [newFile];
            } else {
              setTempFolder(pathParts[index], nextFolderPath);
            }
          } else {
            setTempFolder(pathParts[index + 1], nextFolderPath);
          }

          index += 1;
          processNext(!!nextFolderPath);
        })
        .catch(() => {
          processNext(false);
          setIsLoading(false);
        });
    };
    if (fullPath?.includes('/')) {
      processNext(true);
    }
  };

  const fetchFiles = (path: string) => {
    Promise.all([getFolders(path), getRules(path)]).then(([folders, rules]) => {
      setFetchedFoldersRule((prev) => ({
        ...prev,
        [path]: fillFolderRules(path, rules) as Record<string, DialRule[]>,
      }));
      if (folders && folders.length) {
        const files = folders?.map((f) => ({ ...f, nodeType: DialFileNodeType.FOLDER }));
        setFiles((prevFiles) => {
          const newFiles = mergeFiles(prevFiles, files as DialFolder[], path);
          if (prevFiles.length === 0) {
            toggleFolder(newFiles[0], true);
          }
          return newFiles;
        });
        setFetchedFoldersData((prev) => ({
          ...prev,
          [path]: files as DialFolder[],
        }));
      } else {
        setFolderToggled(path);
        setFetchedFoldersData((prev) => ({
          ...prev,
          [path]: [],
        }));
      }
    });
  };

  const toggleFolder = (folder: DialFolder, skipFetch?: boolean) => {
    const folderPath = folder.path;
    const newExpanded = new Set(expandedFolders);
    setFilePath(folderPath);
    setCurrentFolder(folder);
    if (newExpanded.has(folderPath)) {
      newExpanded.delete(folderPath);
    } else {
      newExpanded.add(folderPath);
      if (!fetchedFoldersData[folderPath] && !skipFetch) {
        fetchFiles(folderPath);
      } else if (
        fetchedFoldersData[folderPath] &&
        !fetchedFoldersData[folderPath].some((data) => isFolder(data.nodeType))
      ) {
        newExpanded.delete(folderPath);
        fetchRules(folderPath);
      }
    }

    setExpandedFolders(newExpanded);
  };

  const value = {
    fetchFiles,
    fetchRules,
    fetchFolderHierarchy,
    files,
    expandedFolders,
    filePath,
    toggleFolder,
    fetchedFoldersData,
    currentFolder,
    availableAttributes,
    fetchedFoldersRule,
    isLoading,
  };
  return <RuleFolderContext.Provider value={value}>{children}</RuleFolderContext.Provider>;
};

export const useRuleFolder = (): RuleFolderContextType => {
  const context = useContext(RuleFolderContext);
  if (!context) {
    throw new Error('useRuleFolder must be used within a RuleFolderProvider');
  }
  return context;
};
