import { OverridePathOperation } from '@/src/components/BaseControls/InterfacesField/models';

const ID_TOKEN = '{id}';

export const hasOverridePathIdError = (operation: OverridePathOperation, value?: string): boolean =>
  !operation.isIdApplicable && !!value?.includes(ID_TOKEN);

/**
 * Sets one operation's path, or removes it when the value is empty. Keys the editor has no input for pass
 * through untouched, and an empty map becomes `undefined` so no empty `overridePaths` is kept.
 */
export const setOverridePath = (
  overridePaths: Record<string, string> | undefined,
  key: string,
  path?: string,
): Record<string, string> | undefined => {
  const next = { ...overridePaths };

  if (path?.trim()) {
    next[key] = path;
  } else {
    delete next[key];
  }

  return Object.keys(next).length ? next : undefined;
};
