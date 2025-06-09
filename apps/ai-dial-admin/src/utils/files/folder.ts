import { DialFile, DialFileNodeType } from '@/src/models/dial/file';
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
        children: fillChildren(newFiles as T[]),
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
          children: newFiles?.length ? fillChildren(newFiles) : void 0,
        } as T;
      } else if (file.children) {
        return {
          ...file,
          name: getFolderName(file.path),
          children: mergeFiles([...file.children], newFiles, targetPath),
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
export const fillFolderRules = (path: string, rules: Record<string, DialRule[]> | null): Record<string, DialRule[]> => {
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
