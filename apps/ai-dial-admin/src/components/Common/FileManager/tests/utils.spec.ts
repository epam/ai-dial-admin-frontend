import { describe, expect, test, vi } from 'vitest';
import { createEmptyFile, getEmptyFile, validateCreateFolder } from '../utils';
import { CREATE_FOLDER_FORBIDDEN_CHARS } from '../constants';
import { FileManagerI18nKey } from '@/src/constants/i18n';

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

    test('should return error message for folder names with "<" character', () => {
      const result = validateCreateFolder('test<folder', mockTranslate);

      expect(result).toBe(FileManagerI18nKey.CreateFolderValidate);
      expect(mockTranslate).toHaveBeenCalledWith(FileManagerI18nKey.CreateFolderValidate);
    });

    test('should return error message for folder names with ">" character', () => {
      const result = validateCreateFolder('test>folder', mockTranslate);

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

    test('should return error message for folder names with "|" character', () => {
      const result = validateCreateFolder('test|folder', mockTranslate);

      expect(result).toBe(FileManagerI18nKey.CreateFolderValidate);
    });

    test('should return error message for folder names with "?" character', () => {
      const result = validateCreateFolder('test?folder', mockTranslate);

      expect(result).toBe(FileManagerI18nKey.CreateFolderValidate);
    });

    test('should return error message for folder names with "*" character', () => {
      const result = validateCreateFolder('test*folder', mockTranslate);

      expect(result).toBe(FileManagerI18nKey.CreateFolderValidate);
    });

    test('should validate against CREATE_FOLDER_FORBIDDEN_CHARS constant', () => {
      const forbiddenChars = ['<', '>', ':', '"', '/', '\\', '|', '?', '*'];

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
  });
});
