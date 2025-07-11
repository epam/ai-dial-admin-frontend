import {
  generateNameVersionForPrompt,
  getFolderNameAndPath,
  getNameVersionFromPrompt,
  modifyNameVersionInPrompt,
} from '@/src/utils/prompts/versions';
import { getNameExtensionFromFile } from '@/src/utils/files/get-extension';
import { FileImportMap } from '@/src/models/file';
import { ImportStatus } from '@/src/types/import';
import { StepStatus } from '@/src/models/step';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import {
  changeFilesMap,
  generatePromptRowDataForImportGrid,
  getImportResults,
  getMultipleImportStatus,
  isErrorFileNode,
  isErrorPromptNode,
  isInvalidJson,
} from './import';

describe('Import :: getImportResults', () => {
  const folderName = 'testFolder';
  const mockT = vi.fn().mockReturnValue('Translated Text');

  test('should call showNotification 1 time for success', () => {
    const results = [{ status: ImportStatus.SUCCESS }];
    const mockShowNotification = vi.fn();

    getImportResults(results, folderName, '', mockT, mockShowNotification);

    expect(mockShowNotification).toHaveBeenCalledTimes(1);
  });

  test('should call showNotification 2 times for success and error', () => {
    const results = [{ status: ImportStatus.SUCCESS }, { status: ImportStatus.ERROR, targetPath: 'path' }];
    const mockShowNotification = vi.fn();

    getImportResults(results, folderName, '', mockT, mockShowNotification);

    expect(mockShowNotification).toHaveBeenCalledTimes(2);
  });

  test('should call showNotification 3 times for success and error and skip', () => {
    const results = [
      { status: ImportStatus.SUCCESS },
      { status: ImportStatus.ERROR, targetPath: 'path' },
      { status: ImportStatus.SKIP, targetPath: 'path' },
    ];
    const mockShowNotification = vi.fn();

    getImportResults(results, folderName, '', mockT, mockShowNotification);

    expect(mockShowNotification).toHaveBeenCalledTimes(3);
  });

  test('should call showNotification 3 times for success and error and skip even if more than 1 item of each', () => {
    const results = [
      { status: ImportStatus.SUCCESS },
      { status: ImportStatus.SUCCESS },
      { status: ImportStatus.ERROR, targetPath: 'path' },
      { status: ImportStatus.ERROR, targetPath: 'path2' },
      { status: ImportStatus.SKIP, targetPath: 'path' },
      { status: ImportStatus.SKIP, targetPath: 'path2' },
    ];
    const mockShowNotification = vi.fn();

    getImportResults(results, folderName, '', mockT, mockShowNotification);

    expect(mockShowNotification).toHaveBeenCalledTimes(3);
  });
});

describe('Import :: getMultipleImportStatus', () => {
  test('should return invalid status if no prompts in map', () => {
    const map = new Map();
    const result = getMultipleImportStatus(map as Map<string, FileImportMap>);

    expect(result).toEqual(StepStatus.INVALID);
  });

  test('should return error status if some prompts in map are invalid', () => {
    const map = new Map();
    map.set('item1', {
      prompt: {},
      isInvalid: true,
    });
    const result = getMultipleImportStatus(map as Map<string, FileImportMap>);

    expect(result).toEqual(StepStatus.ERROR);
  });

  test('should return valid status if all prompts in map are valid', () => {
    const map = new Map();
    map.set('item1', {
      prompt: {},
      isInvalid: false,
    });
    const result = getMultipleImportStatus(map as Map<string, FileImportMap>);

    expect(result).toEqual(StepStatus.VALID);
  });
});

describe('Import :: generatePromptRowDataForImportGrid', () => {
  test('convert to row data without existing prompts', () => {
    getFolderNameAndPath.mockReturnValue({ name: 'id_for_prompt__1.0.0' });
    getNameVersionFromPrompt.mockReturnValue({ name: 'id_for_prompt', version: '1.0.0' });

    const map = new Map();
    map.set('item1', {
      files: [
        {
          id: 'id_for_prompt__1.0.0',
        },
      ],
      isInvalid: false,
    });

    const result = generatePromptRowDataForImportGrid(map as Map<string, FileImportMap>);

    expect(result).toEqual([
      {
        index: 0,
        name: 'item1',
        version: '1.0.0',
        promptName: 'id_for_prompt',
        extension: '',
      },
    ]);
  });

  test('convert to row data with existing prompts', () => {
    getFolderNameAndPath.mockReturnValue({ name: 'id_for_prompt__1.0.0' });
    getNameVersionFromPrompt.mockReturnValue({ name: 'id_for_prompt', version: '1.0.0' });

    const map = new Map();
    map.set('item1', {
      files: [
        {
          id: 'id_for_prompt__1.0.0',
        },
      ],
      isInvalid: false,
    });

    const result = generatePromptRowDataForImportGrid(map as Map<string, FileImportMap>, [{ path: 'somePath/folder' }]);

    expect(result).toEqual([
      {
        index: 0,
        name: 'item1',
        version: '1.0.0',
        promptName: 'id_for_prompt',
        existingNames: ['folder'],
        extension: '',
      },
    ]);
  });
  test('convert to row data invalid prompt', () => {
    getFolderNameAndPath.mockReturnValue({ name: 'id_for_prompt__1.0.0' });
    getNameVersionFromPrompt.mockReturnValue({ name: 'id_for_prompt', version: '1.0.0' });

    const map = new Map();
    map.set('item1.svg', {
      files: [
        {
          id: 'id_for_prompt__1.0.0',
        },
      ],
      isInvalid: true,
    });

    const result = generatePromptRowDataForImportGrid(map as Map<string, FileImportMap>, [{ path: 'somePath/folder' }]);

    expect(result).toEqual([
      {
        index: 0,
        name: 'item1.svg',
        version: '',
        promptName: '',
        extension: '.svg',
        invalid: true,
      },
    ]);
  });
});

describe('Import :: isErrorPromptNode', () => {
  test('should return true', () => {
    generateNameVersionForPrompt.mockReturnValue('name__1.0.0');

    const data = {
      version: '1.0.0',
      promptName: 'name',
      existingNames: ['name__1.0.0'],
    };
    const result = isErrorPromptNode(data);

    expect(result).toBeTruthy();
  });

  test('should return false', () => {
    generateNameVersionForPrompt.mockReturnValue('name__2.0.0');

    const data = {
      version: '2.0.0',
      promptName: 'name',
      existingNames: ['name__1.0.0'],
    };
    const result = isErrorPromptNode(data);

    expect(result).toBeFalsy();
  });
});

describe('Import :: isErrorFileNode', () => {
  test('should return true', () => {
    const data = {
      fileName: 'file',
      extension: '.jpg',
      existingNames: ['file.jpg'],
    };
    const result = isErrorFileNode(data);

    expect(result).toBeTruthy();
  });

  test('should return false', () => {
    const data = {
      fileName: 'file',
      extension: '.jpg',
      existingNames: ['file.png'],
    };
    const result = isErrorFileNode(data);

    expect(result).toBeFalsy();
  });
});

describe('Import :: isInvalidJson', () => {
  test('should return true if prompts is undefined', () => {
    const parsedData = { prompts: undefined };
    const result = isInvalidJson(parsedData);
    expect(result).toBe(true);
  });

  test('should return true if prompts is null', () => {
    const parsedData = { prompts: null };
    const result = isInvalidJson(parsedData);
    expect(result).toBe(true);
  });

  test('should return true if prompts is an empty array', () => {
    const parsedData = { prompts: [] };
    const result = isInvalidJson(parsedData);
    expect(result).toBe(true);
  });

  test('should return true if the id of the first prompt does not match the regex', () => {
    const parsedData = {
      prompts: [{ id: 'invalid_id' }],
    };
    const result = isInvalidJson(parsedData);
    expect(result).toBe(true);
  });

  test('should return false if the id of the first prompt matches the regex', () => {
    const parsedData = {
      prompts: [{ id: 'prompts/public/folder/subfolder/myPrompt__v1' }],
    };
    const result = isInvalidJson(parsedData);
    expect(result).toBe(false);
  });
});

describe('Import :: changeFilesMap', () => {
  let prevMap;

  beforeEach(() => {
    // Initialize prevMap with files as an array of file objects
    prevMap = new Map([
      [
        'key1',
        {
          files: [
            { id: '123', name: 'oldFileName', type: 'text/plain' }, // File 0
            { id: '456', name: 'anotherFile', type: 'text/plain' }, // File 1
          ],
        },
      ],
    ]);
  });

  test('should update version in file id when field is "version"', () => {
    modifyNameVersionInPrompt.mockReturnValue('newId');

    // Data object includes the index and name for the file to be updated
    const result = changeFilesMap(prevMap, { name: 'key1', index: 0 }, 'version', 'v2');

    expect(modifyNameVersionInPrompt).toHaveBeenCalledWith('123', undefined, 'v2');
    expect(result.get('key1').files[0].id).toBe('newId');
  });

  test('should update promptName and file name when field is "promptName"', () => {
    modifyNameVersionInPrompt.mockReturnValue('newId');

    const result = changeFilesMap(prevMap, { name: 'key1', index: 1 }, 'promptName', 'newPromptName');

    expect(modifyNameVersionInPrompt).toHaveBeenCalledWith('456', 'newPromptName');
    expect(result.get('key1').files[1].id).toBe('newId');
    expect(result.get('key1').files[1].name).toBe('newPromptName');
  });

  test('should update file content when field is "fileName"', () => {
    getNameExtensionFromFile.mockReturnValue({ extension: '.txt' });

    const result = changeFilesMap(prevMap, { name: 'key1', index: 1 }, 'fileName', 'newFileName');

    expect(result.get('key1').files[1].name).toBe('newFileName');
    expect(result.get('key1').files[1] instanceof File).toBe(true);
  });

  test('should return a new map with updated file details', () => {
    const newMap = changeFilesMap(prevMap, { name: 'key1', index: 0 }, 'version', 'v2');

    expect(newMap).not.toBe(prevMap);
    expect(newMap.get('key1').files[0].id).toBe('newId');
  });
});
