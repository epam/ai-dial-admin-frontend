import { IMPORT_RESOLUTIONS } from '../import';
import { ImportFileType } from '@/src/types/import';
import { describe, expect, test, vi } from 'vitest';

describe('Prompts list :: IMPORT_RESOLUTIONS', () => {
  const mockT = vi.fn().mockReturnValue('Translated Text');
  test('Should return 2 resolutions', () => {
    const res = IMPORT_RESOLUTIONS(mockT);
    expect(res.length).toEqual(2);
  });

  test('Should return 3 resolutions', () => {
    const res = IMPORT_RESOLUTIONS(mockT, ImportFileType.JSON);
    expect(res.length).toEqual(3);
  });
});
