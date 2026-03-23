import { describe, expect, test, vi } from 'vitest';
import { getAllSelectedItemsPaths } from '../utils';

describe('Prompts', () => {
  describe('getAllSelectedItemsPaths', () => {
    test('should get all selected paths for base path', () => {
      const mockSelectedVersionsMap = {
        'public/test': ['1', '2', '3'],
      };
      const basePath = 'public/test__3';
      const result = getAllSelectedItemsPaths(basePath, mockSelectedVersionsMap);

      expect(result).toHaveLength(3);
      expect(result).to.have.members(['public/test__1', 'public/test__2', 'public/test__3']);
    });

    test('should get base path if selected items no specified', () => {
      const mockSelectedVersionsMap = {};
      const basePath = 'public/test__3';
      const result = getAllSelectedItemsPaths(basePath, mockSelectedVersionsMap);

      expect(result).toHaveLength(1);
      expect(result).to.have.members(['public/test__3']);
    });
  });
});
