import { AssetWithVersion } from '@/src/models/dial/deployment-asset';
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
const promptAsset = (overrides: Partial<DialPrompt> = {}): DialPrompt => ({
  path: 'prompts/public/folder',
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
    const prompts = [
      promptAsset({ name: 'name1', version: '1.0.0' }),
      promptAsset({ name: 'name2', version: '1.0.0' }),
    ];
    const exportedPrompts: AssetWithVersion[] = [];
    const res = generateRowDataForExportGrid(prompts, exportedPrompts);
    expect(res).toMatchObject([
      { name: 'name1', version: '1.0.0', versions: ['1.0.0'] },
      { name: 'name2', version: '1.0.0', versions: ['1.0.0'] },
    ]);
  });
  test('Should return merged data', () => {
    const prompts = [
      promptAsset({ name: 'name1', version: '1.0.0' }),
      promptAsset({ name: 'name1', version: '2.0.0' }),
      promptAsset({ name: 'name1', version: '3.0.0' }),
      promptAsset({ name: 'name2', version: '1.0.0' }),
    ];
    const exportedPrompts: AssetWithVersion[] = [];
    const res = generateRowDataForExportGrid(prompts, exportedPrompts);
    expect(res).toMatchObject([
      { name: 'name1', version: '3.0.0', versions: ['1.0.0', '2.0.0', '3.0.0'] },
      { name: 'name2', version: '1.0.0', versions: ['1.0.0'] },
    ]);
  });

  test('Should return merged data with versions if it already exported', () => {
    const prompts = [
      promptAsset({ name: 'name1', version: '1.0.0' }),
      promptAsset({ name: 'name1', version: '2.0.0' }),
      promptAsset({ name: 'name1', version: '3.0.0' }),
      promptAsset({ name: 'name2', version: '1.0.0' }),
    ];
    const exportedPrompts = [
      promptAsset({ name: 'name1', version: '1.0.0' }),
      promptAsset({ name: 'name1', version: '2.0.0' }),
    ];
    const res = generateRowDataForExportGrid(prompts, exportedPrompts);
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
    const nameOne = promptAsset({ name: 'name1', version: '1.0.0' });
    const selected = [nameOne];
    const fetched = { filePath: [nameOne] };
    const exported = {};
    const filePath = 'filePath';
    const res = changeExportAssetData(selected, fetched, filePath, exported);
    expect(res).toEqual({ filePath: [nameOne] });
  });
  test('Should return filtered object with data for filePath', () => {
    const selected = [promptAsset({ name: 'name1', version: '1.0.0, 2.0.0, 3.0.0' })];
    const fetched = {
      filePath: [
        promptAsset({ name: 'name1', version: '1.0.0' }),
        promptAsset({ name: 'name1', version: '2.0.0' }),
        promptAsset({ name: 'name1', version: '3.0.0' }),
        promptAsset({ name: 'name2', version: '1.0.0' }),
      ],
    };
    const exported = {};
    const filePath = 'filePath';
    const res = changeExportAssetData(selected, fetched, filePath, exported);
    expect(res).toEqual({
      filePath: [
        promptAsset({ name: 'name1', version: '1.0.0' }),
        promptAsset({ name: 'name1', version: '2.0.0' }),
        promptAsset({ name: 'name1', version: '3.0.0' }),
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
  const mockFetchedPrompts = [promptAsset({ id: '1', name: 'Prompt 1', versions: ['1.0.0'] })];
  const mockSelectedPrompts = [promptAsset({ id: '2', name: 'Prompt 2' })];
  const mockFetchedFiles = [fileAsset({ id: '1', name: 'File 1', extension: '' })];
  const mockSelectedFiles = [fileAsset({ id: '2', name: 'File 2' })];

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
  const mockFetchedPrompts: Record<string, DialPrompt[]> = {
    filePath: [promptAsset({ id: '1', name: 'Prompt 1' })],
  };
  const mockSelectedPrompts: Record<string, DialPrompt[]> = {
    filePath: [promptAsset({ id: '2', name: 'Prompt 2' })],
  };
  const mockFetchedFiles: Record<string, DialFile[]> = {
    filePath: [fileAsset({ id: '1', name: 'File 1.jpg' })],
  };
  const mockSelectedFiles: Record<string, DialFile[]> = {
    filePath: [fileAsset({ id: '2', name: 'File 2' })],
  };
  const mockSelectedRows: (DialPrompt | DialFile)[] = [
    promptAsset({ id: '1', name: 'Prompt 1' }),
    promptAsset({ id: '2', name: 'File 1', extension: '.jpg' }),
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

    expect(result).toEqual(mockFetchedPrompts);
  });

  test('should return updated file data when route is Files', () => {
    const result = changeExportGridData(
      ApplicationRoute.Files,
      mockFetchedFiles,
      mockSelectedFiles,
      mockSelectedRows,
      filePath,
    );

    expect(result).toEqual(mockFetchedFiles);
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
