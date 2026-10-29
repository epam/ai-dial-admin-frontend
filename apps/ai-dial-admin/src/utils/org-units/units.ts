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

export const toUnitMap = (units: OrgUnit[]): Record<string, OrgUnit> =>
  Object.fromEntries(units.map((unit) => [normalizeFolder(unit.folder), unit]));

/** Nearest unit at or above `path`; the trailing slash makes `Risk/` never match `Risk2/`. */
export const getOwningUnit = (units: Record<string, OrgUnit>, path: string): OrgUnit | undefined => {
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
