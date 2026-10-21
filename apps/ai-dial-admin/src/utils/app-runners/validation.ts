import { DialAppRunnerResource } from '@/src/models/dial/resource';
import { CORE_UNENCODABLE_ID_CHARS } from '@/src/utils/core-schemas/constants';
import { hasUnencodableSchemaIdChars } from '@/src/utils/core-schemas/resource-name';
import { CORE_ROUTE_METHODS, REQUIRED_PARAMETER_META_KEYS } from './constants';

export interface AppRunnerValidationError {
  field: string;
  message: string;
}

const DIAL_META_KEY = 'dial:meta';
const DIAL_APP_RUNNER_ROUTES_KEY = 'dial:applicationTypeRoutes';

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const isStringArray = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every((item) => typeof item === 'string');

const validateParameters = (runner: DialAppRunnerResource): AppRunnerValidationError[] => {
  const properties: unknown = runner.properties;
  if (properties == null) {
    return [];
  }
  if (!isRecord(properties)) {
    return [{ field: 'properties', message: 'Properties must be an object keyed by parameter name' }];
  }
  return Object.entries(properties).flatMap(([name, definition]) => {
    const meta = isRecord(definition) ? definition[DIAL_META_KEY] : undefined;
    const missing = REQUIRED_PARAMETER_META_KEYS.filter(
      (key) => !isRecord(meta) || meta[key] == null || meta[key] === '',
    );
    return missing.length
      ? [{ field: `properties.${name}`, message: `Parameter "${name}" requires ${missing.join(' and ')}` }]
      : [];
  });
};

const validateCoreRoute = (name: string, route: unknown): AppRunnerValidationError[] => {
  const field = `${DIAL_APP_RUNNER_ROUTES_KEY}.${name || '(unnamed)'}`;
  const errors: AppRunnerValidationError[] = [];

  if (!/^[a-zA-Z0-9_]+$/.test(name)) {
    errors.push({ field, message: 'Route name must contain only letters, numbers, and underscores' });
  }
  if (!isRecord(route)) {
    return [...errors, { field, message: 'Route must be an object' }];
  }

  const paths = route['dial:paths'];
  if (!isStringArray(paths) || !paths.length) {
    errors.push({ field, message: 'At least one dial:paths entry is required' });
  }

  const methods = route['dial:methods'];
  if (!isStringArray(methods) || !methods.length) {
    errors.push({ field, message: 'At least one dial:methods entry is required' });
  } else {
    const invalidMethods = methods.filter((method) => !CORE_ROUTE_METHODS.includes(method));
    if (invalidMethods.length) {
      errors.push({ field, message: `Unsupported method(s): ${invalidMethods.join(', ')}` });
    }
  }

  const upstreams = route['dial:upstreams'];
  const response = route['dial:response'];
  if (!Array.isArray(upstreams) && !isRecord(response)) {
    errors.push({ field, message: 'Either dial:upstreams or dial:response is required' });
  }
  if (Array.isArray(upstreams) && upstreams.some((upstream) => !isRecord(upstream) || !upstream['dial:endpoint'])) {
    errors.push({ field, message: 'Every dial:upstreams entry requires dial:endpoint' });
  }
  if (response != null && (!isRecord(response) || response['dial:status'] == null || response['dial:body'] == null)) {
    errors.push({ field, message: 'A dial:response requires both dial:status and dial:body' });
  }

  return errors;
};

const validateRoutes = (routes: unknown): AppRunnerValidationError[] => {
  if (routes == null) {
    return [];
  }
  if (!isRecord(routes)) {
    return [{ field: DIAL_APP_RUNNER_ROUTES_KEY, message: 'Routes must be an object keyed by route name' }];
  }
  return Object.entries(routes).flatMap(([name, route]) => validateCoreRoute(name, route));
};

/**
 * Core stores the App Runner body verbatim, so the platform editor validates the raw Core-shaped
 * schema before saving. In particular, JSON editor changes keep the keyed, `dial:`-prefixed route
 * map instead of being converted to a form-only array.
 */
export const validateAppRunner = (runner: DialAppRunnerResource): AppRunnerValidationError[] => {
  const errors: AppRunnerValidationError[] = [];

  if (!runner['dial:applicationTypeDisplayName']) {
    errors.push({ field: 'dial:applicationTypeDisplayName', message: 'Display name is required' });
  }
  if (!runner.$id) {
    errors.push({ field: '$id', message: 'Id is required' });
  } else if (typeof runner.$id !== 'string') {
    errors.push({ field: '$id', message: 'Id must be a string' });
  } else if (hasUnencodableSchemaIdChars(runner.$id)) {
    errors.push({ field: '$id', message: `Id must not contain any of ${CORE_UNENCODABLE_ID_CHARS.join(' ')}` });
  }

  errors.push(...validateRoutes(runner[DIAL_APP_RUNNER_ROUTES_KEY]));
  errors.push(...validateParameters(runner));

  return errors;
};

export const isValidAppRunner = (runner: DialAppRunnerResource): boolean => !validateAppRunner(runner).length;
