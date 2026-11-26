import { describe, expect, test } from 'vitest';

import { DeploymentInterfaceType } from '@/src/models/dial/interfaces';
import {
  buildQueryString,
  filterRequestHeaders,
  getCorePath,
  isTryOutInterface,
} from '@/src/server/try-out/build-core-request';

describe('isTryOutInterface', () => {
  test.each([
    DeploymentInterfaceType.OpenAIChatCompletions,
    DeploymentInterfaceType.OpenAIResponses,
    DeploymentInterfaceType.AnthropicMessages,
  ])('accepts %s', (type) => {
    expect(isTryOutInterface(type)).toBe(true);
  });

  test.each([DeploymentInterfaceType.OpenAIEmbeddings, 'chat', '', undefined, null, 1])('rejects %s', (value) => {
    expect(isTryOutInterface(value)).toBe(false);
  });
});

describe('getCorePath', () => {
  test('encodes each segment of the deployment id and keeps its slashes', () => {
    expect(getCorePath(DeploymentInterfaceType.OpenAIChatCompletions, 'applications/a b/c')).toBe(
      '/openai/deployments/applications/a%20b/c/chat/completions',
    );
  });

  test('uses fixed paths for Responses and Messages whatever the deployment', () => {
    expect(getCorePath(DeploymentInterfaceType.OpenAIResponses, undefined)).toBe('/openai/v1/responses');
    expect(getCorePath(DeploymentInterfaceType.AnthropicMessages, undefined)).toBe('/anthropic/v1/messages');
  });

  test.each([undefined, '', '  ', 5, '..', 'a/../b', './a', 'a//b', '/a', 'a/'])(
    'has no chat completions path for deployment %s',
    (deployment) => {
      expect(getCorePath(DeploymentInterfaceType.OpenAIChatCompletions, deployment)).toBeNull();
    },
  );

  test('has no path for an unsupported interface', () => {
    expect(getCorePath(DeploymentInterfaceType.OpenAIEmbeddings, 'x')).toBeNull();
  });
});

describe('filterRequestHeaders', () => {
  test('drops credentials and connection headers whatever their case', () => {
    expect(
      filterRequestHeaders({
        Authorization: 'a',
        'API-KEY': 'b',
        'X-Api-Key': 'c',
        Cookie: 'd',
        Host: 'e',
        'Content-Length': '1',
        'Transfer-Encoding': 'chunked',
        'X-Keep': 'yes',
      }),
    ).toEqual({ 'X-Keep': 'yes' });
  });

  test('drops empty names and non-string values', () => {
    expect(filterRequestHeaders({ ' ': 'a', n: 1 as unknown as string, ok: 'v' })).toEqual({ ok: 'v' });
  });

  test('returns nothing for no headers', () => {
    expect(filterRequestHeaders(undefined)).toEqual({});
  });
});

describe('buildQueryString', () => {
  test('encodes parameters and prefixes a question mark', () => {
    expect(buildQueryString({ a: '1', b: 'x y' })).toBe('?a=1&b=x+y');
  });

  test('skips empty names and non-string values', () => {
    expect(buildQueryString({ ' ': 'a', n: 1 as unknown as string })).toBe('');
  });

  test('is empty without parameters', () => {
    expect(buildQueryString(undefined)).toBe('');
    expect(buildQueryString({})).toBe('');
  });
});
