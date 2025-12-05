import { describe, expect, test, vi, beforeEach } from 'vitest';
import {
  getDeploymentsURIError,
  getDeploymentsURLError,
  getMaintainerError,
  getPathError,
  getSemanticVersionError,
  getURIError,
  getURLError,
  isValidDockerUri,
  isValidSSHRepo,
  getVariableNameError,
} from '../validation';
import { ErrorType } from '@/src/types/error-type';
import { ErrorI18nKey } from '@/src/constants/i18n';
import { getPromptVersionError } from '@/src/utils/validation/version-error';
import { isValidHttpUrl } from '@/src/utils/validation/url-error';
import semver from 'semver/preload';

vi.mock('@/src/utils/validation/version-error');
vi.mock('@/src/utils/validation/url-error');
vi.mock('semver/preload');

describe('validation utils', () => {
  const t = (key: string) => key;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getVariableNameError', () => {
    test('returns error for empty name', () => {
      expect(getVariableNameError('', t)).toEqual({
        type: ErrorType.EMPTY,
        text: ErrorI18nKey.RequiredField,
      });

      expect(getVariableNameError('')).toEqual({
        type: ErrorType.EMPTY,
        text: '',
      });
    });

    test('returns error for invalid start character', () => {
      expect(getVariableNameError('1variable', t)).toEqual({
        type: ErrorType.INVALID,
        text: ErrorI18nKey.VariableStartError,
      });

      expect(getVariableNameError('1variable')).toEqual({
        type: ErrorType.INVALID,
        text: '',
      });
    });

    test('returns error for invalid characters', () => {
      expect(getVariableNameError('var-iable', t)).toEqual({
        type: ErrorType.INVALID,
        text: ErrorI18nKey.VariableError,
      });

      expect(getVariableNameError('var-iable')).toEqual({
        type: ErrorType.INVALID,
        text: '',
      });
    });

    test('returns null for valid name', () => {
      expect(getVariableNameError('VALID_VARIABLE_1', t)).toBeNull();
    });
  });

  describe('getSemanticVersionError', () => {
    test('returns error for invalid semantic version', () => {
      (semver.valid as any).mockReturnValue(null);
      expect(getSemanticVersionError({}, {} as any, t, 'invalid')).toEqual({
        text: ErrorI18nKey.NotSemanticVersion,
        type: ErrorType.INVALID,
      });
    });

    test('returns error from getPromptVersionError if present', () => {
      (semver.valid as any).mockReturnValue('1.0.0');
      (getPromptVersionError as any).mockReturnValue('Custom Error');
      expect(getSemanticVersionError({}, {} as any, t, '1.0.0')).toEqual({
        text: 'Custom Error',
        type: ErrorType.INVALID,
      });
    });

    test('returns null if valid and no prompt version error', () => {
      (semver.valid as any).mockReturnValue('1.0.0');
      (getPromptVersionError as any).mockReturnValue(null);
      expect(getSemanticVersionError({}, {} as any, t, '1.0.0')).toBeNull();
    });
  });

  describe('isValidDockerUri', () => {
    test('returns true for valid docker uri', () => {
      expect(isValidDockerUri('nginx:latest')).toBe(true);
      expect(isValidDockerUri('my-registry.com/image:tag')).toBe(true);
    });

    test('returns false for invalid docker uri', () => {
      expect(isValidDockerUri('invalid uri')).toBe(false);
    });
  });

  describe('isValidSSHRepo', () => {
    test('returns true for valid ssh repo', () => {
      expect(isValidSSHRepo('git@github.com:user/repo.git')).toBe(true);
      expect(isValidSSHRepo('ssh://user@host.xz:port/path/to/repo.git')).toBe(true);
    });

    test('returns false for invalid ssh repo', () => {
      expect(isValidSSHRepo('https://github.com/user/repo.git')).toBe(false);
    });
  });

  describe('getDeploymentsURLError', () => {
    test('returns error if neither SSH nor HTTP', () => {
      (isValidHttpUrl as any).mockReturnValue(false);
      // isValidSSHRepo is tested above, but here we rely on the implementation in validation.ts which uses the regex.
      // Since we didn't mock isValidSSHRepo (it's exported from the same file), we rely on its logic.
      // But wait, isValidSSHRepo is exported from the file we are testing. We can't mock it easily if it's used internally unless we do some tricks.
      // However, we can just pass a value that fails both.
      expect(getDeploymentsURLError('invalid-url', t)).toEqual({
        type: ErrorType.INVALID,
        text: ErrorI18nKey.URLError,
      });

      expect(getDeploymentsURLError('invalid-url')).toEqual({
        type: ErrorType.INVALID,
        text: '',
      });
    });

    test('delegates to getURLError if valid format', () => {
      (isValidHttpUrl as any).mockReturnValue(true);
      expect(getDeploymentsURLError('http://valid.com', t)).toBeNull();
    });
  });

  describe('getDeploymentsURIError', () => {
    test('returns error for invalid docker uri', () => {
      expect(getDeploymentsURIError('invalid uri', t)).toEqual({
        type: ErrorType.INVALID,
        text: ErrorI18nKey.ImageSourceURI,
      });

      expect(getDeploymentsURIError('invalid uri')).toEqual({
        type: ErrorType.INVALID,
        text: '',
      });
    });

    test('delegates to getURIError if valid', () => {
      expect(getDeploymentsURIError('nginx:latest', t)).toBeNull();
    });
  });

  describe('getMaintainerError', () => {
    test('returns error if too long', () => {
      const longName = 'a'.repeat(1000); // Assuming MAX_NAME_SYMBOLS is less than 1000
      const error = getMaintainerError(longName, t);
      expect(error).toEqual({
        type: ErrorType.LENGTH,
        text: ErrorI18nKey.Length, // The mock t function just returns the key, arguments are ignored in simple mock
      });

      expect(getMaintainerError(longName)).toEqual({
        type: ErrorType.LENGTH,
        text: '',
      });
    });

    test('returns null if valid', () => {
      expect(getMaintainerError('valid', t)).toBeNull();
    });
  });

  describe('getPathError', () => {
    test('returns error if required and empty', () => {
      expect(getPathError('', t, true)).toEqual({
        type: ErrorType.EMPTY,
        text: ErrorI18nKey.RequiredField,
      });

      expect(getPathError('', void 0, true)).toEqual({
        type: ErrorType.EMPTY,
        text: '',
      });
    });

    test('returns error if not starting with /', () => {
      expect(getPathError('invalid/path', t, false)).toEqual({
        type: ErrorType.INVALID,
        text: ErrorI18nKey.PathError,
      });

      expect(getPathError('invalid/path', void 0, false)).toEqual({
        type: ErrorType.INVALID,
        text: '',
      });
    });

    test('returns null if valid', () => {
      expect(getPathError('/valid/path', t, false)).toBeNull();
    });
  });

  describe('getURLError', () => {
    test('returns error if empty', () => {
      expect(getURLError('', t)).toEqual({
        type: ErrorType.EMPTY,
        text: ErrorI18nKey.RequiredField,
      });

      expect(getURLError('')).toEqual({
        type: ErrorType.EMPTY,
        text: '',
      });
    });

    test('returns null if not empty', () => {
      expect(getURLError('http://example.com', t)).toBeNull();
    });
  });

  describe('getURIError', () => {
    test('returns error if empty', () => {
      expect(getURIError('', t)).toEqual({
        type: ErrorType.EMPTY,
        text: ErrorI18nKey.RequiredField,
      });

      expect(getURIError('')).toEqual({
        type: ErrorType.EMPTY,
        text: '',
      });
    });

    test('returns null if not empty', () => {
      expect(getURIError('nginx', t)).toBeNull();
    });
  });
});
