import { describe, expect, test } from 'vitest';

import { buildMethodGroups, flattenMethodGroups } from '@/src/components/TestSuites/utils/method-groups';
import { TestSuitesI18nKey } from '@/src/constants/i18n';
import { DeploymentApiInterface } from '@/src/models/dial/interfaces';
import { Deployment } from '@/src/models/evaluation/deployment';

const deployment = (interfaces?: DeploymentApiInterface[], routes?: Deployment['routes']): Deployment =>
  ({
    $type: 'dial-model',
    deploymentId: 'gpt-4o',
    interfaces,
    routes,
  }) as Deployment;

const ROUTES = { 'route-1': { paths: ['/api/users'], methods: ['GET'] } } as Deployment['routes'];

const routeOptions = (params: Parameters<typeof buildMethodGroups>[0]) =>
  buildMethodGroups(params)
    .find((group) => group.titleKey === TestSuitesI18nKey.Other)
    ?.options.map(({ ref, displayUrl, seed }) => [
      ref.method,
      ref.relativeUrlPattern,
      displayUrl,
      seed.requestTemplate?.urlTemplate,
    ]);

const titles = (params: Parameters<typeof buildMethodGroups>[0]) =>
  buildMethodGroups(params)
    .filter((group) => group.options.length)
    .map((group) => group.titleKey);

describe('buildMethodGroups', () => {
  describe('Responses group gating', () => {
    test('omits the group when interfaces are not reported', () => {
      expect(titles({ deployment: deployment() })).toEqual([TestSuitesI18nKey.OpenAIChatCompletions]);
    });

    test('omits the group when the reported interfaces do not include openaiResponses', () => {
      const interfaces = [DeploymentApiInterface.Chat, DeploymentApiInterface.OpenAIChatCompletions];

      expect(titles({ deployment: deployment(interfaces) })).toEqual([TestSuitesI18nKey.OpenAIChatCompletions]);
    });

    test('includes the group when openaiResponses is reported', () => {
      const interfaces = [DeploymentApiInterface.Chat, DeploymentApiInterface.OpenAIResponses];

      expect(titles({ deployment: deployment(interfaces) })).toEqual([
        TestSuitesI18nKey.OpenAIChatCompletions,
        TestSuitesI18nKey.OpenAIResponses,
      ]);
    });

    test('includes the group for a suite already selecting a Responses method, without the interface', () => {
      const titleKeys = titles({
        deployment: deployment(),
        endpointRef: { method: 'POST', relativeUrlPattern: '/openai/v1/responses' },
      });

      expect(titleKeys).toContain(TestSuitesI18nKey.OpenAIResponses);
    });

    test('includes the group for a suite selecting a response-scoped method', () => {
      const titleKeys = titles({
        deployment: deployment(),
        endpointRef: { method: 'POST', relativeUrlPattern: '^/openai/v1/responses/[^/]+/cancel$' },
      });

      expect(titleKeys).toContain(TestSuitesI18nKey.OpenAIResponses);
    });

    test('omits the group for a suite selecting an unrelated method', () => {
      const titleKeys = titles({
        deployment: deployment(),
        endpointRef: { method: 'POST', relativeUrlPattern: '/chat/completions' },
      });

      expect(titleKeys).not.toContain(TestSuitesI18nKey.OpenAIResponses);
    });

    test("omits the group for a suite selecting a deployment's own unprefixed /responses route", () => {
      const titleKeys = titles({
        deployment: deployment(),
        endpointRef: { method: 'POST', relativeUrlPattern: '/responses' },
      });

      expect(titleKeys).not.toContain(TestSuitesI18nKey.OpenAIResponses);
    });

    test('omits the group when the reported interfaces are empty', () => {
      expect(titles({ deployment: deployment([]) })).toEqual([TestSuitesI18nKey.OpenAIChatCompletions]);
    });

    test('includes the group for the full declared interface list', () => {
      const interfaces = [
        DeploymentApiInterface.Chat,
        DeploymentApiInterface.OpenAIChatCompletions,
        DeploymentApiInterface.OpenAIResponses,
        DeploymentApiInterface.AnthropicMessages,
      ];

      expect(titles({ deployment: deployment(interfaces) })).toEqual([
        TestSuitesI18nKey.OpenAIChatCompletions,
        TestSuitesI18nKey.OpenAIResponses,
        TestSuitesI18nKey.AnthropicMessages,
      ]);
    });

    test('omits the group for a target declaring only anthropicMessages', () => {
      const interfaces = [DeploymentApiInterface.Chat, DeploymentApiInterface.AnthropicMessages];

      expect(titles({ deployment: deployment(interfaces) })).toEqual([
        TestSuitesI18nKey.OpenAIChatCompletions,
        TestSuitesI18nKey.AnthropicMessages,
      ]);
    });

    test('omits the group when there is no deployment at all', () => {
      expect(titles({})).toEqual([TestSuitesI18nKey.OpenAIChatCompletions]);
    });
  });

  describe('Anthropic Messages group gating', () => {
    test('omits the group when interfaces are not reported', () => {
      expect(titles({ deployment: deployment() })).toEqual([TestSuitesI18nKey.OpenAIChatCompletions]);
    });

    test('omits the group when the reported interfaces do not include anthropicMessages', () => {
      const interfaces = [DeploymentApiInterface.Chat, DeploymentApiInterface.OpenAIChatCompletions];

      expect(titles({ deployment: deployment(interfaces) })).toEqual([TestSuitesI18nKey.OpenAIChatCompletions]);
    });

    test('includes the group when anthropicMessages is reported', () => {
      const interfaces = [DeploymentApiInterface.Chat, DeploymentApiInterface.AnthropicMessages];

      expect(titles({ deployment: deployment(interfaces) })).toEqual([
        TestSuitesI18nKey.OpenAIChatCompletions,
        TestSuitesI18nKey.AnthropicMessages,
      ]);
    });

    test('includes the group for a suite already selecting the create-message method, without the interface', () => {
      const titleKeys = titles({
        deployment: deployment(),
        endpointRef: { method: 'POST', relativeUrlPattern: '/anthropic/v1/messages' },
      });

      expect(titleKeys).toContain(TestSuitesI18nKey.AnthropicMessages);
    });

    test('omits the group for a suite selecting an unrelated method', () => {
      const titleKeys = titles({
        deployment: deployment(),
        endpointRef: { method: 'POST', relativeUrlPattern: '/chat/completions' },
      });

      expect(titleKeys).not.toContain(TestSuitesI18nKey.AnthropicMessages);
    });

    test('features have no effect: a truthy features property does not enable the group on its own', () => {
      const withFeatures = { ...deployment(), features: { responses_api: true } } as Deployment;

      expect(titles({ deployment: withFeatures })).not.toContain(TestSuitesI18nKey.AnthropicMessages);
    });

    test('omits the group when there is no deployment at all', () => {
      expect(titles({})).toEqual([TestSuitesI18nKey.OpenAIChatCompletions]);
    });
  });

  describe('group order and contents', () => {
    test('orders chat interface, responses, then routes', () => {
      expect(titles({ deployment: deployment([DeploymentApiInterface.OpenAIResponses], ROUTES) })).toEqual([
        TestSuitesI18nKey.OpenAIChatCompletions,
        TestSuitesI18nKey.OpenAIResponses,
        TestSuitesI18nKey.Other,
      ]);
    });

    test('lists the four Responses operations in order', () => {
      const groups = buildMethodGroups({ deployment: deployment([DeploymentApiInterface.OpenAIResponses]) });
      const responses = groups.find((group) => group.titleKey === TestSuitesI18nKey.OpenAIResponses);

      expect(responses?.options.map(({ ref }) => [ref.method, ref.relativeUrlPattern])).toEqual([
        ['POST', '/openai/v1/responses'],
        ['GET', '^/openai/v1/responses/[^/]+$'],
        ['DELETE', '^/openai/v1/responses/[^/]+$'],
        ['POST', '^/openai/v1/responses/[^/]+/cancel$'],
      ]);
    });

    test('shows the readable URL rather than the regex pattern', () => {
      const groups = buildMethodGroups({ deployment: deployment([DeploymentApiInterface.OpenAIResponses]) });
      const responses = groups.find((group) => group.titleKey === TestSuitesI18nKey.OpenAIResponses);

      expect(responses?.options.map(({ displayUrl }) => displayUrl)).toEqual([
        '/openai/v1/responses',
        '/openai/v1/responses/{response_id}',
        '/openai/v1/responses/{response_id}',
        '/openai/v1/responses/{response_id}/cancel',
      ]);
    });

    test('returns an empty routes group when the deployment declares no routes', () => {
      const groups = buildMethodGroups({ deployment: deployment() });

      expect(groups.find((group) => group.titleKey === TestSuitesI18nKey.Other)?.options).toEqual([]);
    });
  });

  describe('custom routes group', () => {
    const expected = [['GET', '/api/users', '/api/users', '/api/users']];

    test.each([
      ['interfaces are not reported', undefined],
      ['the reported interfaces are empty', []],
      ['the reported interfaces omit openaiResponses', [DeploymentApiInterface.OpenAIChatCompletions]],
      ['the reported interfaces include openaiResponses', [DeploymentApiInterface.OpenAIResponses]],
    ])('derives routes from the deployment when %s', (_label, interfaces) => {
      expect(
        routeOptions({ deployment: deployment(interfaces as DeploymentApiInterface[] | undefined, ROUTES) }),
      ).toEqual(expected);
    });

    test('offers chat interface and routes for a target declaring no API interfaces', () => {
      expect(titles({ deployment: deployment(undefined, ROUTES) })).toEqual([
        TestSuitesI18nKey.OpenAIChatCompletions,
        TestSuitesI18nKey.Other,
      ]);
    });

    test('keeps routes addressable after the Responses group', () => {
      const groups = buildMethodGroups({ deployment: deployment([DeploymentApiInterface.OpenAIResponses], ROUTES) });

      expect(flattenMethodGroups(groups).at(-1)?.displayUrl).toBe('/api/users');
    });
  });

  describe('create-response seed', () => {
    const createSeed = (takenColumnNames?: string[]) => {
      const groups = buildMethodGroups({
        deployment: deployment([DeploymentApiInterface.OpenAIResponses]),
        takenColumnNames,
      });

      return groups.find((group) => group.titleKey === TestSuitesI18nKey.OpenAIResponses)?.options[0]?.seed;
    };

    test('seeds model from the deployment id and input from the user_message variable', () => {
      expect(createSeed()?.requestTemplate?.body?.content).toEqual({
        model: 'gpt-4o',
        input: '${{user_message}}',
      });
    });

    test('seeds the request path without the DIAL prefix', () => {
      expect(createSeed()?.requestTemplate?.urlTemplate).toBe('/openai/v1/responses');
    });

    test('seeds an answer response column extracting the message output text', () => {
      expect(createSeed()?.responseColumns?.[0]).toEqual(
        expect.objectContaining({
          name: 'answer',
          displayName: 'answer',
          expression: "$join(output[type='message'].content[type='output_text'].text)",
        }),
      );
    });

    test('uniquifies the answer column against taken names', () => {
      expect(createSeed(['answer', 'history'])?.responseColumns?.[0]).toEqual(
        expect.objectContaining({ name: 'answer2', displayName: 'answer2' }),
      );
    });
  });

  describe('response-scoped seeds', () => {
    const responseScopedSeeds = () => {
      const groups = buildMethodGroups({ deployment: deployment([DeploymentApiInterface.OpenAIResponses]) });
      const responses = groups.find((group) => group.titleKey === TestSuitesI18nKey.OpenAIResponses);

      return responses?.options.slice(1).map(({ seed }) => seed) ?? [];
    };

    test('seed a response_id placeholder into the request path', () => {
      expect(responseScopedSeeds().map((seed) => seed.requestTemplate?.urlTemplate)).toEqual([
        '/openai/v1/responses/${{response_id}}',
        '/openai/v1/responses/${{response_id}}',
        '/openai/v1/responses/${{response_id}}/cancel',
      ]);
    });

    test('seed an empty body and clear any response columns', () => {
      responseScopedSeeds().forEach((seed) => {
        expect(seed.requestTemplate?.body?.content).toEqual({});
        expect(seed.responseColumns).toEqual([]);
      });
    });
  });

  describe('path patterns', () => {
    test('reject a path that omits the DIAL Responses prefix', () => {
      const groups = buildMethodGroups({ deployment: deployment([DeploymentApiInterface.OpenAIResponses]) });
      const item = groups
        .find((group) => group.titleKey === TestSuitesI18nKey.OpenAIResponses)
        ?.options.find(({ ref }) => ref.method === 'GET');

      const pattern = new RegExp(item?.ref.relativeUrlPattern ?? '');

      expect(pattern.test('/openai/v1/responses/resp_abc123')).toBe(true);
      expect(pattern.test('/responses/resp_abc123')).toBe(false);
      expect(pattern.test('/prefix/openai/v1/responses/resp_abc123')).toBe(false);
      expect(pattern.test('/openai/v1/responses/resp_abc123/trailing')).toBe(false);
    });

    test('accept the seeded placeholder path and a concrete response id, and reject an unrelated path', () => {
      const groups = buildMethodGroups({ deployment: deployment([DeploymentApiInterface.OpenAIResponses]) });
      const cancel = groups
        .find((group) => group.titleKey === TestSuitesI18nKey.OpenAIResponses)
        ?.options.find(({ displayUrl }) => displayUrl.endsWith('/cancel'));

      const pattern = new RegExp(cancel?.ref.relativeUrlPattern ?? '');

      expect(pattern.test('/openai/v1/responses/${{response_id}}/cancel')).toBe(true);
      expect(pattern.test('/openai/v1/responses/resp_abc123/cancel')).toBe(true);
      expect(pattern.test('/openai/v1/responses/resp_abc123')).toBe(false);
      expect(pattern.test('/prefix/openai/v1/responses/resp_abc123/cancel')).toBe(false);
      expect(pattern.test('/openai/v1/responses/resp_abc123/cancel/trailing')).toBe(false);
    });
  });
});

describe('flattenMethodGroups', () => {
  test('flattens options in group order, so an index addresses one option', () => {
    const groups = buildMethodGroups({ deployment: deployment([DeploymentApiInterface.OpenAIResponses], ROUTES) });

    expect(flattenMethodGroups(groups).map(({ displayUrl }) => displayUrl)).toEqual([
      '/chat/completions',
      '/openai/v1/responses',
      '/openai/v1/responses/{response_id}',
      '/openai/v1/responses/{response_id}',
      '/openai/v1/responses/{response_id}/cancel',
      '/api/users',
    ]);
  });
});
