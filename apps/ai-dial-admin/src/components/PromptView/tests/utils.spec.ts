import { describe, expect, test } from 'vitest';
import { getIsNeedToMove, getEntityForUpdate } from '../utils';

describe('PromptView :: utils :: getIsNeedToMove', () => {
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

describe('PromptView :: utils :: getEntityForUpdate', () => {
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
