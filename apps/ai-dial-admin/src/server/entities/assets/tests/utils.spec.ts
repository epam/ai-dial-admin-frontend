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
    expect(buildAssetUrl(ResourceType.PROMPT, ResourceOperation.IMPORT_JSON)).toContain(ResourceOperation.IMPORT_JSON);
  });
});

describe('buildCreateFolderUrl', () => {
  test('returns correct url for Prompts archive', () => {
    expect(buildCreateFolderUrl(ImportFileType.ARCHIVE, ApplicationRoute.Prompts)).toContain(
      ResourceOperation.IMPORT_ZIP,
    );
  });
  test('returns correct url for Prompts json', () => {
    expect(buildCreateFolderUrl(ImportFileType.JSON, ApplicationRoute.Prompts)).toContain(
      ResourceOperation.IMPORT_JSON,
    );
  });
  test('returns correct url for Files archive', () => {
    expect(buildCreateFolderUrl(ImportFileType.ARCHIVE, ApplicationRoute.Files)).toContain(
      ResourceOperation.IMPORT_ZIP,
    );
  });
  test('returns correct url for Files json', () => {
    expect(buildCreateFolderUrl(ImportFileType.JSON, ApplicationRoute.Files)).toContain(ResourceOperation.IMPORT);
  });
  test('returns correct url for AssetsApplications archive', () => {
    expect(buildCreateFolderUrl(ImportFileType.ARCHIVE, ApplicationRoute.AssetsApplications)).toContain(
      ResourceOperation.IMPORT_ZIP,
    );
  });
  test('returns correct url for AssetsApplications json', () => {
    expect(buildCreateFolderUrl(ImportFileType.JSON, ApplicationRoute.AssetsApplications)).toContain(
      ResourceOperation.IMPORT_JSON,
    );
  });
  test('returns correct url for AssetsToolsets archive', () => {
    expect(buildCreateFolderUrl(ImportFileType.ARCHIVE, ApplicationRoute.AssetsToolsets)).toContain(
      ResourceOperation.IMPORT_ZIP,
    );
  });
  test('returns correct url for AssetsToolsets json', () => {
    expect(buildCreateFolderUrl(ImportFileType.JSON, ApplicationRoute.AssetsToolsets)).toContain(
      ResourceOperation.IMPORT_JSON,
    );
  });
  test('returns empty string for unknown view', () => {
    expect(buildCreateFolderUrl(ImportFileType.JSON, undefined)).toBe('');
  });
});
