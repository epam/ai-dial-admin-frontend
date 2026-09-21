import { AssetApp, AssetWithVersion } from '@/src/models/dial/deployment-asset';
import { DialFile } from '@/src/models/dial/file';
import { DialPrompt } from '@/src/models/dial/prompt';
import { ApplicationRoute } from '@/src/types/routes';
import { describe, expect, test } from 'vitest';
import {
  changeExportFileData,
  changeExportGridData,
  changeExportAssetData,
  generateExportList,
  generateRowDataForExportGrid,
  getExportGridData,
} from '../export';

// Every fixture here needs `path` and `folderId`, which `DialFile` requires and the utils spread
// through to their result — so the expectations reuse the same objects rather than restating a shape.
// Apps stand in for the versioned-asset paths: prompts are versionless, so `generateRowDataForExportGrid`
// and `changeExportAssetData` no longer accept them.
const appAsset = (overrides: Partial<AssetApp> = {}): AssetApp => ({
  path: 'applications/public/folder',
  folderId: 'public',
  version: '1.0.0',
  ...overrides,
});

const fileAsset = (overrides: Partial<DialFile> = {}): DialFile => ({
  path: 'files/public/folder',
  folderId: 'public',
  ...overrides,
});

describe('generateRowDataForExportGrid', () => {
  test('Should return similar data', () => {
    const apps = [
      appAsset({ name: 'name1', version: '1.0.0' }),
      appAsset({ name: 'name2', version: '1.0.0' }),
    ];
    const exportedApps: AssetWithVersion[] = [];
    const res = generateRowDataForExportGrid(apps, exportedApps);
    expect(res).toMatchObject([
      { name: 'name1', version: '1.0.0', versions: ['1.0.0'] },
      { name: 'name2', version: '1.0.0', versions: ['1.0.0'] },
    ]);
  });
  test('Should return merged data', () => {
    const apps = [
      appAsset({ name: 'name1', version: '1.0.0' }),
      appAsset({ name: 'name1', version: '2.0.0' }),
      appAsset({ name: 'name1', version: '3.0.0' }),
      appAsset({ name: 'name2', version: '1.0.0' }),
    ];
    const exportedApps: AssetWithVersion[] = [];
    const res = generateRowDataForExportGrid(apps, exportedApps);
    expect(res).toMatchObject([
      { name: 'name1', version: '3.0.0', versions: ['1.0.0', '2.0.0', '3.0.0'] },
      { name: 'name2', version: '1.0.0', versions: ['1.0.0'] },
    ]);
  });

  test('Should return merged data with versions if it already exported', () => {
    const apps = [
      appAsset({ name: 'name1', version: '1.0.0' }),
      appAsset({ name: 'name1', version: '2.0.0' }),
      appAsset({ name: 'name1', version: '3.0.0' }),
      appAsset({ name: 'name2', version: '1.0.0' }),
    ];
    const exportedApps = [
      appAsset({ name: 'name1', version: '1.0.0' }),
      appAsset({ name: 'name1', version: '2.0.0' }),
    ];
    const res = generateRowDataForExportGrid(apps, exportedApps);
    expect(res).toMatchObject([
      { name: 'name1', version: '1.0.0, 2.0.0', versions: ['1.0.0', '2.0.0', '3.0.0'] },
      { name: 'name2', version: '1.0.0', versions: ['1.0.0'] },
    ]);
  });
});

describe('changeExportFileData', () => {
  test('Should return object with new filePath if not exist', () => {
    const selected: DialFile[] = [];
    const fetched = {};
    const exported = {};
    const filePath = 'filePath';
    const res = changeExportFileData(selected, fetched, filePath, exported);
    expect(res).toEqual({});
  });
  test('Should return object with new filled data for filePath', () => {
    const selected = [fileAsset({ name: 'name1', extension: '.jpg' })];
    const fetchedFile = fileAsset({ name: 'name1.jpg' });
    const fetched = { filePath: [fetchedFile] };
    const exported = {};
    const filePath = 'filePath';
    const res = changeExportFileData(selected, fetched, filePath, exported);
    expect(res).toEqual({ filePath: [fetchedFile] });
  });
});

describe('changeExportAssetData', () => {
  test('Should return object with new filePath if not exist', () => {
    const selected: AssetWithVersion[] = [];
    const fetched = {};
    const exported = {};
    const filePath = 'filePath';
    const res = changeExportAssetData(selected, fetched, filePath, exported);
    expect(res).toEqual({});
  });
  test('Should return object with new filled data for filePath', () => {
    const nameOne = appAsset({ name: 'name1', version: '1.0.0' });
    const selected = [nameOne];
    const fetched = { filePath: [nameOne] };
    const exported = {};
    const filePath = 'filePath';
    const res = changeExportAssetData(selected, fetched, filePath, exported);
    expect(res).toEqual({ filePath: [nameOne] });
  });
  test('Should return filtered object with data for filePath', () => {
    const selected = [appAsset({ name: 'name1', version: '1.0.0, 2.0.0, 3.0.0' })];
    const fetched = {
      filePath: [
        appAsset({ name: 'name1', version: '1.0.0' }),
        appAsset({ name: 'name1', version: '2.0.0' }),
        appAsset({ name: 'name1', version: '3.0.0' }),
        appAsset({ name: 'name2', version: '1.0.0' }),
      ],
    };
    const exported = {};
    const filePath = 'filePath';
    const res = changeExportAssetData(selected, fetched, filePath, exported);
    expect(res).toEqual({
      filePath: [
        appAsset({ name: 'name1', version: '1.0.0' }),
        appAsset({ name: 'name1', version: '2.0.0' }),
        appAsset({ name: 'name1', version: '3.0.0' }),
      ],
    });
  });
});

describe('generateExportList', () => {
  test('Should convert object of folders into array of paths', () => {
    const res = generateExportList({
      folder1: [fileAsset({ path: 'path1' }), fileAsset({ path: 'path2' })],
      folder2: [fileAsset({ path: 'path12' }), fileAsset({ path: 'path24' })],
    });
    expect(res).toEqual(['path1', 'path2', 'path12', 'path24']);
  });
});

describe('getExportGridData', () => {
  const mockFetchedPrompts: DialPrompt[] = [
    { id: '1', name: 'Prompt 1', path: 'public/Prompt 1', folderId: 'public/' },
  ];
  const mockSelectedPrompts: DialPrompt[] = [
    { id: '2', name: 'Prompt 2', path: 'public/Prompt 2', folderId: 'public/' },
  ];
  const mockFetchedFiles: DialFile[] = [
    { id: '1', name: 'File 1', extension: '', path: 'public/File 1', folderId: 'public/' },
  ];
  const mockSelectedFiles: DialFile[] = [{ id: '2', name: 'File 2', path: 'public/File 2', folderId: 'public/' }];

  test('should call getGridFileData when route is Files', () => {
    const result = getExportGridData(ApplicationRoute.Files, mockFetchedFiles, mockSelectedFiles);

    expect(result).toEqual(mockFetchedFiles);
  });

  test('should call generatePromptRowDataForExportGrid when route is Prompts', () => {
    const result = getExportGridData(ApplicationRoute.Prompts, mockFetchedPrompts, mockSelectedPrompts);

    expect(result).toEqual(mockFetchedPrompts);
  });

  test('should return an empty array when route is undefined or does not match any known route', () => {
    const resultWithUndefinedRoute = getExportGridData();
    const resultWithUnknownRoute = getExportGridData('SomeOtherRoute' as ApplicationRoute);

    expect(resultWithUndefinedRoute).toEqual([]);
    expect(resultWithUnknownRoute).toEqual([]);
  });
});

describe('changeExportGridData', () => {
  // Prompts are versionless: rows match by their plain path, no name+version pairing.
  const mockFetchedPrompts: Record<string, DialPrompt[]> = {
    filePath: [{ id: '1', name: 'Prompt 1', path: 'public/Prompt 1', folderId: 'public/' }],
  };
  const mockSelectedPrompts: Record<string, DialPrompt[]> = {
    filePath: [{ id: '2', name: 'Prompt 2', path: 'public/Prompt 2', folderId: 'public/' }],
  };
  const mockFetchedFiles: Record<string, DialFile[]> = {
    filePath: [{ id: '1', name: 'File 1.jpg', path: 'public/File 1.jpg', folderId: 'public/' }],
  };
  const mockSelectedFiles: Record<string, DialFile[]> = {
    filePath: [{ id: '2', name: 'File 2', path: 'public/File 2', folderId: 'public/' }],
  };
  const mockSelectedRows: (DialPrompt | DialFile)[] = [
    { id: '1', name: 'Prompt 1', path: 'public/Prompt 1', folderId: 'public/' },
    { id: '2', name: 'File 1', extension: '.jpg', path: 'public/File 1.jpg', folderId: 'public/' },
  ];
  const filePath = 'filePath';

  test('should return updated prompt data when route is Prompts', () => {
    const result = changeExportGridData(
      ApplicationRoute.Prompts,
      mockFetchedPrompts,
      mockSelectedPrompts,
      mockSelectedRows,
      filePath,
    );

    expect(result).toEqual({
      filePath: [{ id: '1', name: 'Prompt 1', path: 'public/Prompt 1', folderId: 'public/' }],
    });
  });

  test('should return updated file data when route is Files', () => {
    const result = changeExportGridData(
      ApplicationRoute.Files,
      mockFetchedFiles,
      mockSelectedFiles,
      mockSelectedRows,
      filePath,
    );

    expect(result).toEqual({
      filePath: [{ id: '1', name: 'File 1.jpg', path: 'public/File 1.jpg', folderId: 'public/' }],
    });
  });

  test('should return empty object if route is not Prompts or Files', () => {
    const result = changeExportGridData(
      'SomeOtherRoute' as ApplicationRoute,
      mockFetchedPrompts,
      mockSelectedPrompts,
      mockSelectedRows,
      filePath,
    );

    expect(result).toEqual({});
  });

  test('should return empty object if route is undefined', () => {
    const result = changeExportGridData(undefined, mockFetchedPrompts, mockSelectedPrompts, mockSelectedRows, filePath);

    expect(result).toEqual({});
  });
});
