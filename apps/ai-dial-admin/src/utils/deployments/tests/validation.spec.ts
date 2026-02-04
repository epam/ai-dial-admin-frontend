import { describe, expect, test, vi, beforeEach } from 'vitest';
import {
  getDeploymentsURIError,
  getDeploymentsURLError,
  getErrorForHfModelName,
  getMaintainerError,
  getPathError,
  getSemanticVersionError,
  isValidDockerUri,
  isValidSSHRepo,
  getVariableNameError,
  getCPUError,
  getResourcesConflictError,
  getWhitelistDomainError,
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
    test('returns empty error when url is empty', () => {
      expect(getDeploymentsURLError('', t)).toEqual({
        type: ErrorType.EMPTY,
        text: ErrorI18nKey.RequiredField,
      });

      expect(getDeploymentsURLError('')).toEqual({
        type: ErrorType.EMPTY,
        text: '',
      });
    });

    test('returns error if neither SSH nor HTTP', () => {
      (isValidHttpUrl as any).mockReturnValue(false);
      expect(getDeploymentsURLError('invalid-url', t)).toEqual({
        type: ErrorType.INVALID,
        text: ErrorI18nKey.URLError,
      });

      expect(getDeploymentsURLError('invalid-url')).toEqual({
        type: ErrorType.INVALID,
        text: '',
      });
    });

    test('returns null when url is valid (HTTP or SSH)', () => {
      (isValidHttpUrl as any).mockReturnValue(true);
      expect(getDeploymentsURLError('http://valid.com', t)).toBeNull();
    });
  });

  describe('getDeploymentsURIError', () => {
    test('returns empty error when uri is empty', () => {
      expect(getDeploymentsURIError(undefined, t)).toEqual({
        type: ErrorType.EMPTY,
        text: ErrorI18nKey.RequiredField,
      });

      expect(getDeploymentsURIError('', t)).toEqual({
        type: ErrorType.EMPTY,
        text: ErrorI18nKey.RequiredField,
      });

      expect(getDeploymentsURIError()).toEqual({
        type: ErrorType.EMPTY,
        text: '',
      });
    });

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

    test('returns null for valid docker uri', () => {
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

  describe('getErrorForHfModelName', () => {
    test('returns empty error when value is undefined/empty', () => {
      expect(getErrorForHfModelName(undefined, t)).toEqual({
        type: ErrorType.EMPTY,
        text: ErrorI18nKey.RequiredProperty,
      });
      expect(getErrorForHfModelName('', t)).toEqual({
        type: ErrorType.EMPTY,
        text: ErrorI18nKey.RequiredProperty,
      });
      expect(getErrorForHfModelName('   ', t)).toEqual({
        type: ErrorType.EMPTY,
        text: ErrorI18nKey.RequiredProperty,
      });

      expect(getErrorForHfModelName('   ')).toEqual({
        type: ErrorType.EMPTY,
        text: '',
      });
    });

    test('returns invalid error when format is not <user>/<model>', () => {
      expect(getErrorForHfModelName('user', t)).toEqual({
        type: ErrorType.INVALID,
        text: ErrorI18nKey.HFModelName,
      });
      expect(getErrorForHfModelName('user/model/extra', t)).toEqual({
        type: ErrorType.INVALID,
        text: ErrorI18nKey.HFModelName,
      });

      expect(getErrorForHfModelName('user/model/extra')).toEqual({
        type: ErrorType.INVALID,
        text: '',
      });
      expect(getErrorForHfModelName('/model', t)).toEqual({
        type: ErrorType.INVALID,
        text: ErrorI18nKey.HFModelName,
      });
      expect(getErrorForHfModelName('user/', t)).toEqual({
        type: ErrorType.INVALID,
        text: ErrorI18nKey.HFModelName,
      });

      expect(getErrorForHfModelName('user/')).toEqual({
        type: ErrorType.INVALID,
        text: '',
      });
    });

    test('accepts valid model name', () => {
      expect(getErrorForHfModelName('user/model', t)).toBeNull();
      expect(getErrorForHfModelName('user-name/model_name.v1', t)).toBeNull();
    });

    test('rejects invalid username', () => {
      expect(getErrorForHfModelName('-user/model', t)).toEqual({
        type: ErrorType.INVALID,
        text: ErrorI18nKey.HFModelName,
      });
      expect(getErrorForHfModelName('user-/model', t)).toEqual({
        type: ErrorType.INVALID,
        text: ErrorI18nKey.HFModelName,
      });
      expect(getErrorForHfModelName('us--er/model', t)).toEqual({
        type: ErrorType.INVALID,
        text: ErrorI18nKey.HFModelName,
      });
      expect(getErrorForHfModelName('us_er/model', t)).toEqual({
        type: ErrorType.INVALID,
        text: ErrorI18nKey.HFModelName,
      });
      expect(getErrorForHfModelName('us_er/model')).toEqual({
        type: ErrorType.INVALID,
        text: '',
      });
    });

    test('rejects invalid model name', () => {
      expect(getErrorForHfModelName('user/-model', t)).toEqual({
        type: ErrorType.INVALID,
        text: ErrorI18nKey.HFModelName,
      });
      expect(getErrorForHfModelName('user/model-', t)).toEqual({
        type: ErrorType.INVALID,
        text: ErrorI18nKey.HFModelName,
      });
      expect(getErrorForHfModelName('user/.model', t)).toEqual({
        type: ErrorType.INVALID,
        text: ErrorI18nKey.HFModelName,
      });
      expect(getErrorForHfModelName('user/model.', t)).toEqual({
        type: ErrorType.INVALID,
        text: ErrorI18nKey.HFModelName,
      });
      expect(getErrorForHfModelName('user/mo..del', t)).toEqual({
        type: ErrorType.INVALID,
        text: ErrorI18nKey.HFModelName,
      });
      expect(getErrorForHfModelName('user/mo--del', t)).toEqual({
        type: ErrorType.INVALID,
        text: ErrorI18nKey.HFModelName,
      });
      expect(getErrorForHfModelName('user/model.git', t)).toEqual({
        type: ErrorType.INVALID,
        text: ErrorI18nKey.HFModelName,
      });
      expect(getErrorForHfModelName('user/model.ipynb', t)).toEqual({
        type: ErrorType.INVALID,
        text: ErrorI18nKey.HFModelName,
      });
      expect(getErrorForHfModelName('user/model.ipynb')).toEqual({
        type: ErrorType.INVALID,
        text: '',
      });
    });
  });

  describe('CPU and resources validation', () => {
    test('getCPUError returns invalid for values less than 1 and null otherwise', () => {
      expect(getCPUError(0.5, t)).toEqual({
        type: ErrorType.INVALID,
        text: ErrorI18nKey.CpuError,
      });

      expect(getCPUError(1, t)).toBeNull();
    });

    test('getResourcesConflictError returns invalid when request > limit and null otherwise', () => {
      expect(getResourcesConflictError(2, 1, t)).toEqual({
        type: ErrorType.INVALID,
        text: ErrorI18nKey.LimitRequestError,
      });

      expect(getResourcesConflictError(1, 1, t)).toBeNull();
    });
  });

  describe('Whitelist domain validation', () => {
    test('empty error', () => {
      expect(getWhitelistDomainError('', t)).toEqual({
        type: ErrorType.EMPTY,
        text: ErrorI18nKey.RequiredProperty,
      });
    });

    test('length error', () => {
      expect(getWhitelistDomainError('a.c', t)).toEqual({
        type: ErrorType.LENGTH,
        text: ErrorI18nKey.MinMaxLength,
      });
    });

    test('empty error', () => {
      expect(getWhitelistDomainError('asdf', t)).toEqual({
        type: ErrorType.INVALID,
        text: ErrorI18nKey.InvalidWhitelistDomain,
      });
    });
    test('valid value', () => {
      expect(getWhitelistDomainError('github.com')).toBeNull();
    });
  });
});
