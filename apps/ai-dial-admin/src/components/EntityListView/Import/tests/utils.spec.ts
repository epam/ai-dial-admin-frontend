import { FileImportMap } from '@/src/models/file';
import { ImportStatus } from '@/src/types/import';
import { StepStatus } from '@epam/ai-dial-ui-kit';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import {
  changeFilesMap,
  generateAssetRowDataForImportGrid,
  getImportResults,
  getModalTitle,
  getMultipleImportStatus,
  isErrorFileNode,
  isErrorPromptNode,
  isInvalidJson,
} from '../utils';
import { ApplicationRoute } from '@/src/types/routes';
import { PromptsI18nKey, FoldersI18nKey, ApplicationsI18nKey, ToolsetI18nKey } from '@/src/constants/i18n';

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

    expect(result).toBeUndefined();
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
    const map = new Map();
    map.set('item1', {
      files: [
        {
          id: 'id_for_prompt__1.0.0',
        },
      ],
      isInvalid: false,
    });

    const result = generateAssetRowDataForImportGrid(map as Map<string, FileImportMap>);

    expect(result).toEqual([
      {
        index: 0,
        name: 'item1',
        version: '1.0.0',
        assetName: 'id_for_prompt',
        extension: '',
      },
    ]);
  });

  test('convert to row data with existing prompts', () => {
    const map = new Map();
    map.set('item1', {
      files: [
        {
          id: 'id_for_prompt__1.0.0',
        },
      ],
      isInvalid: false,
    });

    const result = generateAssetRowDataForImportGrid(map as Map<string, FileImportMap>, [{ path: 'somePath/folder' }]);

    expect(result).toEqual([
      {
        index: 0,
        name: 'item1',
        version: '1.0.0',
        assetName: 'id_for_prompt',
        existingNames: ['folder'],
        extension: '',
      },
    ]);
  });
  test('convert to row data invalid prompt', () => {
    const map = new Map();
    map.set('item1.svg', {
      files: [
        {
          id: 'id_for_prompt__1.0.0',
        },
      ],
      isInvalid: true,
    });

    const result = generateAssetRowDataForImportGrid(map as Map<string, FileImportMap>, [{ path: 'somePath/folder' }]);

    expect(result).toEqual([
      {
        index: 0,
        name: 'item1.svg',
        version: '',
        assetName: '',
        extension: '.svg',
        invalid: true,
      },
    ]);
  });
});

describe('Import :: isErrorPromptNode', () => {
  test('should return true', () => {
    const data = {
      version: '1.0.0',
      assetName: 'name',
      existingNames: ['name__1.0.0'],
    };
    const result = isErrorPromptNode(data);

    expect(result).toBeTruthy();
  });

  test('should return false', () => {
    const data = {
      version: '2.0.0',
      assetName: 'name',
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
  test('returns true if prompts is missing or empty', () => {
    expect(isInvalidJson({})).toBe(true);
    expect(isInvalidJson({ prompts: [] })).toBe(true);
  });

  test('returns true if applications is missing or empty for non-prompts view', () => {
    expect(isInvalidJson({}, ApplicationRoute.Files)).toBe(true);
    expect(isInvalidJson({ applications: [] }, ApplicationRoute.Files)).toBe(true);
  });

  test('returns true if first prompt id does not match regex', () => {
    const parsedData = { prompts: [{ id: 'invalid_id' }] };
    expect(isInvalidJson(parsedData, ApplicationRoute.Prompts)).toBe(true);
  });

  test('returns false if first prompt id matches regex', () => {
    const parsedData = { prompts: [{ id: 'prompts/public/folder/subfolder/myPrompt__v1' }] };
    expect(isInvalidJson(parsedData, ApplicationRoute.Prompts)).toBe(false);
  });

  test('returns false for valid applications in non-prompts view', () => {
    const parsedData = { applications: [{ id: 'anything' }] };
    expect(isInvalidJson(parsedData, ApplicationRoute.Files)).toBe(true);
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
    const result = changeFilesMap(prevMap, { name: 'key1', index: 0 }, 'version', 'v2', ApplicationRoute.Prompts);

    expect(result.get('key1').files[0].id).toBe('123__v2');
  });

  test('should update assetName and file name when field is "assetName"', () => {
    const result = changeFilesMap(
      prevMap,
      { name: 'key1', index: 1 },
      'assetName',
      'newassetName',
      ApplicationRoute.Prompts,
    );

    expect(result.get('key1').files[1].id).toBe('newassetName');
    expect(result.get('key1').files[1].name).toBe('newassetName');
  });

  test('should update file content when field is "fileName"', () => {
    const result = changeFilesMap(
      prevMap,
      { name: 'key1', index: 1 },
      'fileName',
      'newFileName',
      ApplicationRoute.Prompts,
    );

    expect(result.get('key1').files[1].name).toBe('newFileName');
    expect(result.get('key1').files[1] instanceof File).toBe(true);
  });

  test('should return a new map with updated file details', () => {
    const newMap = changeFilesMap(prevMap, { name: 'key1', index: 0 }, 'version', 'v2', ApplicationRoute.Prompts);

    expect(newMap).not.toBe(prevMap);
    expect(newMap.get('key1').files[0].id).toBe('123__v2');
  });
});

describe('getModalTitle', () => {
  const t = (key: string) => key;

  test('returns Prompts import title', () => {
    expect(getModalTitle(ApplicationRoute.Prompts, t)).toBe(PromptsI18nKey.Import);
  });

  test('returns Files import title', () => {
    expect(getModalTitle(ApplicationRoute.Files, t)).toBe(FoldersI18nKey.Import);
  });

  test('returns Applications import title', () => {
    expect(getModalTitle(ApplicationRoute.AssetsApplications, t)).toBe(ApplicationsI18nKey.Import);
  });

  test('returns Toolsets import title', () => {
    expect(getModalTitle(ApplicationRoute.AssetsToolsets, t)).toBe(ToolsetI18nKey.Import);
  });

  test('returns empty string for unknown route', () => {
    expect(getModalTitle(undefined, t)).toBe('');
  });
});
