import { PickedEntity } from '@/src/components/Common/EntitySelectInput/models';
import { AliasTargetType } from '@/src/models/dial/alias';
import { AssetSource } from '@/src/models/dial/asset-source';

export interface AliasTargetParts {
  type: AliasTargetType;
  /** Everything after the type segment: `public/team/assistant`, or the bare name of a config or platform one. */
  reference: string;
}

const encodePath = (path: string): string => path.split('/').map(encodeURIComponent).join('/');

/** `null` for a malformed escape, which Core would refuse as well. */
const decodePath = (path: string): string | null => {
  try {
    return path.split('/').map(decodeURIComponent).join('/');
  } catch {
    return null;
  }
};

/**
 * The `target.path` an alias stores for a picked entity. A Public pick keeps its bucket and path, as the
 * resource Core reads (`applications/public/team/assistant`), with each segment percent-encoded because Core parses
 * the path as a URL (`Code Apps` is stored as `Code%20Apps`); a Platform or config.json pick is the bare name of
 * a config deployment (`models/gpt-4`), the form the picker already emits for both, so the same name on the two
 * tabs is one target.
 */
export const toAliasTargetPath = (type: AliasTargetType, entity: PickedEntity): string =>
  entity.source === AssetSource.Public && entity.path ? `${type}/${encodePath(entity.path)}` : `${type}/${entity.name}`;

const TARGET_TYPES: readonly string[] = Object.values(AliasTargetType);

/**
 * Reads a stored `target.path` back, with the reference decoded, or `null` for one this form cannot represent (an
 * unknown type, no reference after it, or a malformed escape), so the caller can show it as plain text and leave it
 * unchanged.
 */
export const parseAliasTargetPath = (path: string | undefined): AliasTargetParts | null => {
  const separatorIndex = path ? path.indexOf('/') : -1;
  if (!path || separatorIndex <= 0) {
    return null;
  }

  const type = path.slice(0, separatorIndex);
  const reference = decodePath(path.slice(separatorIndex + 1));
  if (!TARGET_TYPES.includes(type) || !reference) {
    return null;
  }

  return { type: type as AliasTargetType, reference };
};
