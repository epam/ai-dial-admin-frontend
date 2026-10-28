/**
 * Shared by every asset type's import (prompts/toolsets/applications): resolves the
 * destination path for an imported entity. Versioned types (application/toolset) pass the
 * entity's parsed `version` so it is rejoined onto the name; versionless types (prompt/
 * conversation) pass `undefined` and the name is used as-is. `flatImport` drops the entity's
 * original intermediate folder segments, landing it directly under the destination root;
 * otherwise the original folder structure (relative to its own bucket root) is preserved
 * under the destination root.
 */
export const resolveImportDestination = (
  destinationRoot: string,
  originalFolderId: string,
  name: string,
  version: string | undefined,
  flatImport?: boolean,
): string => {
  // Imported ids are authoritative, including untouched legacy blank suffixes.
  const versionedName = version == null ? name : `${name}__${version}`;
  if (flatImport) {
    return `${destinationRoot}${versionedName}`;
  }
  const segments = originalFolderId.split('/').filter(Boolean);
  const relativeFolder = segments.slice(1).join('/');
  const relativePrefix = relativeFolder ? `${relativeFolder}/` : '';
  return `${destinationRoot}${relativePrefix}${versionedName}`;
};
