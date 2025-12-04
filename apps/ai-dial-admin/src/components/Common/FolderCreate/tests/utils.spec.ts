import {
  generateFileColumnsForImportGrid,
  generateAssetColumnsForImportGrid,
  isLargeFile,
} from '@/src/components/EntityListView/Import/utils';
import { FileImportGridData } from '@/src/models/file';
import { PromptImportGridData } from '@/src/models/prompts';
import { ImportFileType } from '@/src/types/import';
import { ApplicationRoute } from '@/src/types/routes';
import { describe, expect, test, vi } from 'vitest';
import { ZipFilePreview } from '../models';
import {
  generateColumnsForImportGrid,
  generatePreviewData,
  isErrorFileReview,
  isErrorAssetReview,
  isErrorRowForImport,
  readAllFiles,
} from '../utils';
import { getFolderNameAndPath } from '@/src/utils/files/path';

vi.mock('@/src/components/EntityListView/Import/utils', () => ({
  generateAssetColumnsForImportGrid: vi.fn(),
  generateFileColumnsForImportGrid: vi.fn(),
  isLargeFile: vi.fn(),
}));

vi.mock('@/src/utils/files/path', () => ({
  getFolderNameAndPath: vi.fn(),
}));

const validPromptData = { version: '1.0', assetName: 'Test Prompt', invalid: false } as PromptImportGridData;
const invalidPromptData = { version: '', assetName: '', invalid: true } as PromptImportGridData;

const validFileData = { name: 'testFile.txt', invalid: false } as FileImportGridData;
const invalidFileData = { name: '', invalid: true } as FileImportGridData;

describe('isErrorPromptReview', () => {
  test('should return true if version or assetName is missing or if invalid is true', () => {
    expect(isErrorAssetReview(invalidPromptData)).toBe(true);
    expect(isErrorAssetReview({ ...validPromptData, version: '' })).toBe(true);
    expect(isErrorAssetReview({ ...validPromptData, assetName: '' })).toBe(true);
    expect(isErrorAssetReview({ ...validPromptData, invalid: true })).toBe(true);
  });

  test('should return false if version and assetName are present and invalid is false', () => {
    expect(isErrorAssetReview(validPromptData)).toBe(false);
  });
});

describe('isErrorFileReview', () => {
  test('should return true if name is missing or if invalid is true', () => {
    expect(isErrorFileReview(invalidFileData)).toBe(true);
    expect(isErrorFileReview({ ...validFileData, name: '' })).toBe(true);
    expect(isErrorFileReview({ ...validFileData, invalid: true })).toBe(true);
  });

  test('should return false if name is present and invalid is false', () => {
    expect(isErrorFileReview(validFileData)).toBe(false);
  });
});

describe('readAllFiles', () => {
  test('should correctly process each file and create a Map with correct values', () => {
    const mockFile1 = { name: 'file1.txt', size: 1000 } as File;
    const mockFile2 = { name: 'file2.txt', size: 5000 } as File;

    isLargeFile.mockImplementation((file) => file.size > 2000);

    const files = [mockFile1, mockFile2];

    const result = readAllFiles(files);

    expect(result.size).toBe(2);

    const file1Group = result.get('file1.txt');
    expect(file1Group).toBeDefined();
    expect(file1Group?.files).toEqual([mockFile1]);
    expect(file1Group?.isInvalid).toBe(false);

    const file2Group = result.get('file2.txt');
    expect(file2Group).toBeDefined();
    expect(file2Group?.files).toEqual([mockFile2]);
    expect(file2Group?.isInvalid).toBe(true);
  });

  test('should handle an empty files array', () => {
    const files: File[] = [];

    const result = readAllFiles(files);

    expect(result.size).toBe(0);
  });

  test('should overwrite previous files with the same name', () => {
    const mockFile1 = { name: 'file1.txt', size: 1000 } as File;
    const mockFile2 = { name: 'file1.txt', size: 5000 } as File;

    isLargeFile.mockImplementation((file) => file.size > 2000);

    const files = [mockFile1, mockFile2];

    const result = readAllFiles(files);

    expect(result.size).toBe(1);

    const fileGroup = result.get('file1.txt');
    expect(fileGroup).toBeDefined();
    expect(fileGroup?.files).toEqual([mockFile2]);
    expect(fileGroup?.isInvalid).toBe(true);
  });

  test('should correctly handle files with different names', () => {
    const mockFile1 = { name: 'file1.txt', size: 1000 } as File;
    const mockFile2 = { name: 'file2.txt', size: 3000 } as File;

    isLargeFile.mockImplementation((file) => file.size > 2000);

    const files = [mockFile1, mockFile2];

    const result = readAllFiles(files);

    const file1Group = result.get('file1.txt');
    expect(file1Group).toBeDefined();
    expect(file1Group?.files).toEqual([mockFile1]);
    expect(file1Group?.isInvalid).toBe(false);

    const file2Group = result.get('file2.txt');
    expect(file2Group).toBeDefined();
    expect(file2Group?.files).toEqual([mockFile2]);
    expect(file2Group?.isInvalid).toBe(true);
  });
});

describe('generatePreviewData', () => {
  test('should group files by fileName and assign correct ids', () => {
    const preview: ZipFilePreview[] = [
      { fileName: 'path/to/file1.zip', name: 'file1', version: '1.0' },
      { fileName: 'path/to/file2.zip', name: 'file2', version: '1.0' },
      { fileName: 'path/to/file1.zip', name: 'file1', version: '2.0' },
    ];

    getFolderNameAndPath.mockReturnValue({ name: 'file1' });

    const result = generatePreviewData(preview);

    expect(result.size).toBe(1);

    const file1Group = result.get('file1');
    expect(file1Group).toBeDefined();
    expect(file1Group?.files).toEqual([{ id: 'file1__1.0' }, { id: 'file2__1.0' }, { id: 'file1__2.0' }]);
    expect(file1Group?.isInvalid).toBe(false);
  });

  test('should handle empty preview array', () => {
    const preview: ZipFilePreview[] = [];

    const result = generatePreviewData(preview);

    expect(result.size).toBe(0);
  });

  test('should group files with the same fileName correctly', () => {
    const preview: ZipFilePreview[] = [
      { fileName: 'path/to/file1.zip', name: 'file1', version: '1.0' },
      { fileName: 'path/to/file1.zip', name: 'file1', version: '1.1' },
      { fileName: 'path/to/file1.zip', name: 'file1', version: '1.2' },
    ];

    getFolderNameAndPath.mockReturnValue({ name: 'file1' });

    const result = generatePreviewData(preview);

    const file1Group = result.get('file1');
    expect(file1Group).toBeDefined();
    expect(file1Group?.files.length).toBe(3);
    expect(file1Group?.files).toEqual([{ id: 'file1__1.0' }, { id: 'file1__1.1' }, { id: 'file1__1.2' }]);
    expect(file1Group?.isInvalid).toBe(false);
  });

  test('should handle file names with special characters', () => {
    const preview: ZipFilePreview[] = [
      { fileName: 'path/to/file-@1.zip', name: 'file-@1', version: '1.0' },
      { fileName: 'path/to/file-@1.zip', name: 'file-@1', version: '2.0' },
    ];

    getFolderNameAndPath.mockReturnValue({ name: 'file-@1' });

    const result = generatePreviewData(preview);

    const fileGroup = result.get('file-@1');
    expect(fileGroup).toBeDefined();
    expect(fileGroup?.files).toEqual([{ id: 'file-@1__1.0' }, { id: 'file-@1__2.0' }]);
    expect(fileGroup?.isInvalid).toBe(false);
  });

  test('should return correct data when fileName is the same but name and version vary', () => {
    const preview: ZipFilePreview[] = [
      { fileName: 'path/to/file1.zip', name: 'fileA', version: '1.0' },
      { fileName: 'path/to/file1.zip', name: 'fileB', version: '1.0' },
    ];

    getFolderNameAndPath.mockReturnValue({ name: 'file1' });

    const result = generatePreviewData(preview);

    const file1Group = result.get('file1');
    expect(file1Group).toBeDefined();
    expect(file1Group?.files).toEqual([{ id: 'fileA__1.0' }, { id: 'fileB__1.0' }]);
    expect(file1Group?.isInvalid).toBe(false);
  });
});

describe('generateColumnsForImportGrid', () => {
  const mockChangeFileFunc = vi.fn();

  test('should call generatePromptColumnsForImportGrid when route is Prompts', () => {
    const route = ApplicationRoute.Prompts;
    const fileType = ImportFileType.ARCHIVE;

    generateAssetColumnsForImportGrid.mockReturnValue(['prompt_column_1', 'prompt_column_2']);

    const result = generateColumnsForImportGrid(mockChangeFileFunc, fileType, route);

    expect(result).toEqual(['prompt_column_1', 'prompt_column_2']);
    expect(generateAssetColumnsForImportGrid).toHaveBeenCalledWith(mockChangeFileFunc, true, true);
  });

  test('should call generateFileColumnsForImportGrid when route is Files', () => {
    const route = ApplicationRoute.Files;
    const fileType = ImportFileType.ARCHIVE;

    generateFileColumnsForImportGrid.mockReturnValue(['file_column_1', 'file_column_2']);

    const result = generateColumnsForImportGrid(mockChangeFileFunc, fileType, route);

    expect(result).toEqual(['file_column_1', 'file_column_2']);
    expect(generateFileColumnsForImportGrid).toHaveBeenCalledWith(mockChangeFileFunc, true, true);
  });

  test('should return an empty array if route is not Prompts or Files', () => {
    const route = ApplicationRoute.SomeOtherRoute;
    const fileType = ImportFileType.ARCHIVE;

    const result = generateColumnsForImportGrid(mockChangeFileFunc, fileType, route);

    expect(result).toEqual([]);
  });

  test('should correctly handle different fileType values (ARCHIVE)', () => {
    const route = ApplicationRoute.Prompts;
    const fileType = ImportFileType.ARCHIVE;

    generateAssetColumnsForImportGrid.mockReturnValue(['prompt_column_1', 'prompt_column_2']);

    const result = generateColumnsForImportGrid(mockChangeFileFunc, fileType, route);

    expect(result).toEqual(['prompt_column_1', 'prompt_column_2']);
    expect(generateAssetColumnsForImportGrid).toHaveBeenCalledWith(mockChangeFileFunc, true, true);
  });

  test('should correctly handle different fileType values (OTHER)', () => {
    const route = ApplicationRoute.Files;
    const fileType = ImportFileType.OTHER;

    generateFileColumnsForImportGrid.mockReturnValue(['file_column_1', 'file_column_2']);

    const result = generateColumnsForImportGrid(mockChangeFileFunc, fileType, route);

    expect(result).toEqual(['file_column_1', 'file_column_2']);
    expect(generateFileColumnsForImportGrid).toHaveBeenCalledWith(mockChangeFileFunc, true, false);
  });
});

describe('isErrorRowForImport', () => {
  test('should call isErrorPromptReview when route is Prompts', () => {
    const route = ApplicationRoute.Prompts;

    const result = isErrorRowForImport(validPromptData, route);

    expect(result).toBe(false);
  });

  test('should call isErrorFileReview when route is Files', () => {
    const route = ApplicationRoute.Files;

    const result = isErrorRowForImport(validFileData, route);

    expect(result).toBe(false);
  });

  test('should return false if route is neither Prompts nor Files', () => {
    const route = ApplicationRoute.SomeOtherRoute;

    const result = isErrorRowForImport(validPromptData, route);

    expect(result).toBe(false);
  });
});
