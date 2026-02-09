import { DialPrompt } from '@/src/models/dial/prompt';
import { describe, expect, test } from 'vitest';
import {
  addNewVersion,
  filterLatestVersions,
  getEntityForUpdate,
  getIsNeedToMove,
  getParentPathByFullPath,
  getVersionsPerName,
} from '../utils';

describe('filterLatestVersions', () => {
  test('Should return only latest versions', () => {
    const res = filterLatestVersions([
      { name: 'prompts', version: '7' },
      { name: 'prompts', version: '4' },
      { name: 'model', version: '1' },
      { name: 'prompts', version: '1' },
    ] as DialPrompt[]);
    expect(res).toEqual([
      { name: 'prompts', version: '7' },
      { name: 'model', version: '1' },
    ]);
  });
});

describe('getVersionsPerName', () => {
  test('Should return correct map', () => {
    const res = getVersionsPerName([
      { name: 'prompts', version: '1' },
      { name: 'prompts', version: '2' },
    ] as DialPrompt[]);
    expect(res).toEqual({
      prompts: ['1', '2'],
    });
  });
  test('Should return correct map', () => {
    const res = getVersionsPerName([
      { name: 'prompts', version: '7' },
      { name: 'prompts', version: '4' },
      { name: 'model', version: '1' },
      { name: 'prompts', version: '1' },
    ] as DialPrompt[]);
    expect(res).toEqual({
      prompts: ['1', '4', '7'],
      model: ['1'],
    });
  });
});

describe('getIsNeedToMove', () => {
  test('getIsNeedToMove returns true if folderId changed', () => {
    const entity = { folderId: '2' } as any;
    const initialEntity = { folderId: '1' } as any;
    expect(getIsNeedToMove(entity, initialEntity)).toBe(true);
  });

  test('getIsNeedToMove returns false if folderId is the same', () => {
    const entity = { folderId: '1' } as any;
    const initialEntity = { folderId: '1' } as any;
    expect(getIsNeedToMove(entity, initialEntity)).toBe(false);
  });

  test('getIsNeedToMove returns true if initialEntity is undefined', () => {
    const entity = { folderId: '1' } as any;
    expect(getIsNeedToMove(entity, undefined)).toBe(true);
  });
});

describe('getEntityForUpdate', () => {
  test('getEntityForUpdate returns entity with folderId from initialEntity', () => {
    const entity = { folderId: '2', name: 'Prompt' } as any;
    const initialEntity = { folderId: '1' } as any;
    const result = getEntityForUpdate(entity, initialEntity);
    expect(result.folderId).toBe('1');
    expect(result.name).toBe('Prompt');
  });

  test('getEntityForUpdate returns entity with folderId undefined if initialEntity is undefined', () => {
    const entity = { folderId: '2', name: 'Prompt' } as any;
    const result = getEntityForUpdate(entity, undefined);
    expect(result.folderId).toBeUndefined();
    expect(result.name).toBe('Prompt');
  });
});

describe('addNewVersion', () => {
  test('should correctly change version and path if version is numeric', () => {
    const entity = { folderId: '2', name: 'Prompt', path: 'somePath__0.0.1' } as any;
    const result = addNewVersion(entity, '1.2.3');
    expect(result).toEqual({
      folderId: '2',
      name: 'Prompt',
      path: 'somePath__1.2.3',
      version: '1.2.3',
    });
  });

  test('should correctly change version and path if version is not numeric', () => {
    const entity = { folderId: '2', name: 'Prompt', path: 'somePath__oldVersion' } as any;
    const result = addNewVersion(entity, 'newVersion');
    expect(result).toEqual({
      folderId: '2',
      name: 'Prompt',
      path: 'somePath__newVersion',
      version: 'newVersion',
    });
  });
});

describe('getParentPathByFullPath', () => {
  test('should return empty string if there is no parent path', () => {
    const fullPath = '/';
    const result = getParentPathByFullPath(fullPath);

    expect(result).toBe('/');
  });

  test('should return parent path for file', () => {
    const fullPath = '/parent/child.txt';
    const result = getParentPathByFullPath(fullPath);

    expect(result).toBe('/parent/');
  });

  test('should return parent path for folder', () => {
    const fullPath = '/parent/child/';
    const result = getParentPathByFullPath(fullPath);

    expect(result).toBe('/parent/');
  });
});
