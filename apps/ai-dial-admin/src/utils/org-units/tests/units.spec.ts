import { describe, expect, test } from 'vitest';

import { OrgUnit } from '@/src/models/dial/org-unit';
import {
  NewUnitBlock,
  UnitFolderRole,
  containsUnit,
  getNewUnitBlock,
  getOwningUnit,
  getUnitFolderRole,
  getUnitLevel,
  getUnitWithDescendants,
  isInsideUnit,
  isUnitFolder,
  normalizeFolder,
  toUnitMap,
} from '../units';

const unit = (folder: string, name: string): OrgUnit => ({
  id: name,
  name,
  displayName: name,
  path: decodeURIComponent(folder).replace(/\/$/, ''),
  folder,
});

const UNITS = toUnitMap([
  unit('public/Acme/', 'Acme'),
  unit('public/Acme/Risk/', 'Risk'),
  unit('public/Acme/Risk/US%20Risk/', 'US Risk'),
  unit('public/A/', 'A'),
  unit('public/A/B/', 'B'),
  unit('public/A/B/C/', 'C'),
  unit('public/A/B/C/D/', 'D'),
]);

describe('normalizeFolder', () => {
  test('decodes segments and adds a trailing slash', () => {
    expect(normalizeFolder('public/Acme/Risk/US%20Risk')).toBe('public/Acme/Risk/US Risk/');
  });

  test('keeps a malformed escape as is', () => {
    expect(normalizeFolder('public/100%/')).toBe('public/100%/');
  });
});

describe('getOwningUnit', () => {
  test('returns the unit itself for an exact match', () => {
    expect(getOwningUnit(UNITS, 'public/Acme/Risk/')?.name).toBe('Risk');
  });

  test('returns the owner for a subfolder', () => {
    expect(getOwningUnit(UNITS, 'public/Acme/Risk/models/')?.name).toBe('Risk');
  });

  test('prefers the nearest unit', () => {
    expect(getOwningUnit(UNITS, 'public/Acme/Risk/US Risk/x/')?.name).toBe('US Risk');
  });

  test('does not treat a name prefix as ownership', () => {
    expect(getOwningUnit(UNITS, 'public/Acme/Risk2/')?.name).toBe('Acme');
    expect(getOwningUnit(UNITS, 'public/Handbook/')).toBeUndefined();
  });

  test('matches an encoded tree path', () => {
    expect(getOwningUnit(UNITS, 'public/Acme/Risk/US%20Risk/')?.name).toBe('US Risk');
  });
});

describe('isUnitFolder / isInsideUnit / containsUnit', () => {
  test('tell a unit from a folder inside it', () => {
    expect(isUnitFolder(UNITS, 'public/Acme/')).toBe(true);
    expect(isUnitFolder(UNITS, 'public/Acme/docs/')).toBe(false);
    expect(isInsideUnit(UNITS, 'public/Acme/docs/')).toBe(true);
    expect(isInsideUnit(UNITS, 'public/Acme/')).toBe(false);
    expect(isInsideUnit(UNITS, 'public/Handbook/')).toBe(false);
  });

  test('containsUnit is true only for a folder with a unit below it', () => {
    expect(containsUnit(UNITS, 'public/')).toBe(true);
    expect(containsUnit(UNITS, 'public/Acme/')).toBe(true);
    expect(containsUnit(UNITS, 'public/Acme/Risk/US Risk/')).toBe(false);
    expect(containsUnit(UNITS, 'public/Handbook/')).toBe(false);
  });
});

describe('getUnitLevel', () => {
  test('counts segments below public', () => {
    expect(getUnitLevel('public/Acme/')).toBe(1);
    expect(getUnitLevel('public/A/B/C/D/')).toBe(4);
  });
});

describe('getNewUnitBlock', () => {
  test('allows the shared space and a unit above the deepest level', () => {
    expect(getNewUnitBlock(UNITS, 'public/')).toBeUndefined();
    expect(getNewUnitBlock(UNITS, 'public/Acme/')).toBeUndefined();
  });

  test('blocks a plain folder, even one under a unit', () => {
    expect(getNewUnitBlock(UNITS, 'public/Handbook/')).toBe(NewUnitBlock.NOT_A_UNIT_PARENT);
    expect(getNewUnitBlock(UNITS, 'public/Acme/docs/')).toBe(NewUnitBlock.NOT_A_UNIT_PARENT);
  });

  test('blocks a level-4 unit', () => {
    expect(getNewUnitBlock(UNITS, 'public/A/B/C/D/')).toBe(NewUnitBlock.TOO_DEEP);
  });
});

describe('getUnitWithDescendants', () => {
  test('lists the unit and everything below it, shallowest first', () => {
    expect(getUnitWithDescendants(UNITS, 'public/Acme/').map((u) => u.name)).toEqual(['Acme', 'Risk', 'US Risk']);
  });
});

describe('getUnitFolderRole', () => {
  test('tells a unit, a folder containing a unit, and neither', () => {
    expect(getUnitFolderRole(UNITS, 'public/Acme/Risk/')).toBe(UnitFolderRole.UNIT);
    expect(getUnitFolderRole(UNITS, 'public/')).toBe(UnitFolderRole.CONTAINS_UNIT);
    expect(getUnitFolderRole(UNITS, 'public/Acme/docs/')).toBeUndefined();
    expect(getUnitFolderRole(UNITS, 'public/Handbook/')).toBeUndefined();
  });
});
