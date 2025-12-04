import { describe, test, expect } from 'vitest';
import { buildAssetUrl, buildCreateFolderUrl } from '../utils';
import { ResourceType } from '@/src/types/resource-type';
import { ResourceOperation } from '../constants';
import { ApplicationRoute } from '@/src/types/routes';
import { ImportFileType } from '@/src/types/import';

describe('buildAssetUrl', () => {
  test('returns base path for resource', () => {
    expect(buildAssetUrl(ResourceType.PROMPT)).toContain('prompt');
  });
  test('returns path with operation', () => {
    expect(buildAssetUrl(ResourceType.PROMPT, ResourceOperation.IMPORT_JSON)).toContain('import-json');
  });
});

describe('buildCreateFolderUrl', () => {
  test('returns correct url for Prompts archive', () => {
    expect(buildCreateFolderUrl(ImportFileType.ARCHIVE, ApplicationRoute.Prompts)).toContain('import-zip');
  });
  test('returns correct url for Prompts json', () => {
    expect(buildCreateFolderUrl(ImportFileType.JSON, ApplicationRoute.Prompts)).toContain('import-json');
  });
  test('returns correct url for Files archive', () => {
    expect(buildCreateFolderUrl(ImportFileType.ARCHIVE, ApplicationRoute.Files)).toContain('import-zip');
  });
  test('returns correct url for Files json', () => {
    expect(buildCreateFolderUrl(ImportFileType.JSON, ApplicationRoute.Files)).toContain('import-json');
  });
  test('returns correct url for AssetsApplications archive', () => {
    expect(buildCreateFolderUrl(ImportFileType.ARCHIVE, ApplicationRoute.AssetsApplications)).toContain('import-zip');
  });
  test('returns correct url for AssetsApplications json', () => {
    expect(buildCreateFolderUrl(ImportFileType.JSON, ApplicationRoute.AssetsApplications)).toContain('import-json');
  });
  test('returns correct url for AssetsToolsets archive', () => {
    expect(buildCreateFolderUrl(ImportFileType.ARCHIVE, ApplicationRoute.AssetsToolsets)).toContain('import-zip');
  });
  test('returns correct url for AssetsToolsets json', () => {
    expect(buildCreateFolderUrl(ImportFileType.JSON, ApplicationRoute.AssetsToolsets)).toContain('import-json');
  });
  test('returns empty string for unknown view', () => {
    expect(buildCreateFolderUrl(ImportFileType.JSON, undefined)).toBe('');
  });
});
