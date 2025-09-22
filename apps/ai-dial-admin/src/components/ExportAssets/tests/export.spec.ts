import { DialFile } from '@/src/models/dial/file';
import { DialPrompt } from '@/src/models/dial/prompt';
import { ApplicationRoute } from '@/src/types/routes';
import { describe, expect, test, vi } from 'vitest';
import {
  changeExportFileData,
  changeExportGridData,
  changeExportPromptData,
  generateExportList,
  generatePromptRowDataForExportGrid,
  getExportGridData,
} from '../export';

describe('generatePromptRowDataForExportGrid', () => {
  test('Should return similar data', () => {
    const prompts = [
      { name: 'name1', version: '1.0.0' },
      { name: 'name2', version: '1.0.0' },
    ];
    const exportedPrompts = [];
    const res = generatePromptRowDataForExportGrid(prompts, exportedPrompts);
    expect(res).toEqual([
      { name: 'name1', version: '1.0.0', versions: ['1.0.0'] },
      { name: 'name2', version: '1.0.0', versions: ['1.0.0'] },
    ]);
  });
  test('Should return merged data', () => {
    const prompts = [
      { name: 'name1', version: '1.0.0' },
      { name: 'name1', version: '2.0.0' },
      { name: 'name1', version: '3.0.0' },
      { name: 'name2', version: '1.0.0' },
    ];
    const exportedPrompts = [];
    const res = generatePromptRowDataForExportGrid(prompts, exportedPrompts);
    expect(res).toEqual([
      { name: 'name1', version: '3.0.0', versions: ['1.0.0', '2.0.0', '3.0.0'] },
      { name: 'name2', version: '1.0.0', versions: ['1.0.0'] },
    ]);
  });

  test('Should return merged data with versions if it already exported', () => {
    const prompts = [
      { name: 'name1', version: '1.0.0' },
      { name: 'name1', version: '2.0.0' },
      { name: 'name1', version: '3.0.0' },
      { name: 'name2', version: '1.0.0' },
    ];
    const exportedPrompts = [
      { name: 'name1', version: '1.0.0' },
      { name: 'name1', version: '2.0.0' },
    ];
    const res = generatePromptRowDataForExportGrid(prompts, exportedPrompts);
    expect(res).toEqual([
      { name: 'name1', version: '1.0.0, 2.0.0', versions: ['1.0.0', '2.0.0', '3.0.0'] },
      { name: 'name2', version: '1.0.0', versions: ['1.0.0'] },
    ]);
  });
});

describe('changeExportFileData', () => {
  test('Should return object with new filePath if not exist', () => {
    const selected = [];
    const fetched = {};
    const exported = {};
    const filePath = 'filePath';
    const res = changeExportFileData(selected, fetched, filePath, exported);
    expect(res).toEqual({});
  });
  test('Should return object with new filled data for filePath', () => {
    const selected = [{ name: 'name1', extension: '.jpg' }];
    const fetched = { filePath: [{ name: 'name1.jpg' }] };
    const exported = {};
    const filePath = 'filePath';
    const res = changeExportFileData(selected, fetched, filePath, exported);
    expect(res).toEqual({ filePath: [{ name: 'name1.jpg' }] });
  });
});

describe('changeExportPromptData', () => {
  test('Should return object with new filePath if not exist', () => {
    const selected = [];
    const fetched = {};
    const exported = {};
    const filePath = 'filePath';
    const res = changeExportPromptData(selected, fetched, filePath, exported);
    expect(res).toEqual({});
  });
  test('Should return object with new filled data for filePath', () => {
    const selected = [{ name: 'name1', version: '1.0.0' }];
    const fetched = { filePath: [{ name: 'name1', version: '1.0.0' }] };
    const exported = {};
    const filePath = 'filePath';
    const res = changeExportPromptData(selected, fetched, filePath, exported);
    expect(res).toEqual({ filePath: [{ name: 'name1', version: '1.0.0' }] });
  });
  test('Should return filtered object with data for filePath', () => {
    const selected = [{ name: 'name1', version: '1.0.0, 2.0.0, 3.0.0' }];
    const fetched = {
      filePath: [
        { name: 'name1', version: '1.0.0' },
        { name: 'name1', version: '2.0.0' },
        { name: 'name1', version: '3.0.0' },
        { name: 'name2', version: '1.0.0' },
      ],
    };
    const exported = {};
    const filePath = 'filePath';
    const res = changeExportPromptData(selected, fetched, filePath, exported);
    expect(res).toEqual({
      filePath: [
        { name: 'name1', version: '1.0.0' },
        { name: 'name1', version: '2.0.0' },
        { name: 'name1', version: '3.0.0' },
      ],
    });
  });
});

describe('generateExportList', () => {
  test('Should convert object of folders into array of paths', () => {
    const res = generateExportList({
      folder1: [{ path: 'path1' }, { path: 'path2' }],
      folder2: [{ path: 'path12' }, { path: 'path24' }],
    });
    expect(res).toEqual(['path1', 'path2', 'path12', 'path24']);
  });
});

describe('getExportGridData', () => {
  const mockFetchedPrompts: DialPrompt[] = [{ id: '1', name: 'Prompt 1', version: undefined, versions: [undefined] }];
  const mockSelectedPrompts: DialPrompt[] = [{ id: '2', name: 'Prompt 2' }];
  const mockFetchedFiles: DialFile[] = [{ id: '1', name: 'File 1', extension: '' }];
  const mockSelectedFiles: DialFile[] = [{ id: '2', name: 'File 2' }];

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
    filePath: [{ id: '1', name: 'Prompt 1', version: '1.0.0' }],
  };
  const mockSelectedPrompts: Record<string, DialPrompt[]> = {
    filePath: [{ id: '2', name: 'Prompt 2', version: '1.0.0' }],
  };
  const mockFetchedFiles: Record<string, DialFile[]> = {
    filePath: [{ id: '1', name: 'File 1.jpg' }],
  };
  const mockSelectedFiles: Record<string, DialFile[]> = {
    filePath: [{ id: '2', name: 'File 2' }],
  };
  const mockSelectedRows: (DialPrompt | DialFile)[] = [
    { id: '1', name: 'Prompt 1', version: '1.0.0' },
    { id: '2', name: 'File 1', version: '1.0.0', extension: '.jpg' },
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
      filePath: [{ id: '1', name: 'Prompt 1', version: '1.0.0' }],
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
      filePath: [{ id: '1', name: 'File 1.jpg' }],
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
