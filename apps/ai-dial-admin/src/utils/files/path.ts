import { DialFile, DialFileNodeType } from '@/src/models/dial/file';
import { DialFolder } from '@/src/models/dial/folder';
import { DialPrompt } from '@/src/models/dial/prompt';
import { findFolderChildren, getFolderName } from './folder';
import { addTrailingSlash } from '@/src/utils/url';

export const isFolder = (type?: DialFileNodeType) => type === DialFileNodeType.FOLDER;

export const removeTrailingSlash = (path?: string) => {
  if (!path) {
    return '';
  }

  return path.replace(/\/{2,}/g, '/').replace(/(.+)\/$/, '$1');
};

export const checkPaths = (initialPath?: string, filePath?: string) => {
  return !filePath || removeTrailingSlash(filePath) === initialPath;
};

export const checkSelectedPath = (initialPath: string, filePath: string, files: DialFolder[]) => {
  const children = findFolderChildren(filePath, files[0]).map((c) => getFolderName(c));
  return children.includes(getFolderName(initialPath));
};

export const getFolderNameAndPath = (fullPath: string) => {
  const parts = fullPath.split('/').filter(Boolean);
  const name = parts.pop() || '';
  const path = parts.join('/');
  return { name, path };
};

export const changePath = (oldPath: string, newPath: string) => {
  const parts = oldPath.split('/').filter((p) => p != null);
  const fileName = parts.pop();
  return `${newPath}/${fileName}`;
};

export const changeFolderName = (oldPath: string, newFolderName: string): string => {
  const parts = oldPath.split('/').filter((p) => p !== '');
  if (parts.length === 0) return oldPath;

  parts[parts.length - 1] = newFolderName;
  return parts.join('/') + '/';
};

export const getListOfPathsToMove = (
  file: DialFile,
  allFilesMap: Record<string, DialFile[]> | null,
  files: DialFile[] | null,
  withExtension?: boolean,
) => {
  const currentFolderData = files || allFilesMap?.[addTrailingSlash(file.folderId)];
  return (
    currentFolderData
      ?.filter((p) => p.name === (withExtension ? `${file.name}${file.extension}` : file.name))
      .map((p) => p.path) || []
  );
};

export const getListOfPathsToBulkDelete = (
  record?: Record<string, DialFile[]> | Record<string, DialPrompt[]>,
): { path: string }[] => {
  const result: { path: string }[] = [];

  for (const folder in record) {
    record[folder].forEach((item) => {
      result.push({ path: item.path });
    });
  }

  return result;
};

export const getPathSegments = (fullPath: string): string[] => {
  const parts = fullPath.split('/').filter(Boolean);
  const paths: string[] = [];

  for (let i = 0; i < parts.length; i++) {
    paths.push(parts.slice(0, i + 1).join('/') + '/');
  }

  return paths;
};

export const updatePathWithNameAndVersion = (oldPath: string, newName: string, newVersion: string): string => {
  const parts = oldPath.split('/').filter(Boolean);
  parts.pop();
  parts.push(`${newName}__${newVersion}`);
  return parts.join('/');
};
