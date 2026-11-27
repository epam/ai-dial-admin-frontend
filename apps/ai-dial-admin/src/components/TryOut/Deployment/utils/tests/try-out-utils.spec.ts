import { describe, expect, test } from 'vitest';

import {
  TryOutFailureKind,
  TryOutLookupStatus,
  TryOutUnavailableReason,
} from '@/src/components/TryOut/Deployment/models';
import { buildTryOutBody } from '@/src/components/TryOut/Deployment/utils/build-request-body';
import { classifyTryOutFailure } from '@/src/components/TryOut/Deployment/utils/classify-failure';
import { getSupportedTryOutInterfaces } from '@/src/components/TryOut/Deployment/utils/get-supported-interfaces';
import { resolveTryOutLookup } from '@/src/components/TryOut/Deployment/utils/resolve-lookup';
import {
  paramsToRecord,
  parseBodyText,
  toTryOutRequest,
} from '@/src/components/TryOut/Deployment/utils/to-try-out-request';
import { DeploymentInterfaceType } from '@/src/models/dial/interfaces';

const { OpenAIChatCompletions, OpenAIResponses, AnthropicMessages, OpenAIEmbeddings } = DeploymentInterfaceType;

describe('getSupportedTryOutInterfaces', () => {
  test('keeps only the supported interfaces, in the offered order', () => {
    expect(getSupportedTryOutInterfaces(['anthropicMessages', 'mcp', 'openaiChatCompletions'])).toEqual([
      OpenAIChatCompletions,
      AnthropicMessages,
    ]);
  });

  test('reads the legacy "chat" name as chat completions', () => {
    expect(getSupportedTryOutInterfaces(['chat'])).toEqual([OpenAIChatCompletions]);
  });

  test('does not duplicate chat completions reported under both names', () => {
    expect(getSupportedTryOutInterfaces(['chat', 'openaiChatCompletions'])).toEqual([OpenAIChatCompletions]);
  });

  test('offers only embeddings for an embeddings model', () => {
    expect(getSupportedTryOutInterfaces(['embedding'])).toEqual([OpenAIEmbeddings]);
    expect(getSupportedTryOutInterfaces(['embedding', 'openaiEmbeddings'])).toEqual([OpenAIEmbeddings]);
  });

  test('never offers embeddings for a chat model', () => {
    expect(getSupportedTryOutInterfaces(['chat', 'openaiResponses'])).toEqual([OpenAIChatCompletions, OpenAIResponses]);
  });

  test('offers nothing for a deployment that serves none of them', () => {
    expect(getSupportedTryOutInterfaces(['mcp', 'custom_ui'])).toEqual([]);
    expect(getSupportedTryOutInterfaces([])).toEqual([]);
  });
});

describe('resolveTryOutLookup', () => {
  test('is ready with the supported interfaces when Core reports a callable one', () => {
    expect(resolveTryOutLookup({ interfaces: ['chat', 'openaiResponses'] })).toEqual({
      status: TryOutLookupStatus.Ready,
      supportedTypes: [OpenAIChatCompletions, OpenAIResponses],
    });
  });

  test('lets a callable interface win over MCP', () => {
    expect(resolveTryOutLookup({ interfaces: ['mcp', 'chat'] }).status).toBe(TryOutLookupStatus.Ready);
  });

  test.each([
    [['mcp'], TryOutUnavailableReason.McpOnly],
    [['mcp', 'custom_ui'], TryOutUnavailableReason.McpOnly],
    [['custom_ui'], TryOutUnavailableReason.CustomUiOnly],
    [[], TryOutUnavailableReason.NoInterface],
    [['unknownInterface'], TryOutUnavailableReason.NoInterface],
  ])('is unavailable for %j with its reason', (interfaces, reason) => {
    expect(resolveTryOutLookup({ interfaces })).toEqual({
      status: TryOutLookupStatus.Unavailable,
      supportedTypes: [],
      reason,
    });
  });

  test('is failed with the failure when the interfaces could not be read', () => {
    const failure = { kind: TryOutFailureKind.NotFound, status: 404 };

    expect(resolveTryOutLookup({ failure })).toEqual({
      status: TryOutLookupStatus.Failed,
      supportedTypes: [],
      failure,
    });
  });
});

describe('buildTryOutBody', () => {
  test('builds a non-streamed embeddings body with the message as the input', () => {
    expect(buildTryOutBody(OpenAIEmbeddings, 'embed', 'hi')).toEqual({ input: 'hi' });
  });

  test('builds a streamed chat completions body without a model', () => {
    expect(buildTryOutBody(OpenAIChatCompletions, 'gpt', 'hi')).toEqual({
      messages: [{ role: 'user', content: 'hi' }],
      stream: true,
    });
  });

  test('builds a streamed Responses body naming the deployment', () => {
    expect(buildTryOutBody(OpenAIResponses, 'gpt', 'hi')).toEqual({ model: 'gpt', input: 'hi', stream: true });
  });

  test('builds a Messages body with the required token ceiling', () => {
    expect(buildTryOutBody(AnthropicMessages, 'claude', 'hi')).toEqual({
      model: 'claude',
      max_tokens: 1024,
      messages: [{ role: 'user', content: 'hi' }],
      stream: true,
    });
  });
});

describe('classifyTryOutFailure', () => {
  test.each([
    [401, false, TryOutFailureKind.NoAccess],
    [403, false, TryOutFailureKind.NoAccess],
    [404, false, TryOutFailureKind.NotFound],
    [400, false, TryOutFailureKind.Rejected],
    [422, false, TryOutFailureKind.Rejected],
    [429, false, TryOutFailureKind.Rejected],
    [500, false, TryOutFailureKind.Server],
    [502, false, TryOutFailureKind.Server],
    [401, true, TryOutFailureKind.NoAccess],
    [400, true, TryOutFailureKind.Rejected],
    [502, true, TryOutFailureKind.Network],
  ])('sorts status %s (route answer: %s) as %s', (status, isProxyError, kind) => {
    expect(classifyTryOutFailure(status, isProxyError)).toEqual({ kind, status });
  });

  test('does not read a route 404 as Core refusing the deployment', () => {
    expect(classifyTryOutFailure(404, true).kind).toBe(TryOutFailureKind.Network);
  });
});

describe('parseBodyText', () => {
  test('parses JSON', () => {
    expect(parseBodyText('{"a":1}')).toEqual({ isValid: true, value: { a: 1 } });
  });

  test('treats an empty body as valid and absent', () => {
    expect(parseBodyText('  ')).toEqual({ isValid: true, value: undefined });
  });

  test('rejects text that is not JSON', () => {
    expect(parseBodyText('{oops')).toEqual({ isValid: false });
  });
});

describe('paramsToRecord', () => {
  test('drops blank names, trims names and lets a later row win', () => {
    expect(
      paramsToRecord([
        { key: ' a ', value: '1' },
        { key: '', value: 'x' },
        { key: '  ', value: 'y' },
        { key: 'a', value: '2' },
      ]),
    ).toEqual({ a: '2' });
  });

  test('is empty without rows', () => {
    expect(paramsToRecord(undefined)).toEqual({});
  });
});

describe('toTryOutRequest', () => {
  test('assembles the request the route expects', () => {
    expect(
      toTryOutRequest({
        type: OpenAIResponses,
        deployment: 'gpt',
        headers: [{ key: 'X-A', value: '1' }],
        queryParams: [{ key: 'q', value: '2' }],
        bodyText: '{"input":"hi"}',
      }),
    ).toEqual({
      interface: OpenAIResponses,
      deployment: 'gpt',
      headers: { 'X-A': '1' },
      query: { q: '2' },
      body: { input: 'hi' },
    });
  });

  test('is null while the body is not valid JSON', () => {
    expect(toTryOutRequest({ type: OpenAIResponses, deployment: 'gpt', bodyText: '{' })).toBeNull();
  });
});
