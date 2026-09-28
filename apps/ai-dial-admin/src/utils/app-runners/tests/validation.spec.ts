import { describe, expect, test } from 'vitest';

import { DialAppRunnerResource } from '@/src/models/dial/resource';
import { DialAppRoute } from '@/src/models/dial/route';
import { isValidAppRunner, validateAppRunner } from '../validation';

const route: DialAppRoute = {
  name: 'my_route',
  paths: ['/a'],
  methods: ['GET'],
  upstreams: [{ endpoint: 'http://svc' }],
};

const runner = (overrides: Partial<DialAppRunnerResource> = {}): DialAppRunnerResource =>
  ({
    $id: 'https://host/runner',
    'dial:applicationTypeDisplayName': 'Runner',
    ...overrides,
  }) as DialAppRunnerResource;

const fieldsOf = (r: DialAppRunnerResource) => validateAppRunner(r).map((error) => error.field);

describe('App Runner Utils :: validateAppRunner', () => {
  test('Should accept a minimal valid runner', () => {
    expect(validateAppRunner(runner())).toEqual([]);
    expect(isValidAppRunner(runner())).toBe(true);
  });

  test('Should accept a runner with a valid route', () => {
    expect(validateAppRunner(runner({ 'dial:applicationTypeRoutes': [route] }))).toEqual([]);
  });

  test('Should require a display name', () => {
    const errors = validateAppRunner(runner({ 'dial:applicationTypeDisplayName': '' }));

    expect(errors).toContainEqual({
      field: 'dial:applicationTypeDisplayName',
      message: 'Display name is required',
    });
  });

  test('Should reject an id Core cannot store', () => {
    expect(validateAppRunner(runner({ $id: "https://host/it's" }))).toContainEqual({
      field: '$id',
      message: "Id must not contain any of ! ~ * ' ( )",
    });
  });

  test('Should report an empty id as missing rather than blaming characters', () => {
    expect(validateAppRunner(runner({ $id: '' }))).toContainEqual({ field: '$id', message: 'Id is required' });
    expect(fieldsOf(runner({ $id: '' }))).toContain('$id');
  });

  test.each(['my-route', 'my.route', 'my route'])('Should reject route name %s', (name) => {
    const errors = validateAppRunner(runner({ 'dial:applicationTypeRoutes': [{ ...route, name }] }));

    expect(errors.some((error) => error.message.includes('must match'))).toBe(true);
  });

  test('Should reject duplicate route names', () => {
    const errors = validateAppRunner(runner({ 'dial:applicationTypeRoutes': [route, { ...route }] }));

    expect(errors.some((error) => error.message.includes('used more than once'))).toBe(true);
  });

  test('Should require at least one path', () => {
    const errors = validateAppRunner(runner({ 'dial:applicationTypeRoutes': [{ ...route, paths: [] }] }));

    expect(errors).toContainEqual({
      field: 'dial:applicationTypeRoutes.my_route',
      message: 'At least one path is required',
    });
  });

  test('Should require at least one method', () => {
    const errors = validateAppRunner(runner({ 'dial:applicationTypeRoutes': [{ ...route, methods: [] }] }));

    expect(errors.some((error) => error.message === 'At least one method is required')).toBe(true);
  });

  test('Should reject an unsupported method', () => {
    const errors = validateAppRunner(runner({ 'dial:applicationTypeRoutes': [{ ...route, methods: ['TRACE'] }] }));

    expect(errors.some((error) => error.message.includes('Unsupported method(s): TRACE'))).toBe(true);
  });

  test('Should require an upstream or a response', () => {
    const errors = validateAppRunner(runner({ 'dial:applicationTypeRoutes': [{ ...route, upstreams: [] }] }));

    expect(errors.some((error) => error.message === 'Either an upstream or a response is required')).toBe(true);
  });

  test('Should accept a response instead of upstreams', () => {
    const errors = validateAppRunner(
      runner({
        'dial:applicationTypeRoutes': [{ ...route, upstreams: [], response: { status: 204, body: '' } }],
      }),
    );

    expect(errors).toEqual([]);
  });

  test('Should require an endpoint on every upstream', () => {
    const errors = validateAppRunner(
      runner({ 'dial:applicationTypeRoutes': [{ ...route, upstreams: [{ endpoint: '' }] }] }),
    );

    expect(errors.some((error) => error.message === 'Every upstream requires an endpoint')).toBe(true);
  });

  test('Should require both status and body on a response', () => {
    const errors = validateAppRunner(
      runner({ 'dial:applicationTypeRoutes': [{ ...route, response: { status: 204 } }] }),
    );

    expect(errors.some((error) => error.message === 'A response requires both a status and a body')).toBe(true);
  });

  test('Should report the offending route in the field path', () => {
    const errors = validateAppRunner(
      runner({ 'dial:applicationTypeRoutes': [route, { ...route, name: 'other_route', paths: [] }] }),
    );

    expect(errors[0].field).toEqual('dial:applicationTypeRoutes.other_route');
  });

  describe('parameters', () => {
    const withParameter = (definition: unknown) =>
      runner({ properties: { temperature: definition } } as unknown as Partial<DialAppRunnerResource>);

    test('Should accept a parameter carrying its order and kind', () => {
      const definition = { type: 'number', 'dial:meta': { 'dial:propertyOrder': 1, 'dial:propertyKind': 'client' } };

      expect(validateAppRunner(withParameter(definition))).toEqual([]);
    });

    test('Should require both keys on a parameter without dial:meta, whether or not it is required', () => {
      const optional = validateAppRunner(withParameter({ type: 'number' }));
      const required = validateAppRunner({ ...withParameter({ type: 'number' }), required: ['temperature'] });

      const expected = {
        field: 'properties.temperature',
        message: 'Parameter "temperature" requires dial:propertyOrder and dial:propertyKind',
      };
      expect(optional).toEqual([expected]);
      expect(required).toEqual([expected]);
    });

    test('Should name only the missing key', () => {
      const errors = validateAppRunner(withParameter({ 'dial:meta': { 'dial:propertyKind': 'server' } }));

      expect(errors).toEqual([
        { field: 'properties.temperature', message: 'Parameter "temperature" requires dial:propertyOrder' },
      ]);
    });

    test('Should accept an order of zero', () => {
      const definition = { 'dial:meta': { 'dial:propertyOrder': 0, 'dial:propertyKind': 'server' } };

      expect(validateAppRunner(withParameter(definition))).toEqual([]);
    });

    test('Should report properties that are not an object instead of throwing', () => {
      const invalid = runner({ properties: [] } as unknown as Partial<DialAppRunnerResource>);

      expect(fieldsOf(invalid)).toEqual(['properties']);
    });

    test('Should ignore nested properties, which carry no dial:meta', () => {
      const definition = {
        type: 'object',
        properties: { inner: { type: 'string' } },
        'dial:meta': { 'dial:propertyOrder': 1, 'dial:propertyKind': 'client' },
      };

      expect(validateAppRunner(withParameter(definition))).toEqual([]);
    });
  });
});
