import { DialFile, DialFileNodeType } from '@/src/models/dial/file';
import { DialFolder } from '@/src/models/dial/folder';
import { DialRule } from '@/src/models/dial/rule';

/**
 * Get foldername from path string
 *
 * @param {string} path - string of folder path including '/'
 * @returns {(string | undefined)} - string with folder name
 */
export const getFolderName = (path: string): string | undefined => {
  const correctPath = path.endsWith('/') ? path.slice(0, -1) : path;
  const pathSegments = correctPath.split('/');
  return pathSegments.at(-1);
};

/**
 * Modify files array by adding name as current folder name from file path
 *
 * @param {DialFile[]} files - array of DialFile
 * @returns {DialFile[]} - DialFile array
 */
export const fillChildren = (files: DialFile[]): DialFile[] => {
  return [
    ...files.map((file) => {
      return {
        ...file,
        name: getFolderName(file.path),
        parentPath: `${file.path.replace(/\/[^/]+\/?$/, '')}/`,
        // TODO: Remove When we get real permissions
        permissions: ['WRITE', 'READ'],
      };
    }),
  ];
};

/**
 * Generate array of files for tree view, merging existing files with newly added files, modifying them adding children array, and skip not folders
 *
 * @template {DialFile} T - DialFile | DialPrompt | DialRule
 * @param {DialFile[]} existingFiles - already existing array of DialFile
 * @param {(DialFile[] | null)} newFiles - new files as array of DialFile
 * @param {string} targetPath - file path string
 * @returns {T[]} - array of DialFile
 */
export const mergeFiles = <T extends DialFile>(
  existingFiles: DialFile[],
  newFiles: DialFile[] | null,
  targetPath: string,
): T[] => {
  if (!existingFiles || existingFiles.length === 0) {
    return [
      {
        name: getFolderName(targetPath),
        path: targetPath,
        nodeType: DialFileNodeType.FOLDER,
        // TODO: Remove When we get real permissions
        permissions: ['WRITE', 'READ'],
        items: fillChildren(newFiles as T[]),
      } as T,
    ];
  }
  return existingFiles.map((file) => {
    const currentPath = file.path;

    if (file.nodeType === DialFileNodeType.FOLDER) {
      if (currentPath === targetPath) {
        return {
          ...file,
          name: getFolderName(file.path),
          items: newFiles?.length ? fillChildren(newFiles) : void 0,
        } as T;
      } else if (file.items) {
        return {
          ...file,
          name: getFolderName(file.path),
          items: mergeFiles([...file.items], newFiles, targetPath),
        } as T;
      }
    }
    return file as T;
  });
};

/**
 * Generate correct map of rules, takes full path of folder, and if some parents missed in map, add them as empty array
 *
 * @param {string} path - full folder path string
 * @param {Record<string, DialRule[]>} rules - rules map for folder, can include parent rules
 * @returns {Record<string, DialRule[]>} - rules map, including missed parent rules
 */
export const fillFolderRules = (path: string, rules?: Record<string, DialRule[]>): Record<string, DialRule[]> => {
  const parentFolders = path.split('/').filter(Boolean);
  const result: Record<string, DialRule[]> = { ...(rules || {}) };

  let currentPath = '';
  for (const folder of parentFolders) {
    currentPath += folder + '/';
    if (!(currentPath in result)) {
      result[currentPath] = [];
    }
  }

  return result;
};

/**
 * Generate list of paths for all given folder siblings
 *
 * @param {string} path - folder path
 * @param {DialFolder} folder - root folder
 * @returns {string[]} - array of string paths
 */
export const findFolderSiblings = (path: string, folder: DialFolder): string[] => {
  const traverse = (node: DialFolder, parent: DialFolder | null): string[] | null => {
    if (node.path === path) {
      if (!parent || !parent.items) return [];
      return parent.items
        .filter((sibling) => sibling.path !== path && sibling.nodeType === DialFileNodeType.FOLDER)
        .map((sibling) => sibling.path);
    }

    if (node.items) {
      for (const child of node.items) {
        const result = traverse(child, node);
        if (result !== null) return result;
      }
    }

    return null;
  };

  const result = traverse(folder, null);
  return result ?? [];
};

/**
 * Generate list of paths for all given folder siblings
 *
 * @param {string} path - folder path
 * @param {DialFolder} folder - root folder
 * @returns {string[]} - array of string paths
 */
export const findFolderChildren = (path: string, folder: DialFolder): string[] => {
  const traverse = (node: DialFolder): string[] | null => {
    if (node.path === path) {
      if (!node.items) return [];
      return node.items.filter((child) => child.nodeType === DialFileNodeType.FOLDER).map((child) => child.path);
    }

    if (node.items) {
      for (const child of node.items) {
        const result = traverse(child);
        if (result !== null) return result;
      }
    }

    return null;
  };

  const result = traverse(folder);
  return result ?? [];
};
