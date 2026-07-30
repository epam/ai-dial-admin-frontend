import { DialAppRunnerResource } from '@/src/models/dial/resource';
import { DialAppRoute } from '@/src/models/dial/route';
import { CORE_ROUTE_METHODS } from './constants';
import { CORE_ROUTE_NAME_PATTERN, getCoreRouteName } from './core-app-routes';
import { isValidRunnerId } from './core-runner-name';

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

  if (!route.paths?.length) {
    errors.push({ field, message: 'At least one path is required' });
  }
  if (!route.methods?.length) {
    errors.push({ field, message: 'At least one method is required' });
  }
  const invalidMethods = (route.methods ?? []).filter((method) => !CORE_ROUTE_METHODS.includes(method));
  if (invalidMethods.length) {
    errors.push({ field, message: `Unsupported method(s): ${invalidMethods.join(', ')}` });
  }
  if (!route.upstreams?.length && !route.response) {
    errors.push({ field, message: 'Either an upstream or a response is required' });
  }
  if ((route.upstreams ?? []).some((upstream) => !upstream.endpoint)) {
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
 */
export const validateAppRunner = (runner: DialAppRunnerResource): AppRunnerValidationError[] => {
  const errors: AppRunnerValidationError[] = [];

  if (!runner['dial:applicationTypeDisplayName']) {
    errors.push({ field: 'dial:applicationTypeDisplayName', message: 'Display name is required' });
  }
  if (!isValidRunnerId(runner.$id)) {
    errors.push({ field: '$id', message: "Id must not be empty or contain any of ! ~ * ' ( )" });
  }

  const seen = new Set<string>();
  for (const route of runner['dial:applicationTypeRoutes'] ?? []) {
    errors.push(...validateRoute(route, seen));
  }

  return errors;
};

export const isValidAppRunner = (runner: DialAppRunnerResource): boolean => !validateAppRunner(runner).length;
