import { PLATFORM_ROOT_FOLDER } from '@/src/utils/files/root-folder';

export const isPolicyPathElementValid = (value?: string): boolean => !!value && !/[^A-Za-z0-9._:@[\]()-]/.test(value);

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

/** `[costObject/]name`, the path under `policies/platform/` or `policy_assignments/platform/`. */
export const getPolicyRecordPath = (name: string, folderId?: string): string => {
  const costObject = getCostObjectFromFolder(folderId);
  return costObject ? `${costObject}/${name}` : name;
};

/** The cost object of a policy record from its path (`platform/team-a/name` or `team-a/name`); a global record has none. */
export const getCostObjectOfRecord = (path?: string): string => {
  const segments = (path ?? '').split('/').filter(Boolean);
  const withoutRoot = segments[0] === PLATFORM_ROOT_FOLDER ? segments.slice(1) : segments;
  return withoutRoot.length > 1 ? withoutRoot.slice(0, -1).join('/') : '';
};
