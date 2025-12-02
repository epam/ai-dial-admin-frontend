import semver from 'semver/preload';
import { ErrorType } from '@/src/types/error-type';
import { ErrorI18nKey } from '@/src/constants/i18n';
import { BaseEntity } from '@/src/models/dial/base-entity';
import { FieldError } from '@/src/models/error';
import { getPromptVersionError } from '@/src/utils/validation/version-error';
import { isValidHttpUrl } from '@/src/utils/validation/url-error';
import { MAX_NAME_SYMBOLS } from '@/src/constants/validation';

const VARIABLE_REGEX = /^[A-Za-z_][A-Za-z0-9_]*$/;
const VARIABLE_START_REGEX = /^[A-Za-z_]/;
const DOCKER_IMAGE_REGEX =
  /^(?:[a-zA-Z0-9.-]+(?::[0-9]+)?\/)?[a-z0-9]+(?:[._-][a-z0-9]+)*(?:\/[a-z0-9]+(?:[._-][a-z0-9]+)*)*(?::[\w][\w.-]{0,127})?(?:@sha256:[a-f0-9]{64})?$/;
const SSH_REPO_REGEX =
  /^(?:ssh:\/\/)?[A-Za-z0-9._-]+@[A-Za-z0-9._-]+(?::\d+)?[:/][A-Za-z0-9._-]+(?:\/[A-Za-z0-9._-]+)*(?:\.git)?$/;

export const getVariableNameError = (name: string, t?: (str: string) => string) => {
  if (!name) {
    return {
      type: ErrorType.EMPTY,
      text: t ? t(ErrorI18nKey.RequiredField) : '',
    };
  }

  if (!VARIABLE_START_REGEX.test(name)) {
    return {
      type: ErrorType.INVALID,
      text: t ? t(ErrorI18nKey.VariableStartError) : '',
    };
  }

  if (!VARIABLE_REGEX.test(name)) {
    return {
      type: ErrorType.INVALID,
      text: t ? t(ErrorI18nKey.VariableError) : '',
    };
  }

  return null;
};

export const getSemanticVersionError = (
  versionsMap: Record<string, string[]> | undefined,
  entity: BaseEntity,
  t: (str: string) => string,
  version?: string,
): FieldError | null => {
  if (semver.valid(version) === null) {
    return { text: t(ErrorI18nKey.NotSemanticVersion), type: ErrorType.INVALID };
  }

  const error = getPromptVersionError(versionsMap, entity, t, version);
  return error ? { text: error, type: ErrorType.INVALID } : null;
};

export const isValidDockerUri = (value: string) => {
  return DOCKER_IMAGE_REGEX.test(value);
};

export const isValidSSHRepo = (value: string) => {
  return SSH_REPO_REGEX.test(value);
};

export const getDeploymentsURLError = (url: string, t?: (str: string) => string): FieldError | null => {
  if (!isValidSSHRepo(url) && !isValidHttpUrl(url)) {
    return {
      type: ErrorType.INVALID,
      text: t ? t(ErrorI18nKey.URLError) : '',
    };
  }

  return getURLError(url, t);
};

export const getDeploymentsURIError = (uri: string, t?: (str: string) => string) => {
  if (!isValidDockerUri(uri)) {
    return {
      type: ErrorType.INVALID,
      text: t ? t(ErrorI18nKey.ImageSourceURI) : '',
    };
  }

  return getURIError(uri, t);
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

export const getPathError = (path: string, t?: (str: string) => string, required?: boolean) => {
  if (!path && required) {
    return {
      type: ErrorType.EMPTY,
      text: t ? t(ErrorI18nKey.RequiredField) : '',
    };
  }

  if (!required && path.trim() && !path.startsWith('/')) {
    return {
      type: ErrorType.INVALID,
      text: t ? t(ErrorI18nKey.PathError) : '',
    };
  }

  return null;
};

export const getURLError = (url: string, t?: (str: string) => string): FieldError | null => {
  if (!url) {
    return {
      type: ErrorType.EMPTY,
      text: t ? t(ErrorI18nKey.RequiredField) : '',
    };
  }
  return null;
};

export const getURIError = (uri: string, t?: (str: string) => string) => {
  if (!uri) {
    return {
      type: ErrorType.EMPTY,
      text: t ? t(ErrorI18nKey.RequiredField) : '',
    };
  }

  return null;
};
