import { describe, expect, test, vi, beforeEach } from 'vitest';
import {
  getDeploymentsURIError,
  getDeploymentsURLError,
  getErrorForHfModelName,
  getMaintainerError,
  getPathError,
  getSemanticVersionError,
  getVariableNameError,
  getCPUValueError,
  getResourcesConflictError,
  getWhitelistDomainError,
  getReplicasError,
  getImageNameError,
  getBaseDirectoryError,
  getFileNameError,
  getGpuError,
  getMemoryValueError,
  getPortError,
  getAdvancedTimingsError,
} from '../validation';
import { ErrorType } from '@/src/types/error-type';
import { ErrorI18nKey } from '@/src/constants/i18n';
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

    test('returns error for invalid length character', () => {
      expect(getVariableNameError('A'.repeat(254), t)).toEqual({
        type: ErrorType.LENGTH,
        text: ErrorI18nKey.MinMaxLength,
      });

      expect(getVariableNameError('A'.repeat(254))).toEqual({
        type: ErrorType.LENGTH,
        text: '',
      });

      expect(getVariableNameError('variable')).toBeNull();
    });

    test('returns error for invalid characters', () => {
      expect(getVariableNameError('var%!iable', t)).toEqual({
        type: ErrorType.INVALID,
        text: ErrorI18nKey.VariableError,
      });
      expect(getVariableNameError('VALID_VARIABLE_1')).toBeNull();
    });

    test('returns null for valid name', () => {
      expect(getVariableNameError('VALID_VARIABLE_1', t)).toBeNull();
    });
  });

  describe('getSemanticVersionError', () => {
    test('returns error for invalid semantic version', () => {
      (semver.valid as any).mockReturnValue(null);
      expect(getSemanticVersionError({ image: ['1.0.0'] }, 'image', t, 'invalid')).toEqual({
        type: ErrorType.INVALID,
        text: ErrorI18nKey.NotSemanticVersion,
      });
    });

    test('returns error from getPromptVersionError if present', () => {
      (semver.valid as any).mockReturnValue('1.0.0');
      expect(getSemanticVersionError({ image: ['1.0.0'] }, 'image', t, '')).toEqual({
        text: ErrorI18nKey.RequiredField,
        type: ErrorType.EMPTY,
      });
    });

    test('returns error from getPromptVersionError if present', () => {
      (semver.valid as any).mockReturnValue('1.0.0');
      expect(getSemanticVersionError({ image: ['1.0.0'] }, 'image', t, '1.0.0')).toEqual({
        text: ErrorI18nKey.NameVersionCombination,
        type: ErrorType.INVALID,
      });
    });

    test('returns null if valid ', () => {
      (semver.valid as any).mockReturnValue('1.0.1');
      expect(getSemanticVersionError({ image: ['1.0.0'] }, 'image', t, '1.0.1')).toBeNull();
    });
  });

  describe('getImageNameError', () => {
    test('returns true for valid image name', () => {
      expect(getImageNameError('Image!', t)).toEqual({
        text: ErrorI18nKey.SpecialChars,
        type: ErrorType.INVALID,
      });
      expect(getImageNameError('I', t)).toEqual({
        text: ErrorI18nKey.MinMaxLength,
        type: ErrorType.LENGTH,
      });
      expect(getImageNameError('I')).toEqual({
        text: '',
        type: ErrorType.LENGTH,
      });
    });

    test('returns false for invalid image name', () => {
      expect(getImageNameError('image_- good')).toBeNull();
    });
  });

  describe('getBaseDirectoryError', () => {
    test('returns true for valid base directory', () => {
      expect(getBaseDirectoryError('/path', t)).toEqual({
        text: ErrorI18nKey.BaseDirectoryError,
        type: ErrorType.INVALID,
      });
      expect(getBaseDirectoryError('path/', t)).toEqual({
        text: ErrorI18nKey.BaseDirectoryError,
        type: ErrorType.INVALID,
      });
    });

    test('returns false for invalid base directory', () => {
      expect(getBaseDirectoryError('path')).toBeNull();
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
      expect(getCPUValueError('0.5', t)).toEqual({
        type: ErrorType.INVALID,
        text: ErrorI18nKey.CpuError,
      });

      expect(getCPUValueError('0.5')).toEqual({
        type: ErrorType.INVALID,
        text: '',
      });

      expect(getCPUValueError('1', t)).toBeNull();
    });

    test('getResourcesConflictError returns invalid when request > limit and null otherwise', () => {
      expect(getResourcesConflictError('2', '1', t)).toEqual({
        type: ErrorType.CONFLICT,
        text: ErrorI18nKey.LimitRequestError,
      });

      expect(getResourcesConflictError('2', '1')).toEqual({
        type: ErrorType.CONFLICT,
        text: '',
      });

      expect(getResourcesConflictError('1', '1', t)).toBeNull();
    });
  });

  describe('file name validation field validation', () => {
    test('returns error for invalid length character', () => {
      expect(getFileNameError('A'.repeat(254), t)).toEqual({
        type: ErrorType.LENGTH,
        text: ErrorI18nKey.MinMaxLength,
      });

      expect(getFileNameError('A'.repeat(254))).toEqual({
        type: ErrorType.LENGTH,
        text: '',
      });

      expect(getFileNameError('variable')).toBeNull();
    });

    test('returns error for invalid characters', () => {
      expect(getFileNameError('var%!iable', t)).toEqual({
        type: ErrorType.INVALID,
        text: ErrorI18nKey.VariableError,
      });
      expect(getFileNameError('VALID_VARIABLE_1')).toBeNull();
    });

    test('returns null for valid name', () => {
      expect(getFileNameError('VALID_VARIABLE_1', t)).toBeNull();
    });
  });

  describe('GPU field validation', () => {
    test('returns value error', () => {
      expect(getGpuError('-1', t)).toEqual({
        type: ErrorType.INVALID,
        text: ErrorI18nKey.GPUError,
      });
    });

    test('returns null when valid', () => {
      expect(getGpuError('1', t)).toBeNull();
    });
  });

  describe('Memory field validation', () => {
    test('returns value error', () => {
      expect(getMemoryValueError('0', t)).toEqual({
        type: ErrorType.INVALID,
        text: ErrorI18nKey.MemoryError,
      });
    });

    test('returns null when valid', () => {
      expect(getMemoryValueError('1', t)).toBeNull();
    });
  });

  describe('Port field validation', () => {
    test('returns value error', () => {
      expect(getPortError(65536, t)).toEqual({
        type: ErrorType.INVALID,
        text: ErrorI18nKey.PortError,
      });
    });

    test('returns null when valid', () => {
      expect(getPortError(1123, t)).toBeNull();
    });
  });

  describe('Whitelist domain validation', () => {
    test('empty error', () => {
      expect(getWhitelistDomainError('', t)).toEqual({
        type: ErrorType.EMPTY,
        text: ErrorI18nKey.RequiredProperty,
      });

      expect(getWhitelistDomainError()).toEqual({
        type: ErrorType.EMPTY,
        text: '',
      });
    });

    test('length error', () => {
      expect(getWhitelistDomainError('a.c', t)).toEqual({
        type: ErrorType.LENGTH,
        text: ErrorI18nKey.MinMaxLength,
      });

      expect(getWhitelistDomainError('a.c')).toEqual({
        type: ErrorType.LENGTH,
        text: '',
      });
    });

    test('empty error', () => {
      expect(getWhitelistDomainError('asdf', t)).toEqual({
        type: ErrorType.INVALID,
        text: ErrorI18nKey.InvalidWhitelistDomain,
      });

      expect(getWhitelistDomainError('asdf')).toEqual({
        type: ErrorType.INVALID,
        text: '',
      });
    });
    test('valid value', () => {
      expect(getWhitelistDomainError('github.com')).toBeNull();
    });
  });

  describe('getReplicasError', () => {
    const mockT = vi.fn((key: string) => `Translated: ${key}`);

    test('should return null when min is undefined', () => {
      const result = getReplicasError(undefined, 10, mockT);
      expect(result).toBeNull();
    });

    test('should return null when max is undefined', () => {
      const result = getReplicasError(5, undefined, mockT);
      expect(result).toBeNull();
    });

    test('should return null when both min and max are undefined', () => {
      const result = getReplicasError(undefined, undefined, mockT);
      expect(result).toBeNull();
    });

    test('should return null when min equals max', () => {
      const result = getReplicasError(5, 5, mockT);
      expect(result).toBeNull();
    });

    test('should return null when min is less than max', () => {
      const result = getReplicasError(3, 10, mockT);
      expect(result).toBeNull();
    });

    test('should return error when min is greater than max', () => {
      const result = getReplicasError(10, 5, mockT);

      expect(result).toEqual({
        type: ErrorType.INVALID,
        text: `Translated: ${ErrorI18nKey.ReplicasError}`,
      });
      expect(mockT).toHaveBeenCalledWith(ErrorI18nKey.ReplicasError);
    });

    test('should return error with empty text when t is not provided and min > max', () => {
      const result = getReplicasError(10, 5);

      expect(result).toEqual({
        type: ErrorType.INVALID,
        text: '',
      });
    });

    test('should return error with translated text when t is provided and min > max', () => {
      const result = getReplicasError(15, 3, mockT);

      expect(result).toEqual({
        type: ErrorType.INVALID,
        text: `Translated: ${ErrorI18nKey.ReplicasError}`,
      });
    });

    test('should handle large numbers when min > max', () => {
      const result = getReplicasError(1000, 999, mockT);

      expect(result).toEqual({
        type: ErrorType.INVALID,
        text: `Translated: ${ErrorI18nKey.ReplicasError}`,
      });
    });

    test('should handle large numbers when min < max', () => {
      const result = getReplicasError(999, 1000, mockT);
      expect(result).toBeNull();
    });

    test('should return null when min is 0 and max is positive', () => {
      const result = getReplicasError(0, 10, mockT);
      expect(result).toBeNull();
    });

    test('should return error when both are 0 (max must be >= 1)', () => {
      const result = getReplicasError(0, 0, mockT);
      expect(result).toEqual({
        type: ErrorType.INVALID,
        text: `Translated: ${ErrorI18nKey.ReplicasError}`,
      });
    });

    test('should return error for negative min', () => {
      const result = getReplicasError(-5, 10, mockT);
      expect(result).toEqual({
        type: ErrorType.INVALID,
        text: `Translated: ${ErrorI18nKey.ReplicasError}`,
      });
    });

    test('should return error for negative min and negative max', () => {
      const result = getReplicasError(-5, -10, mockT);

      expect(result).toEqual({
        type: ErrorType.INVALID,
        text: `Translated: ${ErrorI18nKey.ReplicasError}`,
      });
    });

    test('should return error when max is 0', () => {
      const result = getReplicasError(0, 0, mockT);
      expect(result).toEqual({
        type: ErrorType.INVALID,
        text: `Translated: ${ErrorI18nKey.ReplicasError}`,
      });
    });

    test('should return null when only min is provided (max undefined)', () => {
      const result = getReplicasError(5, undefined, mockT);
      expect(result).toBeNull();
    });

    test('should return null when only max is provided (min undefined)', () => {
      const result = getReplicasError(undefined, 10, mockT);
      expect(result).toBeNull();
    });

    test('should handle min = 0 and max undefined', () => {
      const result = getReplicasError(0, undefined, mockT);
      expect(result).toBeNull();
    });

    test('should handle very small difference (min > max by 1)', () => {
      const result = getReplicasError(6, 5, mockT);

      expect(result).toEqual({
        type: ErrorType.INVALID,
        text: `Translated: ${ErrorI18nKey.ReplicasError}`,
      });
    });
  });

  describe('getPositiveNumberFieldsError', () => {
    test('should return error when value less than 0', () => {
      expect(getAdvancedTimingsError(-1, t, 1)).toEqual({
        type: ErrorType.INVALID,
        text: ErrorI18nKey.AdvancedTimingsError,
      });
    });
    test('should return error when value bigger than max', () => {
      expect(getAdvancedTimingsError(101, t, 100)).toEqual({
        type: ErrorType.INVALID,
        text: ErrorI18nKey.AdvancedTimingsError,
      });
    });
    test('should return null when value is bigger than 0', () => {
      expect(getAdvancedTimingsError(1, t, 10)).toBeNull();
    });
  });
});
