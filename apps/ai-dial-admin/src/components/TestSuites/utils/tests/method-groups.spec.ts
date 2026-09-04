import { describe, expect, test } from 'vitest';

import { buildMethodGroups, flattenMethodGroups } from '@/src/components/TestSuites/utils/method-groups';
import { TestSuitesI18nKey } from '@/src/constants/i18n';
import { DeploymentInterfaceType } from '@/src/models/dial/interfaces';
import { Deployment } from '@/src/models/evaluation/deployment';

const deployment = (
  interfaces?: DeploymentInterfaceType[],
  routes?: Deployment['routes'],
  features?: Deployment['features'],
): Deployment =>
  ({
    $type: 'dial-model',
    deploymentId: 'gpt-4o',
    interfaces,
    routes,
    features,
  }) as Deployment;

const featuresDeployment = (responsesApi?: boolean): Deployment =>
  deployment(undefined, undefined, { responses_api: responsesApi });

const titles = (params: Parameters<typeof buildMethodGroups>[0]) =>
  buildMethodGroups(params)
    .filter((group) => group.options.length)
    .map((group) => group.titleKey);

describe('buildMethodGroups', () => {
  describe('Responses group gating', () => {
    test('omits the group when interfaces are not reported', () => {
      expect(titles({ deployment: deployment() })).toEqual([TestSuitesI18nKey.ChatInterface]);
    });

    test('omits the group when the reported interfaces do not include openaiResponses', () => {
      const interfaces = [DeploymentInterfaceType.Chat, DeploymentInterfaceType.OpenAIChatCompletions];

      expect(titles({ deployment: deployment(interfaces) })).toEqual([TestSuitesI18nKey.ChatInterface]);
    });

    test('includes the group when openaiResponses is reported', () => {
      const interfaces = [DeploymentInterfaceType.Chat, DeploymentInterfaceType.OpenAIResponses];

      expect(titles({ deployment: deployment(interfaces) })).toEqual([
        TestSuitesI18nKey.ChatInterface,
        TestSuitesI18nKey.Responses,
      ]);
    });

    test('includes the group for a suite already selecting a Responses method, without the interface', () => {
      const titleKeys = titles({
        deployment: deployment(),
        endpointRef: { method: 'POST', relativeUrlPattern: '/openai/v1/responses' },
      });

      expect(titleKeys).toContain(TestSuitesI18nKey.Responses);
    });

    test('includes the group for a suite selecting a response-scoped method', () => {
      const titleKeys = titles({
        deployment: deployment(),
        endpointRef: { method: 'POST', relativeUrlPattern: '/openai/v1/responses/[^/]+/cancel' },
      });

      expect(titleKeys).toContain(TestSuitesI18nKey.Responses);
    });

    test('omits the group for a suite selecting an unrelated method', () => {
      const titleKeys = titles({
        deployment: deployment(),
        endpointRef: { method: 'POST', relativeUrlPattern: '/chat/completions' },
      });

      expect(titleKeys).not.toContain(TestSuitesI18nKey.Responses);
    });

    test("omits the group for a suite selecting a deployment's own unprefixed /responses route", () => {
      const titleKeys = titles({
        deployment: deployment(),
        endpointRef: { method: 'POST', relativeUrlPattern: '/responses' },
      });

      expect(titleKeys).not.toContain(TestSuitesI18nKey.Responses);
    });

    test('includes the group when features.responses_api is true and interfaces are absent', () => {
      expect(titles({ deployment: featuresDeployment(true) })).toEqual([
        TestSuitesI18nKey.ChatInterface,
        TestSuitesI18nKey.Responses,
      ]);
    });

    test('omits the group when features.responses_api is false', () => {
      expect(titles({ deployment: featuresDeployment(false) })).toEqual([TestSuitesI18nKey.ChatInterface]);
    });

    test('omits the group when features is present but carries no responses_api flag', () => {
      expect(titles({ deployment: featuresDeployment(undefined) })).toEqual([TestSuitesI18nKey.ChatInterface]);
    });

    test('includes the group when features.responses_api is true even though interfaces omit it', () => {
      const withBoth = deployment([DeploymentInterfaceType.Chat], undefined, { responses_api: true });

      expect(titles({ deployment: withBoth })).toContain(TestSuitesI18nKey.Responses);
    });

    test('seeds the create-response body from a features-gated deployment', () => {
      const groups = buildMethodGroups({ deployment: featuresDeployment(true) });
      const create = groups.find((group) => group.titleKey === TestSuitesI18nKey.Responses)?.options[0];

      expect(create?.seed.requestTemplate?.body?.content).toEqual({
        model: 'gpt-4o',
        input: '${{user_message}}',
      });
    });

    test('omits the group when there is no deployment at all', () => {
      expect(titles({})).toEqual([TestSuitesI18nKey.ChatInterface]);
    });
  });

  describe('group order and contents', () => {
    test('orders chat interface, responses, then routes', () => {
      const routes = { 'route-1': { paths: ['/api/users'], methods: ['GET'] } } as Deployment['routes'];

      expect(titles({ deployment: deployment([DeploymentInterfaceType.OpenAIResponses], routes) })).toEqual([
        TestSuitesI18nKey.ChatInterface,
        TestSuitesI18nKey.Responses,
        TestSuitesI18nKey.Other,
      ]);
    });

    test('lists the four Responses operations in order', () => {
      const groups = buildMethodGroups({ deployment: deployment([DeploymentInterfaceType.OpenAIResponses]) });
      const responses = groups.find((group) => group.titleKey === TestSuitesI18nKey.Responses);

      expect(responses?.options.map(({ ref }) => [ref.method, ref.relativeUrlPattern])).toEqual([
        ['POST', '/openai/v1/responses'],
        ['GET', '/openai/v1/responses/[^/]+'],
        ['DELETE', '/openai/v1/responses/[^/]+'],
        ['POST', '/openai/v1/responses/[^/]+/cancel'],
      ]);
    });

    test('shows the readable URL rather than the regex pattern', () => {
      const groups = buildMethodGroups({ deployment: deployment([DeploymentInterfaceType.OpenAIResponses]) });
      const responses = groups.find((group) => group.titleKey === TestSuitesI18nKey.Responses);

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

  describe('create-response seed', () => {
    const createSeed = (takenColumnNames?: string[]) => {
      const groups = buildMethodGroups({
        deployment: deployment([DeploymentInterfaceType.OpenAIResponses]),
        takenColumnNames,
      });

      return groups.find((group) => group.titleKey === TestSuitesI18nKey.Responses)?.options[0]?.seed;
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
      const groups = buildMethodGroups({ deployment: deployment([DeploymentInterfaceType.OpenAIResponses]) });
      const responses = groups.find((group) => group.titleKey === TestSuitesI18nKey.Responses);

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
      const groups = buildMethodGroups({ deployment: deployment([DeploymentInterfaceType.OpenAIResponses]) });
      const item = groups
        .find((group) => group.titleKey === TestSuitesI18nKey.Responses)
        ?.options.find(({ ref }) => ref.method === 'GET');

      const pattern = new RegExp(item?.ref.relativeUrlPattern ?? '');

      expect(pattern.test('/openai/v1/responses/resp_abc123')).toBe(true);
      expect(pattern.test('/responses/resp_abc123')).toBe(false);
    });

    test('accept the seeded placeholder path and a concrete response id, and reject an unrelated path', () => {
      const groups = buildMethodGroups({ deployment: deployment([DeploymentInterfaceType.OpenAIResponses]) });
      const cancel = groups
        .find((group) => group.titleKey === TestSuitesI18nKey.Responses)
        ?.options.find(({ ref }) => ref.relativeUrlPattern?.endsWith('/cancel'));

      const pattern = new RegExp(cancel?.ref.relativeUrlPattern ?? '');

      expect(pattern.test('/openai/v1/responses/${{response_id}}/cancel')).toBe(true);
      expect(pattern.test('/openai/v1/responses/resp_abc123/cancel')).toBe(true);
      expect(pattern.test('/openai/v1/responses/resp_abc123')).toBe(false);
    });
  });
});

describe('flattenMethodGroups', () => {
  test('flattens options in group order, so an index addresses one option', () => {
    const routes = { 'route-1': { paths: ['/api/users'], methods: ['GET'] } } as Deployment['routes'];
    const groups = buildMethodGroups({ deployment: deployment([DeploymentInterfaceType.OpenAIResponses], routes) });

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
