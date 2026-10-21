import { describe, expect, test } from 'vitest';

import { DialAppRunnerResource } from '@/src/models/dial/resource';
import { isValidAppRunner, validateAppRunner } from '../validation';

const route = {
  'dial:paths': ['/a'],
  'dial:methods': ['GET'],
  'dial:upstreams': [{ 'dial:endpoint': 'http://svc' }],
};

const runner = (overrides: Partial<DialAppRunnerResource> = {}): DialAppRunnerResource =>
  ({
    $id: 'https://host/runner',
    'dial:applicationTypeDisplayName': 'Runner',
    ...overrides,
  }) as DialAppRunnerResource;

const fieldsOf = (value: DialAppRunnerResource) => validateAppRunner(value).map((error) => error.field);

describe('App Runner Utils :: validateAppRunner', () => {
  test('accepts a minimal valid runner', () => {
    expect(validateAppRunner(runner())).toEqual([]);
    expect(isValidAppRunner(runner())).toBe(true);
  });

  test('accepts a valid raw Core route map', () => {
    expect(validateAppRunner(runner({ 'dial:applicationTypeRoutes': { my_route: route } }))).toEqual([]);
  });

  test('requires a display name', () => {
    expect(validateAppRunner(runner({ 'dial:applicationTypeDisplayName': '' }))).toContainEqual({
      field: 'dial:applicationTypeDisplayName',
      message: 'Display name is required',
    });
  });

  test('rejects an id Core cannot store', () => {
    expect(validateAppRunner(runner({ $id: "https://host/it's" }))).toContainEqual({
      field: '$id',
      message: "Id must not contain any of ! ~ * '",
    });
  });

  test.each(['my-route', 'my.route', 'my route'])('rejects Core route key %s', (name) => {
    const errors = validateAppRunner(runner({ 'dial:applicationTypeRoutes': { [name]: route } }));

    expect(errors.some((error) => error.message.includes('Route name must contain'))).toBe(true);
  });

  test('blocks a non-object route map entered in the JSON editor', () => {
    const errors = validateAppRunner(
      runner({ 'dial:applicationTypeRoutes': [] as unknown as DialAppRunnerResource['dial:applicationTypeRoutes'] }),
    );

    expect(errors).toContainEqual({
      field: 'dial:applicationTypeRoutes',
      message: 'Routes must be an object keyed by route name',
    });
  });

  test('requires Core paths, methods and an output', () => {
    const errors = validateAppRunner(
      runner({
        'dial:applicationTypeRoutes': {
          route: { 'dial:paths': [], 'dial:methods': ['TRACE'] },
        },
      }),
    );

    expect(errors.map((error) => error.message)).toEqual(
      expect.arrayContaining([
        'At least one dial:paths entry is required',
        'Unsupported method(s): TRACE',
        'Either dial:upstreams or dial:response is required',
      ]),
    );
  });

  test('requires an endpoint on every Core upstream', () => {
    const errors = validateAppRunner(
      runner({
        'dial:applicationTypeRoutes': {
          route: { 'dial:paths': ['/a'], 'dial:methods': ['GET'], 'dial:upstreams': [{}] },
        },
      }),
    );

    expect(errors.some((error) => error.message === 'Every dial:upstreams entry requires dial:endpoint')).toBe(true);
  });

  test('requires both Core response fields', () => {
    const errors = validateAppRunner(
      runner({
        'dial:applicationTypeRoutes': {
          route: { 'dial:paths': ['/a'], 'dial:methods': ['GET'], 'dial:response': { 'dial:status': 204 } },
        },
      }),
    );

    expect(errors.some((error) => error.message === 'A dial:response requires both dial:status and dial:body')).toBe(
      true,
    );
  });

  describe('parameters', () => {
    const withParameter = (definition: unknown) =>
      runner({ properties: { temperature: definition } } as unknown as Partial<DialAppRunnerResource>);

    test('accepts a parameter carrying its order and kind', () => {
      const definition = { type: 'number', 'dial:meta': { 'dial:propertyOrder': 1, 'dial:propertyKind': 'client' } };

      expect(validateAppRunner(withParameter(definition))).toEqual([]);
    });

    test('requires both keys on a parameter without dial:meta', () => {
      expect(validateAppRunner(withParameter({ type: 'number' }))).toEqual([
        {
          field: 'properties.temperature',
          message: 'Parameter "temperature" requires dial:propertyOrder and dial:propertyKind',
        },
      ]);
    });

    test('reports properties that are not an object instead of throwing', () => {
      expect(fieldsOf(runner({ properties: [] } as unknown as Partial<DialAppRunnerResource>))).toEqual(['properties']);
    });
  });
});
