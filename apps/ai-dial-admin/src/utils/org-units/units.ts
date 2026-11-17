import { BucketType, MovableAssetListItem } from '@/src/models/dial/asset-list-item';
import { DialFileNodeType } from '@/src/models/dial/file';
import { OrgUnit } from '@/src/models/dial/org-unit';
import { addTrailingSlash } from '@/src/utils/url';

export const PUBLIC_FOLDER = 'public/';
export const MAX_UNIT_LEVEL = 4;

export enum UnitFolderRole {
  UNIT = 'unit',
  CONTAINS_UNIT = 'containsUnit',
}

export enum NewUnitBlock {
  NOT_A_UNIT_PARENT = 'notAUnitParent',
  TOO_DEEP = 'tooDeep',
}

const safeDecode = (segment: string): string => {
  try {
    return decodeURIComponent(segment);
  } catch {
    return segment;
  }
};

/** Decoded, trailing-slash form used to key and compare folders; tree paths and core `folder` values both reduce to it. */
export const normalizeFolder = (path: string): string => addTrailingSlash(path.split('/').map(safeDecode).join('/'));

export const toUnitMap = <T extends OrgUnit>(units: T[]): Record<string, T> =>
  Object.fromEntries(units.map((unit) => [normalizeFolder(unit.folder), unit]));

/** Nearest unit at or above `path`; the trailing slash makes `Risk/` never match `Risk2/`. */
export const getOwningUnit = <T extends OrgUnit>(units: Record<string, T>, path: string): T | undefined => {
  const folder = normalizeFolder(path);
  const key = Object.keys(units)
    .filter((unitFolder) => folder.startsWith(unitFolder))
    .sort((a, b) => b.length - a.length)[0];
  return key == null ? undefined : units[key];
};

export const isUnitFolder = (units: Record<string, OrgUnit>, path: string): boolean => normalizeFolder(path) in units;

export const isInsideUnit = (units: Record<string, OrgUnit>, path: string): boolean =>
  getOwningUnit(units, path) != null && !isUnitFolder(units, path);

/** True when a unit sits strictly below `path`. */
export const containsUnit = (units: Record<string, OrgUnit>, path: string): boolean => {
  const folder = normalizeFolder(path);
  return Object.keys(units).some((unitFolder) => unitFolder !== folder && unitFolder.startsWith(folder));
};

/** `public/Acme/` is level 1. */
export const getUnitLevel = (folder: string): number => normalizeFolder(folder).split('/').filter(Boolean).length - 1;

/** Why a unit cannot be created under `path`, or `undefined` when it can. */
export const getNewUnitBlock = (units: Record<string, OrgUnit>, path: string): NewUnitBlock | undefined => {
  const folder = normalizeFolder(path);
  if (folder === PUBLIC_FOLDER) {
    return undefined;
  }
  const owner = getOwningUnit(units, folder);
  if (owner == null || !isUnitFolder(units, folder)) {
    return NewUnitBlock.NOT_A_UNIT_PARENT;
  }
  return getUnitLevel(folder) >= MAX_UNIT_LEVEL ? NewUnitBlock.TOO_DEEP : undefined;
};

/** A unit and every unit below it, shallowest first. */
export const getUnitWithDescendants = (units: Record<string, OrgUnit>, unitFolder: string): OrgUnit[] => {
  const folder = normalizeFolder(unitFolder);
  return Object.keys(units)
    .filter((key) => key.startsWith(folder))
    .sort((a, b) => a.length - b.length)
    .map((key) => units[key]);
};

/** Whether a folder is a unit, or a plain folder with a unit somewhere below it. */
export const getUnitFolderRole = (units: Record<string, OrgUnit>, path: string): UnitFolderRole | undefined => {
  if (isUnitFolder(units, path)) {
    return UnitFolderRole.UNIT;
  }
  return containsUnit(units, path) ? UnitFolderRole.CONTAINS_UNIT : undefined;
};

/** `public/Acme/Risk/` → `public/Acme/`; the folder itself is returned for a root-level `public/`. */
const getParentFolder = (folder: string): string => folder.slice(0, folder.lastIndexOf('/', folder.length - 2) + 1);

/**
 * Folder rows for the units directly below `path`, shaped like the rows a type's own listing returns for
 * a folder: decoded `name` and `path` (trailing slash) and the parent as `folderId`. Every ancestor of a
 * unit is a unit too (Core), so a unit's parent folder is always in `units` or is `public/`.
 */
export const getChildUnitRows = (units: Record<string, OrgUnit>, path: string): MovableAssetListItem[] => {
  const parent = normalizeFolder(path);
  return Object.entries(units)
    .filter(([folder]) => getParentFolder(folder) === parent)
    .map(([folder, unit]) => ({
      name: unit.name,
      path: folder,
      folderId: parent,
      nodeType: DialFileNodeType.FOLDER,
      bucket: BucketType.Public,
      author: unit.author,
      createdAt: unit.createdAt == null ? undefined : String(unit.createdAt),
    }));
};

/** Identifies the set of unit folders; a display-name change leaves it equal. */
export const getUnitSetSignature = (units: Record<string, OrgUnit>): string => Object.keys(units).sort().join('|');
