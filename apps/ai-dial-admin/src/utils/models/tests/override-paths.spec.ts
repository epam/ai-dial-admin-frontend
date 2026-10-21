import { describe, expect, test } from 'vitest';

import { OVERRIDE_PATH_OPERATIONS } from '@/src/components/BaseControls/InterfacesField/constants';
import { DeploymentInterfaceType } from '@/src/models/dial/interfaces';
import { hasOverridePathIdError, setOverridePath } from '@/src/utils/models/override-paths';

const [chatOperation] = OVERRIDE_PATH_OPERATIONS[DeploymentInterfaceType.OpenAIChatCompletions];
const [createResponse] = OVERRIDE_PATH_OPERATIONS[DeploymentInterfaceType.OpenAIResponses];

describe('hasOverridePathIdError', () => {
  test('flags {id} on an operation that has no id', () => {
    expect(hasOverridePathIdError(createResponse, '/v1/{id}/responses')).toBe(true);
  });

  test('accepts {id} on an operation that has an id', () => {
    expect(hasOverridePathIdError(chatOperation, '/v1/{id}/chat')).toBe(false);
  });

  test('accepts an id-less operation without the token and an empty value', () => {
    expect(hasOverridePathIdError(createResponse, '/v1/responses')).toBe(false);
    expect(hasOverridePathIdError(createResponse, undefined)).toBe(false);
  });

  test('does not treat a near-miss token as {id}', () => {
    expect(hasOverridePathIdError(createResponse, '/v1/{Id}/responses')).toBe(false);
  });
});

describe('setOverridePath', () => {
  test('sets a key and keeps keys it has no input for', () => {
    expect(setOverridePath({ futureKey: '/x' }, 'postOpenaiResponses', '/v1/responses')).toEqual({
      futureKey: '/x',
      postOpenaiResponses: '/v1/responses',
    });
  });

  test('removes a key when the value is empty, blank or missing', () => {
    expect(setOverridePath({ a: '/a', b: '/b' }, 'a', '')).toEqual({ b: '/b' });
    expect(setOverridePath({ a: '/a', b: '/b' }, 'a', '   ')).toEqual({ b: '/b' });
    expect(setOverridePath({ a: '/a', b: '/b' }, 'a')).toEqual({ b: '/b' });
  });

  test('returns undefined once the map is empty', () => {
    expect(setOverridePath({ a: '/a' }, 'a', undefined)).toBeUndefined();
    expect(setOverridePath(undefined, 'a', '')).toBeUndefined();
  });

  test('does not mutate the input map', () => {
    const input = { a: '/a' };
    setOverridePath(input, 'b', '/b');
    expect(input).toEqual({ a: '/a' });
  });
});
