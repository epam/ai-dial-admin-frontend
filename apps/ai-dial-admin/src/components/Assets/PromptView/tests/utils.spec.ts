import { describe, expect, test } from 'vitest';
import { addNewVersion } from '../utils';

describe('PromptView :: utils :: addNewVersion', () => {
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
