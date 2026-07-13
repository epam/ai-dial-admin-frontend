import { getVersionedName } from '@/src/server/publications/path';

/**
 * Shared by every versioned asset type's import (prompts/toolsets/applications): resolves
 * the destination path for an imported entity. `flatImport` drops the entity's original
 * intermediate folder segments, landing it directly under the destination root; otherwise
 * the original folder structure (relative to its own bucket root) is preserved under the
 * destination root.
 */
export const resolveImportDestination = (
  destinationRoot: string,
  originalFolderId: string,
  name: string,
  version: string | undefined,
  flatImport?: boolean,
): string => {
  const versionedName = getVersionedName(name, version);
  if (flatImport) {
    return `${destinationRoot}${versionedName}`;
  }
  const segments = originalFolderId.split('/').filter(Boolean);
  const relativeFolder = segments.slice(1).join('/');
  const relativePrefix = relativeFolder ? `${relativeFolder}/` : '';
  return `${destinationRoot}${relativePrefix}${versionedName}`;
};
