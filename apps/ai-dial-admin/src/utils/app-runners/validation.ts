import { DialAppRunnerResource } from '@/src/models/dial/resource';
import { DialAppRoute } from '@/src/models/dial/route';
import { CORE_ROUTE_METHODS, CORE_UNENCODABLE_ID_CHARS } from './constants';
import { CORE_ROUTE_NAME_PATTERN, getCoreRouteName } from './core-app-routes';
import { hasUnencodableRunnerIdChars } from './core-runner-name';

export interface AppRunnerValidationError {
  field: string;
  message: string;
}

const validateRoute = (route: DialAppRoute, seen: Set<string>): AppRunnerValidationError[] => {
  const errors: AppRunnerValidationError[] = [];
  const name = getCoreRouteName(route);
  const field = `dial:applicationTypeRoutes.${name || '(unnamed)'}`;

  if (!CORE_ROUTE_NAME_PATTERN.test(name)) {
    errors.push({ field, message: `Route name "${name}" must match ${CORE_ROUTE_NAME_PATTERN.source}` });
  }
  if (seen.has(name)) {
    errors.push({ field, message: `Route name "${name}" is used more than once` });
  }
  seen.add(name);

  if (!Array.isArray(route.paths) || !route.paths.length) {
    errors.push({ field, message: 'At least one path is required' });
  }
  if (!Array.isArray(route.methods) || !route.methods.length) {
    errors.push({ field, message: 'At least one method is required' });
  }
  const methods = Array.isArray(route.methods) ? route.methods : [];
  const invalidMethods = methods.filter((method) => !CORE_ROUTE_METHODS.includes(method));
  if (invalidMethods.length) {
    errors.push({ field, message: `Unsupported method(s): ${invalidMethods.join(', ')}` });
  }
  const upstreams = Array.isArray(route.upstreams) ? route.upstreams : [];
  if (!upstreams.length && !route.response) {
    errors.push({ field, message: 'Either an upstream or a response is required' });
  }
  if (upstreams.some((upstream) => !upstream?.endpoint)) {
    errors.push({ field, message: 'Every upstream requires an endpoint' });
  }
  if (route.response && (route.response.status == null || route.response.body == null)) {
    errors.push({ field, message: 'A response requires both a status and a body' });
  }
  return errors;
};

/**
 * Core performs no validation when writing an app-runner (its request body is stored verbatim), so
 * every meta-schema constraint this surface can violate is checked here instead. A violation must
 * block the save rather than reach Core, where it would be accepted and only surface later as an
 * `invalid` status on read.
 *
 * The raw JSON editor can hand this arbitrary parsed JSON, and it is the only save gate while that
 * editor is open. So every field is shape-checked before use: a wrong type must come back as a
 * validation error the user sees, never as a thrown `TypeError` that leaves the save button inert.
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
  } else if (hasUnencodableRunnerIdChars(runner.$id)) {
    errors.push({ field: '$id', message: `Id must not contain any of ${CORE_UNENCODABLE_ID_CHARS.join(' ')}` });
  }

  const routes = runner['dial:applicationTypeRoutes'];
  if (routes != null && !Array.isArray(routes)) {
    // Core's own wire form is an object keyed by route name — the natural thing to paste into the raw
    // editor, and the shape the converters exist to translate. Report it instead of iterating it.
    errors.push({
      field: 'dial:applicationTypeRoutes',
      message: 'Routes must be a list; the name-keyed object form Core stores is not accepted here',
    });
  } else {
    const seen = new Set<string>();
    for (const route of routes ?? []) {
      errors.push(...validateRoute(route ?? {}, seen));
    }
  }

  return errors;
};

export const isValidAppRunner = (runner: DialAppRunnerResource): boolean => !validateAppRunner(runner).length;
