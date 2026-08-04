import { describe, expect, test } from 'vitest';

import { DeploymentInterfaceType } from '@/src/models/dial/interfaces';
import { supportsResponsesInterface } from '../responses-interface';

describe('Models Utils :: supportsResponsesInterface', () => {
  test('Should support Responses when the interfaces map declares a base URL', () => {
    const entity = {
      interfaces: { [DeploymentInterfaceType.OpenAIResponses]: { base_url: 'http://core/responses' } },
    };

    expect(supportsResponsesInterface(entity)).toBe(true);
  });

  test('Should support Responses on the legacy endpoint alone', () => {
    expect(supportsResponsesInterface({ responsesEndpoint: 'http://core/v1/responses' })).toBe(true);
  });

  test('Should support Responses when both are declared', () => {
    const entity = {
      interfaces: { [DeploymentInterfaceType.OpenAIResponses]: { base_url: 'http://core/responses' } },
      responsesEndpoint: 'http://core/v1/responses',
    };

    expect(supportsResponsesInterface(entity)).toBe(true);
  });

  test('Should not support Responses when neither is declared', () => {
    expect(supportsResponsesInterface({})).toBe(false);
  });

  test('Should not support Responses from a chat-completions interface', () => {
    const entity = {
      interfaces: { [DeploymentInterfaceType.OpenAIChatCompletions]: { base_url: 'http://core/chat' } },
    };

    expect(supportsResponsesInterface(entity)).toBe(false);
  });

  test('Should not treat an empty base URL as support', () => {
    const entity = { interfaces: { [DeploymentInterfaceType.OpenAIResponses]: { base_url: '' } } };

    expect(supportsResponsesInterface(entity)).toBe(false);
  });

  test('Should not treat an empty legacy endpoint as support', () => {
    expect(supportsResponsesInterface({ responsesEndpoint: '' })).toBe(false);
  });

  test.each([undefined, null])('Should return false for %s rather than throwing', (entity) => {
    expect(supportsResponsesInterface(entity)).toBe(false);
  });
});
