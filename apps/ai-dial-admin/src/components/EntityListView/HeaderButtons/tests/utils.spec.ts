import { describe, test, expect, vi } from 'vitest';
import { getFormDataForImport, getImportFunction, getImportTitle } from '../utils';
import { ApplicationRoute } from '@/src/types/routes';
import { ImportFileType, ConflictResolutionPolicy } from '@/src/types/import';
import { DialPrompt } from '@/src/models/dial/prompt';
import { DialFileNodeType } from '@epam/ai-dial-ui-kit';

describe('getFormDataForImport', () => {
  test('returns FormData and fileSize for ARCHIVE', () => {
    const file = new File(['test'], 'test.zip');
    const result = getFormDataForImport('path', file, ImportFileType.ARCHIVE, ConflictResolutionPolicy.SKIP);
    expect(result.body.get('file')).toBe(file);
    expect(result.body.get('config')).toBeInstanceOf(Blob);
    expect(result.fileSize).toBe(0);
  });

  test('returns FormData for JSON', () => {
    const prompts: DialPrompt[] = [
      {
        name: '1',
        id: 'prompts/public/1__1.0.0',
        version: '1.0.0',
        nodeType: DialFileNodeType.ITEM,
        path: 'prompts/public/1__1.0.0',
        folderId: 'prompts/public/',
      },
    ];
    const result = getFormDataForImport('path', { prompts }, ImportFileType.JSON, ConflictResolutionPolicy.SKIP);
    expect(result.body.get('file')).toBeInstanceOf(Blob);
    expect(result.body.get('config')).toBeInstanceOf(Blob);
  });

  test('returns FormData and fileSize for files array', () => {
    const files = [new File(['a'], 'a.txt'), new File(['b'], 'b.txt')];

    const result = getFormDataForImport('path', files, ImportFileType.FILES, ConflictResolutionPolicy.MANUAL);
    expect(result.body.getAll('files')).toEqual(files);
  });
});

describe('getImportFunction', () => {
  test('returns correct import function', () => {
    expect(typeof getImportFunction(ApplicationRoute.Prompts)).toBe('function');
    expect(typeof getImportFunction(ApplicationRoute.Files)).toBe('function');
    expect(typeof getImportFunction(ApplicationRoute.AssetsApplications)).toBe('function');
    expect(typeof getImportFunction(ApplicationRoute.AssetsToolsets)).toBe('function');
  });
  test('returns null for unknown route', () => {
    expect(getImportFunction('Unknown' as any)).toBeNull();
  });
});

describe('getImportTitle', () => {
  test('returns correct title', () => {
    expect(getImportTitle(ApplicationRoute.Prompts)).toBeTruthy();
    expect(getImportTitle(ApplicationRoute.AssetsApplications)).toBeTruthy();
    expect(getImportTitle(ApplicationRoute.AssetsToolsets)).toBeTruthy();
    expect(getImportTitle(ApplicationRoute.Files)).toBeTruthy();
  });
  test('returns empty string for unknown route', () => {
    expect(getImportTitle('Unknown' as any)).toBe('');
  });
});
