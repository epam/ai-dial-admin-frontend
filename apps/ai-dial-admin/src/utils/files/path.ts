import { DialFile, DialFileNodeType } from '@/src/models/dial/file';

export const isFolder = (type?: DialFileNodeType) => type === DialFileNodeType.FOLDER;

export const removeTrailingSlash = (path?: string) => {
  if (!path) {
    return '';
  }

  return path.replace(/\/{2,}/g, '/').replace(/(.+)\/$/, '$1');
};

export const addTrailingSlash = (path: string) => {
  if (path.endsWith('/')) {
    return path;
  }
  return `${path}/`;
};

export const checkPaths = (initialPath?: string, filePath?: string) => {
  return !filePath || removeTrailingSlash(filePath) === initialPath;
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

export const getPathSegments = (fullPath: string): string[] => {
  const parts = fullPath.split('/').filter(Boolean);
  const paths: string[] = [];

  for (let i = 0; i < parts.length; i++) {
    paths.push(parts.slice(0, i + 1).join('/') + '/');
  }

  return paths;
};
