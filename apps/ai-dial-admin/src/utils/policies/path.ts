import { PLATFORM_ROOT_FOLDER } from '@/src/utils/files/root-folder';

/**
 * The cost object a policy record is stored under, from any shape a caller holds a folder in:
 * `platform/team-a/` (a list path), `team-a/` (a metadata `folderId`) or `team-a`. A root entry — a
 * global policy — has none, so `platform/` and `''` both give `''`.
 */
export const getCostObjectFromFolder = (folderId?: string): string => {
  const trimmed = (folderId ?? '').replace(/\/+$/, '');
  if (trimmed === PLATFORM_ROOT_FOLDER) {
    return '';
  }
  return trimmed.startsWith(`${PLATFORM_ROOT_FOLDER}/`) ? trimmed.slice(PLATFORM_ROOT_FOLDER.length + 1) : trimmed;
};

/**
 * The cost object folder as Core lists it: `team-a/`, with the trailing slash it requires (without one Core
 * reads `team-a` as a record name). Empty for the root, which is not a folder.
 */
export const getCostObjectFolderPath = (folderId?: string): string => {
  const costObject = getCostObjectFromFolder(folderId);
  return costObject ? `${costObject}/` : '';
};

/**
 * Drops the records a deleted cost object folder already takes with it, so each one is deleted once: a
 * second delete of a record the folder pass removed would come back not-found and fail the whole batch.
 */
export const excludeRecordsInFolders = <T extends { path: string }>(records: T[], folderPaths: string[]): T[] => {
  const folders = folderPaths.map(getCostObjectFolderPath).filter(Boolean);
  // A row's path is `team-a/name` or, from a list path, `platform/team-a/name`.
  const isInFolder = (path: string) => folders.some((folder) => getCostObjectFromFolder(path).startsWith(folder));
  return records.filter((record) => !isInFolder(record.path));
};

/** `[costObject/]name`, the path under `policies/platform/` or `policy_assignments/platform/`. */
export const getPolicyRecordPath = (name: string, folderId?: string): string => {
  const costObject = getCostObjectFromFolder(folderId);
  return costObject ? `${costObject}/${name}` : name;
};
