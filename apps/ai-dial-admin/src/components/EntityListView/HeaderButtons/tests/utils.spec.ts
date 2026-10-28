import { describe, test, expect, vi } from 'vitest';
import {
  getAssetIdByNameAndVersion,
  getFormDataForImport,
  getImportFunction,
  getImportTitle,
} from '@/src/components/EntityListView/HeaderButtons/utils';
import { ApplicationRoute } from '@/src/types/routes';
import { ImportFileType, ConflictResolutionPolicy } from '@/src/types/import';
import { DialPrompt } from '@/src/models/dial/prompt';
import { DialFileNodeType } from '@epam/ai-dial-react-file-manager';

describe('getAssetIdByNameAndVersion', () => {
  test('encodes a newly entered name without re-encoding the incoming suffix', () => {
    expect(getAssetIdByNameAndVersion('applications/public/assistant__release%20candidate', 'renamed %20 未来')).toBe(
      'applications/public/renamed%20%2520%20%E6%9C%AA%E6%9D%A5__release%20candidate',
    );
  });
  test.each(['stable', 'release%20candidate', '未来 #?%', '', ' '])(
    'preserves the original suffix %j despite a draft version',
    (version) => {
      expect(
        getAssetIdByNameAndVersion(
          `applications/public/assistant__internal__${version}`,
          'renamed__internal',
          'forged',
        ),
      ).toBe(`applications/public/renamed__internal__${version}`);
    },
  );
  test('keeps an unversioned legacy id unversioned', () => {
    expect(getAssetIdByNameAndVersion('applications/public/assistant', 'renamed', 'forged')).toBe(
      'applications/public/renamed',
    );
  });
});

describe('getFormDataForImport', () => {
  test.each([ApplicationRoute.AssetsApplications, ApplicationRoute.AssetsToolsets])(
    'retains path and display versions independently for %s JSON import',
    (route) => {
      const source = {
        id: 'applications/public/assistant__internal__stable',
        name: 'renamed',
        version: 'forged',
        display_version: 'Spring release',
        path: '',
        folderId: '',
      };
      const file =
        route === ApplicationRoute.AssetsApplications
          ? { applications: [source] }
          : { toolSets: [{ ...source, id: 'toolsets/public/assistant__internal__stable' }] };
      getFormDataForImport(
        'public/target/',
        file,
        ImportFileType.JSON,
        ConflictResolutionPolicy.SKIP,
        undefined,
        true,
        route,
      );
      const entry = 'applications' in file ? file.applications?.[0] : file.toolSets[0];
      expect(entry?.id).toBe(
        `${route === ApplicationRoute.AssetsApplications ? 'applications' : 'toolsets'}/public/renamed__stable`,
      );
      expect(entry?.display_version).toBe('Spring release');
    },
  );
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
