import { DialPrompt } from '@/src/models/dial/prompt';
import { describe, expect, test } from 'vitest';
import { ApplicationRoute } from '@/src/types/routes';
import { FileManagerI18nKey } from '@/src/constants/i18n';
import { ImportFileType } from '@/src/types/import';
import {
  addNewVersion,
  filterLatestVersions,
  getDeleteNotificationContent,
  getEntityForUpdate,
  getIsNeedToMove,
  getImportNotificationContent,
  getMoveNotificationContent,
  getExportNotificationContent,
  getParentPathByFullPath,
  getVersionsPerName,
} from '../utils';

describe('filterLatestVersions', () => {
  test('Should return only latest versions', () => {
    const res = filterLatestVersions([
      { name: 'prompts', version: '7' },
      { name: 'prompts', version: '4' },
      { name: 'model', version: '1' },
      { name: 'prompts', version: '1' },
    ] as DialPrompt[]);
    expect(res).toEqual([
      { name: 'prompts', version: '7' },
      { name: 'model', version: '1' },
    ]);
  });
});

describe('getVersionsPerName', () => {
  test('Should return correct map', () => {
    const res = getVersionsPerName([
      { name: 'prompts', version: '1' },
      { name: 'prompts', version: '2' },
    ] as DialPrompt[]);
    expect(res).toEqual({
      prompts: ['1', '2'],
    });
  });
  test('Should return correct map', () => {
    const res = getVersionsPerName([
      { name: 'prompts', version: '7' },
      { name: 'prompts', version: '4' },
      { name: 'model', version: '1' },
      { name: 'prompts', version: '1' },
    ] as DialPrompt[]);
    expect(res).toEqual({
      prompts: ['1', '4', '7'],
      model: ['1'],
    });
  });
});

describe('getIsNeedToMove', () => {
  test('getIsNeedToMove returns true if folderId changed', () => {
    const entity = { folderId: '2' } as any;
    const initialEntity = { folderId: '1' } as any;
    expect(getIsNeedToMove(entity, initialEntity)).toBe(true);
  });

  test('getIsNeedToMove returns false if folderId is the same', () => {
    const entity = { folderId: '1' } as any;
    const initialEntity = { folderId: '1' } as any;
    expect(getIsNeedToMove(entity, initialEntity)).toBe(false);
  });

  test('getIsNeedToMove returns true if initialEntity is undefined', () => {
    const entity = { folderId: '1' } as any;
    expect(getIsNeedToMove(entity, undefined)).toBe(true);
  });
});

describe('getEntityForUpdate', () => {
  test('getEntityForUpdate returns entity with folderId from initialEntity', () => {
    const entity = { folderId: '2', name: 'Prompt' } as any;
    const initialEntity = { folderId: '1' } as any;
    const result = getEntityForUpdate(entity, initialEntity);
    expect(result.folderId).toBe('1');
    expect(result.name).toBe('Prompt');
  });

  test('getEntityForUpdate returns entity with folderId undefined if initialEntity is undefined', () => {
    const entity = { folderId: '2', name: 'Prompt' } as any;
    const result = getEntityForUpdate(entity, undefined);
    expect(result.folderId).toBeUndefined();
    expect(result.name).toBe('Prompt');
  });
});

describe('addNewVersion', () => {
  test('should correctly change version and path if version is numeric', () => {
    const entity = { folderId: '2', name: 'Prompt', path: 'somePath__0.0.1' } as any;
    const result = addNewVersion(entity, '1.2.3');
    expect(result).toEqual({
      folderId: '2',
      name: 'Prompt',
      path: 'somePath__1.2.3',
      version: '1.2.3',
    });
  });

  test('should correctly change version and path if version is not numeric', () => {
    const entity = { folderId: '2', name: 'Prompt', path: 'somePath__oldVersion' } as any;
    const result = addNewVersion(entity, 'newVersion');
    expect(result).toEqual({
      folderId: '2',
      name: 'Prompt',
      path: 'somePath__newVersion',
      version: 'newVersion',
    });
  });
});

describe('getParentPathByFullPath', () => {
  test('should return empty string if there is no parent path', () => {
    const fullPath = '/';
    const result = getParentPathByFullPath(fullPath);

    expect(result).toBe('/');
  });

  test('should return parent path for file', () => {
    const fullPath = '/parent/child.txt';
    const result = getParentPathByFullPath(fullPath);

    expect(result).toBe('/parent/');
  });

  test('should return parent path for folder', () => {
    const fullPath = '/parent/child/';
    const result = getParentPathByFullPath(fullPath);

    expect(result).toBe('/parent/');
  });
});

describe('getDeleteNotificationContent', () => {
  const mockT = (key: string, options?: Record<string, string | number>) => {
    if (key === FileManagerI18nKey.DeleteSuccessTitle) {
      return `Delete ${options?.item || 'item'} Success`;
    }
    if (key === FileManagerI18nKey.DeleteSuccessDescriptionForMany) {
      return `Successfully deleted ${options?.count} items`;
    }
    if (key === FileManagerI18nKey.DeleteSuccessDescriptionForOne) {
      return `Successfully deleted ${options?.item} ${options?.name}`;
    }
    if (key === FileManagerI18nKey.Files) return 'Files';
    if (key === FileManagerI18nKey.File) return 'File';
    if (key === FileManagerI18nKey.Prompts) return 'Prompts';
    if (key === FileManagerI18nKey.Prompt) return 'Prompt';
    return key;
  };

  test('should return correct notification for single file delete in Files view', () => {
    const fileNodes = [{ sourceUrl: 'file.txt' }] as any[];
    const result = getDeleteNotificationContent(ApplicationRoute.Files, fileNodes, mockT);

    expect(result.title).toBe('Delete File Success');
    expect(result.description).toContain('file.txt');
  });

  test('should return correct notification for multiple files delete in Files view', () => {
    const fileNodes = [{ sourceUrl: 'file1.txt' }, { sourceUrl: 'file2.txt' }, { sourceUrl: 'file3.txt' }] as any[];
    const result = getDeleteNotificationContent(ApplicationRoute.Files, fileNodes, mockT);

    expect(result.title).toBe('Delete Files Success');
    expect(result.description).toContain('3');
  });

  test('should return correct notification for single prompt delete in Prompts view', () => {
    const fileNodes = [{ name: 'My Prompt' }] as any[];
    const result = getDeleteNotificationContent(ApplicationRoute.Prompts, fileNodes, mockT);

    expect(result.title).toBe('Delete Prompt Success');
    expect(result.description).toContain('My Prompt');
  });

  test('should return correct notification for multiple prompts delete in Prompts view', () => {
    const fileNodes = [{ name: 'Prompt1' }, { name: 'Prompt2' }] as any[];
    const result = getDeleteNotificationContent(ApplicationRoute.Prompts, fileNodes, mockT);

    expect(result.title).toBe('Delete Prompts Success');
    expect(result.description).toContain('2');
  });
});

describe('getMoveNotificationContent', () => {
  const mockT = (key: string, options?: Record<string, string | number>) => {
    if (key === FileManagerI18nKey.MoveSuccessTitle) {
      return `Move ${options?.item || 'item'} Success`;
    }
    if (key === FileManagerI18nKey.MoveSuccessDescriptionForMany) {
      return `Successfully moved ${options?.count} items to ${options?.path}`;
    }
    if (key === FileManagerI18nKey.MoveSuccessDescriptionForOne) {
      return `Successfully moved ${options?.item} ${options?.name} to ${options?.path}`;
    }
    if (key === FileManagerI18nKey.Files) return 'Files';
    if (key === FileManagerI18nKey.File) return 'File';
    if (key === FileManagerI18nKey.Prompts) return 'Prompts';
    if (key === FileManagerI18nKey.Prompt) return 'Prompt';
    return key;
  };

  test('should return correct notification for single file move in Files view', () => {
    const items = [{ sourceUrl: 'file.txt' }] as any[];
    const result = getMoveNotificationContent(ApplicationRoute.Files, items, '/destination/', mockT);

    expect(result.title).toBe('Move File Success');
    expect(result.description).toContain('file.txt');
    expect(result.description).toContain('/destination/');
  });

  test('should return correct notification for multiple files move in Files view', () => {
    const items = [{ sourceUrl: 'file1.txt' }, { sourceUrl: 'file2.txt' }, { sourceUrl: 'file3.txt' }] as any[];
    const result = getMoveNotificationContent(ApplicationRoute.Files, items, '/destination/folder/', mockT);

    expect(result.title).toBe('Move Files Success');
    expect(result.description).toContain('3');
    expect(result.description).toContain('/destination/folder/');
  });

  test('should return correct notification for single prompt move in Prompts view', () => {
    const items = [{ sourceUrl: 'My Prompt' }] as any[];
    const result = getMoveNotificationContent(ApplicationRoute.Prompts, items, '/prompts/', mockT);

    expect(result.title).toBe('Move Prompt Success');
    expect(result.description).toContain('My Prompt');
    expect(result.description).toContain('/prompts/');
  });

  test('should return correct notification for multiple prompts move in Prompts view', () => {
    const items = [{ sourceUrl: 'Prompt1' }, { sourceUrl: 'Prompt2' }] as any[];
    const result = getMoveNotificationContent(ApplicationRoute.Prompts, items, '/prompts/folder/', mockT);

    expect(result.title).toBe('Move Prompts Success');
    expect(result.description).toContain('2');
    expect(result.description).toContain('/prompts/folder/');
  });
});

describe('getExportNotificationContent', () => {
  const mockT = (key: string, options?: Record<string, string | number>) => {
    if (key === FileManagerI18nKey.ExportSuccessTitle) {
      return `Export ${options?.item || 'item'} Success`;
    }
    if (key === FileManagerI18nKey.ExportSuccessDescriptionForMany) {
      return `Successfully exported many ${options?.item || 'items'}`;
    }
    if (key === FileManagerI18nKey.ExportSuccessDescriptionForOne) {
      return `Successfully exported one ${options?.item || 'item'}`;
    }
    if (key === FileManagerI18nKey.Files) return 'Files';
    if (key === FileManagerI18nKey.File) return 'File';
    if (key === FileManagerI18nKey.Prompts) return 'Prompts';
    if (key === FileManagerI18nKey.Prompt) return 'Prompt';
    return key;
  };

  test('should return correct notification for single file export in Files view', () => {
    const files = [{ nodeType: 'FILE' }] as any[];
    const result = getExportNotificationContent(ApplicationRoute.Files, files, mockT, ['/folder/file.txt']);

    expect(result.title).toBe('Export File Success');
    expect(result.description).toBe('Successfully exported one File');
  });

  test('should return correct notification for multiple files export in Files view', () => {
    const files = [{ nodeType: 'FILE' }, { nodeType: 'FILE' }, { nodeType: 'FILE' }] as any[];
    const result = getExportNotificationContent(ApplicationRoute.Files, files, mockT, ['/file1.txt', '/file2.txt']);

    expect(result.title).toBe('Export Files Success');
    expect(result.description).toBe('Successfully exported many items');
  });

  test('should return correct notification for single prompt export in Prompts view', () => {
    const files = [{ nodeType: 'FILE' }] as any[];
    const result = getExportNotificationContent(ApplicationRoute.Prompts, files, mockT, ['/prompt1']);

    expect(result.title).toBe('Export Prompt Success');
    expect(result.description).toBe('Successfully exported one Prompt');
  });

  test('should return correct notification for multiple prompts export in Prompts view', () => {
    const files = [{ nodeType: 'FILE' }, { nodeType: 'FILE' }] as any[];
    const result = getExportNotificationContent(ApplicationRoute.Prompts, files, mockT, ['/prompt1', '/prompt2']);

    expect(result.title).toBe('Export Prompts Success');
    expect(result.description).toBe('Successfully exported many items');
  });
});

describe('getImportNotificationContent', () => {
  const mockT = (key: string, options?: Record<string, string | number>) => {
    if (key === FileManagerI18nKey.ImportSuccessTitle) {
      return `Import ${options?.item || 'item'} Success`;
    }
    if (key === FileManagerI18nKey.ImportSuccessDescriptionForArchive) {
      return `Successfully imported archive ${options?.item || 'items'} to ${options?.path}`;
    }
    if (key === FileManagerI18nKey.ImportSuccessDescriptionForMany) {
      return `Successfully imported ${options?.count} ${options?.item || 'items'} to ${options?.path}`;
    }
    if (key === FileManagerI18nKey.ImportSuccessDescriptionForOne) {
      return `Successfully imported one ${options?.item || 'item'} to ${options?.path}`;
    }
    if (key === FileManagerI18nKey.Files) return 'Files';
    if (key === FileManagerI18nKey.File) return 'File';
    if (key === FileManagerI18nKey.Prompts) return 'Prompts';
    if (key === FileManagerI18nKey.Prompt) return 'Prompt';
    return key;
  };

  test('should return correct notification for single file import in Files view', () => {
    const file = [{ name: 'file1.txt' }] as any;
    const result = getImportNotificationContent(ApplicationRoute.Files, file, ImportFileType.FILES, '/dest', mockT);

    expect(result.title).toBe('Import File Success');
    expect(result.description).toBe('Successfully imported one File to /dest');
  });

  test('should return correct notification for multiple files import in Files view', () => {
    const file = [{ name: 'file1.txt' }, { name: 'file2.txt' }] as any;
    const result = getImportNotificationContent(ApplicationRoute.Files, file, ImportFileType.FILES, '/dest', mockT);

    expect(result.title).toBe('Import Files Success');
    expect(result.description).toBe('Successfully imported 2 items to /dest');
  });

  test('should return correct notification for archive import in Files view', () => {
    const file = { archive: true } as any;
    const result = getImportNotificationContent(ApplicationRoute.Files, file, ImportFileType.ARCHIVE, '/dest', mockT);

    expect(result.title).toBe('Import File Success');
    expect(result.description).toBe('Successfully imported archive Files to /dest');
  });

  test('should return correct notification for single prompt import in Prompts view', () => {
    const file = { prompts: [{ name: 'Prompt1' }] } as any;
    const result = getImportNotificationContent(ApplicationRoute.Prompts, file, ImportFileType.FILES, '/dest', mockT);

    expect(result.title).toBe('Import Prompt Success');
    expect(result.description).toBe('Successfully imported one Prompt to /dest');
  });

  test('should return correct notification for multiple prompts import in Prompts view', () => {
    const file = { prompts: [{ name: 'Prompt1' }, { name: 'Prompt2' }] } as any;
    const result = getImportNotificationContent(ApplicationRoute.Prompts, file, ImportFileType.FILES, '/dest', mockT);

    expect(result.title).toBe('Import Prompts Success');
    expect(result.description).toBe('Successfully imported 2 items to /dest');
  });

  test('should return correct notification for archive import in Prompts view', () => {
    const file = { prompts: [{ name: 'Prompt1' }] } as any;
    const result = getImportNotificationContent(ApplicationRoute.Prompts, file, ImportFileType.ARCHIVE, '/dest', mockT);

    expect(result.title).toBe('Import Prompt Success');
    expect(result.description).toBe('Successfully imported archive Prompts to /dest');
  });
});
