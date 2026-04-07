import { describe, expect, test, vi } from 'vitest';
import {
  createEmptyFile,
  getEmptyFile,
  validateCreateFolder,
  findFolderByPath,
  getUniqueFolderName,
  getNewFolderPath,
} from '../utils';
import { CREATE_FOLDER_FORBIDDEN_CHARS, FILE_NAME_MAX_LENGTH } from '../constants';
import { FileManagerI18nKey } from '@/src/constants/i18n';
import { DialFile, DialFileNodeType } from '@epam/ai-dial-ui-kit';
import { Asset } from '@/src/models/dial/deployment-asset';

describe('FileManager', () => {
  describe('createEmptyFile', () => {
    test('should create an empty file with correct properties', () => {
      const { emptyFile, fileName, fileType } = createEmptyFile();

      expect(fileName).toBe('.dial_folder');
      expect(fileType).toBe('text/plain');
      expect(emptyFile).toBeInstanceOf(File);
      expect(emptyFile.name).toBe('.dial_folder');
      expect(emptyFile.type).toBe('text/plain');
      expect(emptyFile.size).toBeGreaterThan(0);
    });
  });

  describe('getEmptyFile', () => {
    test('should return a DialUploadFileItem with correct structure', () => {
      const uploadFileItem = getEmptyFile();

      expect(uploadFileItem).toHaveProperty('fileContent');
      expect(uploadFileItem).toHaveProperty('name');
      expect(uploadFileItem.name).toBe('.dial_folder');
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

describe('getNewFolderPath', () => {
  const rootChildren: DialFile[] = [
    createFolder('public/yo/', 'yo', [
      createItem('public/yo/.dial_folder', '.dial_folder', 'public/yo/'),
      createFolder('public/yo/New Folder/', 'New Folder'),
    ]),
    createFolder('public/other/', 'other', [
      createFolder('public/other/sub/', 'sub', [
        createFolder('public/other/sub/New Folder/', 'New Folder'),
        createFolder('public/other/sub/New Folder 1/', 'New Folder 1'),
      ]),
    ]),
    createFolder('public/empty/', 'empty'),
  ];

  const allFiles: Asset[] = [createFolder('public/', 'public', rootChildren)];

  describe('child mode', () => {
    test('should create "New Folder" in empty folder', () => {
      const file = createFolder('public/empty/', 'empty');
      expect(getNewFolderPath(file, allFiles, 'child')).toBe('public/empty/New Folder');
    });

    test('should create "New Folder 1" when "New Folder" already exists', () => {
      const file = createFolder('public/yo/', 'yo');
      expect(getNewFolderPath(file, allFiles, 'child')).toBe('public/yo/New Folder 1');
    });

    test('should create "New Folder 2" when "New Folder" and "New Folder 1" exist', () => {
      const file = createFolder('public/other/sub/', 'sub');
      expect(getNewFolderPath(file, allFiles, 'child')).toBe('public/other/sub/New Folder 2');
    });

    test('should fall back to root folder items when parent not found in tree', () => {
      const file = createFolder('public/nonexistent/', 'nonexistent');
      expect(getNewFolderPath(file, allFiles, 'child')).toBe('public/nonexistent/New Folder');
    });
  });

  describe('sibling mode', () => {
    test('should create sibling using parentPath', () => {
      const file = { ...createFolder('public/yo/New Folder/', 'New Folder'), parentPath: 'public/yo/' } as DialFile;
      expect(getNewFolderPath(file, allFiles, 'sibling')).toBe('public/yo/New Folder 1');
    });

    test('should derive parent from path when parentPath is missing', () => {
      const file = createFolder('public/empty/', 'empty');
      // parent is "public/" which is allFiles[0] (fallback) with rootChildren
      expect(getNewFolderPath(file, allFiles, 'sibling')).toContain('New Folder');
    });

    test('should create sibling with incremented name in deeply nested folder', () => {
      const file = {
        ...createFolder('public/other/sub/New Folder/', 'New Folder'),
        parentPath: 'public/other/sub/',
      } as DialFile;
      expect(getNewFolderPath(file, allFiles, 'sibling')).toBe('public/other/sub/New Folder 2');
    });
  });
});
