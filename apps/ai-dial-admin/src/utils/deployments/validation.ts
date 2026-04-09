import semver from 'semver/preload';
import { ErrorType } from '@/src/types/error-type';
import { EnvVariablesI18nKey, ErrorI18nKey } from '@/src/constants/i18n';
import { FieldError } from '@/src/models/error';
import { isValidHttpUrl } from '@/src/utils/validation/url-error';
import { MAX_NAME_SYMBOLS, MIN_NAME_SYMBOLS } from '@/src/constants/validation';
import { isWrongFieldLength } from '@/src/utils/validation/name-error';
import { checkNameVersionCombination } from '@/src/utils/prompts/versions';

// Image
const IMAGE_NAME_REGEX = /^[A-Za-z0-9 _-]+$/;
const IMAGE_BASE_DIRECTORY_REGEX = /^[^/].*[^/]$|^[^/]+$/;

// Image source
const DOCKER_IMAGE_REGEX =
  /^(?:[a-zA-Z0-9.-]+(?::[0-9]+)?\/)?[a-z0-9]+(?:[._-][a-z0-9]+)*(?:\/[a-z0-9]+(?:[._-][a-z0-9]+)*)*(?::[\w][\w.-]{0,127})?(?:@sha256:[a-f0-9]{64})?$/;
const SSH_REPO_REGEX =
  /^(?:ssh:\/\/)?[A-Za-z0-9._-]+@[A-Za-z0-9._-]+(?::\d+)?[:/][A-Za-z0-9._-]+(?:\/[A-Za-z0-9._-]+)*(?:\.git)?$/;

// Variables
const MIN_VARIABLE_NAME_SYMBOLS = 1;
const MAX_VARIABLE_NAME_SYMBOLS = 253;
const VARIABLE_NAME_REGEX = /^[-._a-zA-Z0-9]+$/;

// MCP server name
const MCP_SERVER_NAME_REGEX = /^[a-zA-Z0-9._-]+\/[a-zA-Z0-9._-]+$/;

// HF model name
const HF_USERNAME_MAX_LENGTH = 42;
const HF_MODEL_MAX_LENGTH = 96;
const HF_USERNAME_ALLOWED_REGEX = /^[A-Za-z0-9-]+$/;
const HF_MODEL_ALLOWED_REGEX = /^[A-Za-z0-9_.-]+$/;

// Whitelist domain
const MIN_DOMAIN_NAME_LENGTH = 4;
const MAX_DOMAIN_NAME_LENGTH = 253;
const WHITELIST_DOMAIN_REGEX = /^((?!-)[A-Za-z0-9-]{1,63}(?<!-)\.)+[A-Za-z]{2,}$/;

export const getImageNameError = (
  name?: string,
  t?: (str: string, args?: Record<string, string | number>) => string,
) => {
  if (isWrongFieldLength(name || '')) {
    return {
      type: ErrorType.LENGTH,
      text: t
        ? t(ErrorI18nKey.MinMaxLength, {
            min: MIN_NAME_SYMBOLS,
            max: MAX_NAME_SYMBOLS,
          })
        : '',
    };
  }
  if (!name?.match(IMAGE_NAME_REGEX)) {
    return {
      type: ErrorType.INVALID,
      text: t ? t(ErrorI18nKey.SpecialChars) : '',
    };
  }

  return null;
};

export const getVariableNameError = (
  name: string,
  t?: (str: string, args?: Record<string, string | number>) => string,
  existingNames?: string[],
) => {
  if (!name) {
    return {
      type: ErrorType.EMPTY,
      text: t ? t(ErrorI18nKey.RequiredField) : '',
    };
  }

  if (name.length < MIN_VARIABLE_NAME_SYMBOLS || name.length > MAX_VARIABLE_NAME_SYMBOLS) {
    return {
      type: ErrorType.LENGTH,
      text: t
        ? t(ErrorI18nKey.MinMaxLength, {
            min: MIN_VARIABLE_NAME_SYMBOLS,
            max: MAX_VARIABLE_NAME_SYMBOLS,
          })
        : '',
    };
  }

  if (!name.match(VARIABLE_NAME_REGEX)) {
    return {
      type: ErrorType.INVALID,
      text: t ? t(ErrorI18nKey.VariableError) : '',
    };
  }

  if (existingNames?.includes(name)) {
    return {
      type: ErrorType.EXISTING,
      text: t ? t(EnvVariablesI18nKey.DuplicateName) : '',
    };
  }

  return null;
};

export const getBaseDirectoryError = (directory?: string, t?: (str: string) => string) => {
  if (directory && !directory.match(IMAGE_BASE_DIRECTORY_REGEX)) {
    return {
      type: ErrorType.INVALID,
      text: t ? t(ErrorI18nKey.BaseDirectoryError) : '',
    };
  }

  return null;
};

/** Save-validation map key used by `VersionControl` for semver format only. */
export const SEMANTIC_VERSION_VALIDATION_FIELD = 'semanticVersion';

/** Required + duplicate name/version only (semver format is validated in `VersionControl`). */
export const getAssetVersionBusinessError = (
  versionsMap: Record<string, string[]> | undefined,
  name: string | undefined,
  t?: (str: string) => string,
  version?: string,
): FieldError | null => {
  if (!version) {
    return {
      type: ErrorType.EMPTY,
      text: t ? t(ErrorI18nKey.RequiredField) : '',
    };
  }

  if (versionsMap && checkNameVersionCombination(versionsMap, name || '', version)) {
    return {
      type: ErrorType.INVALID,
      text: t ? t(ErrorI18nKey.NameVersionCombination) : '',
    };
  }

  return null;
};

export const getSemanticVersionFormatError = (
  version: string | undefined,
  t?: (str: string) => string,
): FieldError | null => {
  if (!version) {
    return null;
  }

  if (semver.valid(version) === null) {
    return { type: ErrorType.INVALID, text: t ? t(ErrorI18nKey.NotSemanticVersion) : '' };
  }

  return null;
};

export const getSemanticVersionError = (
  versionsMap: Record<string, string[]> | undefined,
  name?: string,
  t?: (str: string) => string,
  version?: string,
): FieldError | null => {
  const businessError = getAssetVersionBusinessError(versionsMap, name, t, version);
  if (businessError) {
    return businessError;
  }
  return getSemanticVersionFormatError(version, t);
};

export const getDeploymentsURLError = (url: string, t?: (str: string) => string): FieldError | null => {
  if (!url) {
    return {
      type: ErrorType.EMPTY,
      text: t ? t(ErrorI18nKey.RequiredField) : '',
    };
  }

  if (!url.match(SSH_REPO_REGEX) && !isValidHttpUrl(url)) {
    return {
      type: ErrorType.INVALID,
      text: t ? t(ErrorI18nKey.URLError) : '',
    };
  }

  return null;
};

export const getDeploymentsURIError = (uri?: string, t?: (str: string) => string) => {
  if (!uri) {
    return {
      type: ErrorType.EMPTY,
      text: t ? t(ErrorI18nKey.RequiredField) : '',
    };
  }

  if (!uri.match(DOCKER_IMAGE_REGEX)) {
    return {
      type: ErrorType.INVALID,
      text: t ? t(ErrorI18nKey.ImageSourceURI) : '',
    };
  }

  return null;
};

export const getMaintainerError = (
  maintainer?: string,
  t?: (str: string, options?: Record<string, string | number>) => string,
): FieldError | null => {
  if (maintainer && maintainer.length > MAX_NAME_SYMBOLS) {
    return {
      type: ErrorType.LENGTH,
      text: t ? t(ErrorI18nKey.Length, { number: MAX_NAME_SYMBOLS }) : '',
    };
  }

  return null;
};

export const getPathError = (path?: string, t?: (str: string) => string, required?: boolean) => {
  if (!path && required) {
    return {
      type: ErrorType.EMPTY,
      text: t ? t(ErrorI18nKey.RequiredField) : '',
    };
  }

  if (!required && path?.trim() && !path.startsWith('/')) {
    return {
      type: ErrorType.INVALID,
      text: t ? t(ErrorI18nKey.PathError) : '',
    };
  }

  return null;
};

const endsWithAny = (value: string, suffixes: string[]): boolean => {
  const lower = value.toLowerCase();
  return suffixes.some((s) => lower.endsWith(s.toLowerCase()));
};

const isValidHfUsername = (username: string): boolean => {
  if (username.length === 0 || username.length > HF_USERNAME_MAX_LENGTH) return false;
  if (!HF_USERNAME_ALLOWED_REGEX.test(username)) return false;
  if (username.startsWith('-') || username.endsWith('-')) return false;
  return !username.includes('--');
};

const isValidHfModelName = (modelName: string): boolean => {
  if (modelName.length === 0 || modelName.length > HF_MODEL_MAX_LENGTH) return false;
  if (!HF_MODEL_ALLOWED_REGEX.test(modelName)) return false;
  if (modelName.startsWith('-') || modelName.endsWith('-')) return false;
  if (modelName.startsWith('.') || modelName.endsWith('.')) return false;
  if (modelName.includes('--')) return false;
  if (modelName.includes('..')) return false;
  return !endsWithAny(modelName, ['.git', '.ipynb']);
};

/**
 * Validates Hugging Face model identifier in form: <user_name>/<model_name>
 *
 * Rules:
 * - user_name: letters/digits and '-', no '--', '-' cannot start/end, max 42
 * - model_name: letters/digits and '-', '_', '.', no '--'/'..', '-' and '.' cannot start/end,
 *   cannot end with ".git" or ".ipynb", max 96
 */
export const getErrorForHfModelName = (
  value?: string,
  t?: (key: string, options?: Record<string, string | number>) => string,
): FieldError | null => {
  const trimmed = value?.trim() ?? '';
  if (!trimmed) {
    return {
      type: ErrorType.EMPTY,
      text: t ? t(ErrorI18nKey.RequiredProperty) : '',
    };
  }

  const parts = trimmed.split('/');
  if (parts.length !== 2) {
    return {
      type: ErrorType.INVALID,
      text: t ? t(ErrorI18nKey.HFModelName) : '',
    };
  }

  const [username, modelName] = parts;
  if (!username || !modelName) {
    return {
      type: ErrorType.INVALID,
      text: t ? t(ErrorI18nKey.HFModelName) : '',
    };
  }

  if (!isValidHfUsername(username) || !isValidHfModelName(modelName)) {
    return {
      type: ErrorType.INVALID,
      text: t ? t(ErrorI18nKey.HFModelName) : '',
    };
  }

  return null;
};

export const getErrorForMcpServerName = (
  value?: string,
  t?: (key: string, options?: Record<string, string | number>) => string,
): FieldError | null => {
  const trimmed = value?.trim() ?? '';
  if (!trimmed) {
    return {
      type: ErrorType.EMPTY,
      text: t ? t(ErrorI18nKey.RequiredProperty) : '',
    };
  }

  if (!MCP_SERVER_NAME_REGEX.test(trimmed)) {
    return {
      type: ErrorType.INVALID,
      text: t ? t(ErrorI18nKey.McpServerName) : '',
    };
  }

  return null;
};

export const getCPUValueError = (
  value: string,
  t?: (key: string, options?: Record<string, string | number>) => string,
): FieldError | null => {
  const num = Number(value);
  if (num < 1) {
    return { type: ErrorType.INVALID, text: t ? t(ErrorI18nKey.CpuError) : '' };
  }

  return null;
};

export const getGpuError = (
  value?: string,
  t?: (key: string, options?: Record<string, string | number>) => string,
): FieldError | null => {
  const num = Number(value);
  if (num < 0) {
    return { type: ErrorType.INVALID, text: t ? t(ErrorI18nKey.GPUError) : '' };
  }

  return null;
};

export const getMemoryValueError = (
  value: string,
  t?: (key: string, options?: Record<string, string | number>) => string,
): FieldError | null => {
  const num = Number(value);
  if (num <= 0) {
    return { type: ErrorType.INVALID, text: t ? t(ErrorI18nKey.MemoryError) : '' };
  }

  return null;
};

export const getResourcesConflictError = (
  request?: string,
  limit?: string,
  t?: (key: string, options?: Record<string, string | number>) => string,
): FieldError | null => {
  const requestNum = Number(request);
  const limitNum = Number(limit);
  if (request && limit && requestNum > limitNum) {
    return { type: ErrorType.CONFLICT, text: t ? t(ErrorI18nKey.LimitRequestError) : '' };
  }

  return null;
};

export const getReplicasError = (
  min?: number,
  max?: number,
  t?: (key: string, options?: Record<string, string | number>) => string,
): FieldError | null => {
  if (min != null && min < 0) {
    return { type: ErrorType.INVALID, text: t ? t(ErrorI18nKey.ReplicasError) : '' };
  }
  if (max != null && max < 1) {
    return { type: ErrorType.INVALID, text: t ? t(ErrorI18nKey.ReplicasError) : '' };
  }
  if (min != null && max != null && min > max) {
    return { type: ErrorType.INVALID, text: t ? t(ErrorI18nKey.ReplicasError) : '' };
  }
  return null;
};

export const getWhitelistDomainError = (
  value?: string,
  t?: (key: string, options?: Record<string, string | number>) => string,
): FieldError | null => {
  if (value === '*') {
    return null;
  }

  const trimmed = value?.trim() ?? '';
  if (!trimmed) {
    return {
      type: ErrorType.EMPTY,
      text: t ? t(ErrorI18nKey.RequiredProperty) : '',
    };
  }

  if ((value as string).length > MAX_DOMAIN_NAME_LENGTH || (value as string).length < MIN_DOMAIN_NAME_LENGTH) {
    return {
      type: ErrorType.LENGTH,
      text: t ? t(ErrorI18nKey.MinMaxLength, { min: MIN_DOMAIN_NAME_LENGTH, max: MAX_DOMAIN_NAME_LENGTH }) : '',
    };
  }

  if (!WHITELIST_DOMAIN_REGEX.test(value as string)) {
    return {
      type: ErrorType.INVALID,
      text: t ? t(ErrorI18nKey.InvalidWhitelistDomain) : '',
    };
  }

  return null;
};

export const getPortError = (
  value: number | string,
  t?: (key: string, options?: Record<string, string | number>) => string,
  required?: boolean,
) => {
  if (required && value === void 0) {
    return {
      type: ErrorType.EMPTY,
      text: t ? t(ErrorI18nKey.RequiredField) : '',
    };
  }
  if (typeof value === 'string' || !Number.isInteger(value) || value < 1 || value > 65535) {
    return {
      type: ErrorType.INVALID,
      text: t ? t(ErrorI18nKey.PortError) : '',
    };
  }

  return null;
};

export const getFileNameError = (
  name?: string,
  t?: (key: string, options?: Record<string, string | number>) => string,
) => {
  if (name && (name.length < MIN_VARIABLE_NAME_SYMBOLS || name.length > MAX_VARIABLE_NAME_SYMBOLS)) {
    return {
      type: ErrorType.LENGTH,
      text: t
        ? t(ErrorI18nKey.MinMaxLength, {
            min: MIN_VARIABLE_NAME_SYMBOLS,
            max: MAX_VARIABLE_NAME_SYMBOLS,
          })
        : '',
    };
  }

  if (name && !name.match(VARIABLE_NAME_REGEX)) {
    return {
      type: ErrorType.INVALID,
      text: t ? t(ErrorI18nKey.VariableError) : '',
    };
  }

  return null;
};

export const getAdvancedTimingsError = (
  value?: number,
  t?: (key: string, options?: Record<string, string | number>) => string,
  max?: number,
) => {
  if (value != null && max) {
    if (value < 1 || value > max) {
      return { type: ErrorType.INVALID, text: t ? t(ErrorI18nKey.AdvancedTimingsError, { max }) : '' };
    }
  }

  return null;
};

export const getImageNameVersionError = (
  name?: string,
  names?: string[],
  isUniqueNameError?: boolean,
  t?: (key: string, options?: Record<string, string | number>) => string,
) => {
  const isIncludesName = name && names?.includes(name);
  if (isIncludesName || isUniqueNameError) {
    return {
      type: ErrorType.EXISTING,
      text: t ? t(ErrorI18nKey.NameExists) : '',
    };
  }

  return getImageNameError(name, t);
};
