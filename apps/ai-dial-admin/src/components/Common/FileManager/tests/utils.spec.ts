import { TEMP_FOLDER } from '@/src/constants/file';
import { FileManagerI18nKey } from '@/src/constants/i18n';
import { Asset } from '@/src/models/dial/deployment-asset';
import { DialFile, DialFileNodeType } from '@epam/ai-dial-ui-kit';
import { describe, expect, test, vi } from 'vitest';
import { CREATE_FOLDER_FORBIDDEN_CHARS, FILE_NAME_MAX_LENGTH } from '../constants';
import {
  createEmptyFile,
  findFolderByPath,
  getEmptyFile,
  getUniqueFolderName,
  isItemNameValid,
  validateCreateFolder,
} from '../utils';

describe('FileManager', () => {
  describe('createEmptyFile', () => {
    test('should create an empty file with correct properties', () => {
      const { emptyFile, fileName, fileType } = createEmptyFile();

      expect(fileName).toBe(TEMP_FOLDER);
      expect(fileType).toBe('text/plain');
      expect(emptyFile).toBeInstanceOf(File);
      expect(emptyFile.name).toBe(TEMP_FOLDER);
      expect(emptyFile.type).toBe('text/plain');
      expect(emptyFile.size).toBeGreaterThan(0);
    });
  });

  describe('getEmptyFile', () => {
    test('should return a DialUploadFileItem with correct structure', () => {
      const uploadFileItem = getEmptyFile();

      expect(uploadFileItem).toHaveProperty('fileContent');
      expect(uploadFileItem).toHaveProperty('name');
      expect(uploadFileItem.name).toBe(TEMP_FOLDER);
      expect(uploadFileItem.fileContent).toBeInstanceOf(File);
    });

    test('should return a DialUploadFileItem with file content matching createEmptyFile', () => {
      const uploadFileItem = getEmptyFile();
      const { emptyFile, fileName } = createEmptyFile();

      expect(uploadFileItem.name).toBe(fileName);
      expect(uploadFileItem.fileContent.name).toBe(emptyFile.name);
      expect(uploadFileItem.fileContent.type).toBe(emptyFile.type);
    });
  });

  describe('validateCreateFolder', () => {
    const mockTranslate = vi.fn((key: string) => key);

    test('should return null for valid folder names', () => {
      const validNames = [
        'ValidFolder',
        'valid-folder',
        'valid_folder',
        'valid folder',
        '123',
        'folder123',
        'Folder Name',
      ];

      validNames.forEach((name) => {
        const result = validateCreateFolder(name, mockTranslate);
        expect(result).toBeNull();
      });
    });

    test('should return error message for folder names with ";" character', () => {
      const result = validateCreateFolder('test;folder', mockTranslate);

      expect(result).toBe(FileManagerI18nKey.CreateFolderValidate);
      expect(mockTranslate).toHaveBeenCalledWith(FileManagerI18nKey.CreateFolderValidate);
    });

    test('should return error message for folder names with "," character', () => {
      const result = validateCreateFolder('test,folder', mockTranslate);

      expect(result).toBe(FileManagerI18nKey.CreateFolderValidate);
    });

    test('should return error message for folder names with ":" character', () => {
      const result = validateCreateFolder('test:folder', mockTranslate);

      expect(result).toBe(FileManagerI18nKey.CreateFolderValidate);
    });

    test('should return error message for folder names with "\\"" character', () => {
      const result = validateCreateFolder('test"folder', mockTranslate);

      expect(result).toBe(FileManagerI18nKey.CreateFolderValidate);
    });

    test('should return error message for folder names with "/" character', () => {
      const result = validateCreateFolder('test/folder', mockTranslate);

      expect(result).toBe(FileManagerI18nKey.CreateFolderValidate);
    });

    test('should return error message for folder names with "\\\\" character', () => {
      const result = validateCreateFolder('test\\folder', mockTranslate);

      expect(result).toBe(FileManagerI18nKey.CreateFolderValidate);
    });

    test('should return error message for folder names with "{" character', () => {
      const result = validateCreateFolder('test{folder', mockTranslate);

      expect(result).toBe(FileManagerI18nKey.CreateFolderValidate);
    });

    test('should return error message for folder names with "}" character', () => {
      const result = validateCreateFolder('test}folder', mockTranslate);

      expect(result).toBe(FileManagerI18nKey.CreateFolderValidate);
    });

    test('should return error message for folder names with "%" character', () => {
      const result = validateCreateFolder('test%folder', mockTranslate);

      expect(result).toBe(FileManagerI18nKey.CreateFolderValidate);
    });

    test('should return error message for folder names with "&" character', () => {
      const result = validateCreateFolder('test&folder', mockTranslate);

      expect(result).toBe(FileManagerI18nKey.CreateFolderValidate);
    });

    test('should validate against CREATE_FOLDER_FORBIDDEN_CHARS constant', () => {
      const forbiddenChars = [';', ':', ',', '=', '/', '{', '}', '%', '&', '\\'];

      forbiddenChars.forEach((char) => {
        const testName = `folder${char}name`;
        const matches = CREATE_FOLDER_FORBIDDEN_CHARS.test(testName);
        expect(matches).toBe(true);
      });
    });

    test('should handle empty strings as valid', () => {
      const result = validateCreateFolder('', mockTranslate);
      expect(result).toBeNull();
    });

    test('should handle strings with multiple forbidden characters', () => {
      const result = validateCreateFolder('test<>:|folder', mockTranslate);

      expect(result).toBe(FileManagerI18nKey.CreateFolderValidate);
    });

    test('should return error message for folder names starting with a dot', () => {
      const result = validateCreateFolder('.hiddenfolder', mockTranslate);

      expect(result).toBe(FileManagerI18nKey.CreateFolderValidateFirstSymbol);
    });

    test('should return error message for folder names with length exceeding maximum', () => {
      const longName = 'a'.repeat(FILE_NAME_MAX_LENGTH + 1);
      const result = validateCreateFolder(longName, mockTranslate);

      expect(result).toBe(FileManagerI18nKey.CreateFolderValidateNameLength);
    });
  });

  describe('isItemNameValid', () => {
    test('returns false when name contains a forbidden character', () => {
      expect(isItemNameValid('invalid;name')).toBe(false);
      expect(isItemNameValid('invalid%name')).toBe(false);
      expect(isItemNameValid('invalid\\name')).toBe(false);
      expect(isItemNameValid('invalid/ame')).toBe(false);
    });

    test('returns true when name does not contain forbidden characters', () => {
      expect(isItemNameValid('valid-name')).toBe(true);
      expect(isItemNameValid('valid name')).toBe(true);
      expect(isItemNameValid('valid_name')).toBe(true);
      expect(isItemNameValid('valid123')).toBe(true);
    });
  });
});

const createFolder = (path: string, name: string, items?: DialFile[]): DialFile =>
  ({
    path,
    name,
    folderId: '',
    nodeType: DialFileNodeType.FOLDER,
    ...(items ? { items } : {}),
  }) as DialFile;

const createItem = (path: string, name: string, parentPath: string): DialFile =>
  ({
    path,
    name,
    folderId: '',
    nodeType: DialFileNodeType.ITEM,
    parentPath,
  }) as DialFile;

describe('findFolderByPath', () => {
  const tree: DialFile[] = [
    createFolder('public/a/', 'a', [createFolder('public/a/b/', 'b', [createFolder('public/a/b/c/', 'c')])]),
    createFolder('public/d/', 'd'),
  ];

  test('should find a top-level folder', () => {
    expect(findFolderByPath(tree, 'public/d/')?.name).toBe('d');
  });

  test('should find a nested folder', () => {
    expect(findFolderByPath(tree, 'public/a/b/')?.name).toBe('b');
  });

  test('should find a deeply nested folder', () => {
    expect(findFolderByPath(tree, 'public/a/b/c/')?.name).toBe('c');
  });

  test('should return undefined for non-existent path', () => {
    expect(findFolderByPath(tree, 'public/x/')).toBeUndefined();
  });

  test('should return undefined for empty items', () => {
    expect(findFolderByPath([], 'public/a/')).toBeUndefined();
  });
});

describe('getUniqueFolderName', () => {
  test('should return "New Folder" when no conflicts', () => {
    expect(getUniqueFolderName([])).toBe('New Folder');
    expect(getUniqueFolderName(['other'])).toBe('New Folder');
  });

  test('should return "New Folder 1" when "New Folder" exists', () => {
    expect(getUniqueFolderName(['New Folder'])).toBe('New Folder 1');
  });

  test('should return "New Folder 2" when "New Folder" and "New Folder 1" exist', () => {
    expect(getUniqueFolderName(['New Folder', 'New Folder 1'])).toBe('New Folder 2');
  });

  test('should skip to the next available number', () => {
    expect(getUniqueFolderName(['New Folder', 'New Folder 1', 'New Folder 2', 'New Folder 3'])).toBe('New Folder 4');
  });

  test('should return first available number when there are gaps', () => {
    expect(getUniqueFolderName(['New Folder', 'New Folder 2'])).toBe('New Folder 1');
  });
});
