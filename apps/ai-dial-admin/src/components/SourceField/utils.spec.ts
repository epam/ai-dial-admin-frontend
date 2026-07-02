import { describe, expect, test } from 'vitest';
import { SOURCE_TYPE } from './types';
import {
  getContainerRoute,
  getRouteForContainer,
  isContainerFamilySource,
  isMcpContainer,
  isTextClassificationInferenceContainer,
  isToolsetCapableContainer,
  isValidSourceField,
} from './utils';
import { MODEL_SERVING_SOURCE_TYPE } from './constants';
import { ApplicationRoute } from '@/src/types/routes';
import { CONTAINER_TYPE, INFERENCE_TASK } from '@/src/types/deployments/containers';
import { Container } from '@/src/models/deployments/containers';

const container = (overrides: Partial<Container>): Container => overrides as Container;

describe('isValidSourceField', () => {
  test('returns true for valid CONTAINER source', () => {
    const entity = { source: { $type: SOURCE_TYPE.CONTAINER, containerId: 'id' } };
    expect(isValidSourceField(entity as any)).toBe(true);
  });

  test('returns false for CONTAINER source without containerId', () => {
    const entity = { source: { $type: SOURCE_TYPE.CONTAINER } };
    expect(isValidSourceField(entity as any)).toBe(false);
  });

  test('returns true for valid ADAPTER source', () => {
    const entity = { source: { $type: SOURCE_TYPE.ADAPTER, adapterName: 'name', completionEndpointPath: 'path' } };
    expect(isValidSourceField(entity as any)).toBe(true);
  });

  test('returns false for ADAPTER source missing fields', () => {
    const entity = { source: { $type: SOURCE_TYPE.ADAPTER, adapterName: 'name' } };
    expect(isValidSourceField(entity as any)).toBe(false);
  });

  test('returns true for valid RUNNER source', () => {
    const entity = { source: { $type: SOURCE_TYPE.RUNNER, runnerName: 'runner' } };
    expect(isValidSourceField(entity as any)).toBe(true);
  });

  test('returns false for RUNNER source missing runnerName', () => {
    const entity = { source: { $type: SOURCE_TYPE.RUNNER } };
    expect(isValidSourceField(entity as any)).toBe(false);
  });

  test('returns true for valid ENDPOINTS source', () => {
    const entity = { source: { $type: SOURCE_TYPE.ENDPOINTS }, endpoint: 'http://valid.com' };
    expect(isValidSourceField(entity as any)).toBe(true);
  });

  test('returns false for invalid ENDPOINTS source', () => {
    const entity = { source: { $type: SOURCE_TYPE.ENDPOINTS }, endpoint: 'invalid-url' };
    expect(isValidSourceField(entity as any)).toBe(false);
  });

  test('returns false for model ENDPOINTS source when both endpoints are missing', () => {
    const entity = { source: { $type: SOURCE_TYPE.ENDPOINTS } };
    expect(isValidSourceField(entity as any, ApplicationRoute.Models)).toBe(false);
  });

  test('returns true for model ENDPOINTS source when only endpoint is valid', () => {
    const entity = { source: { $type: SOURCE_TYPE.ENDPOINTS }, endpoint: 'https://valid.com/chat/completions' };
    expect(isValidSourceField(entity as any, ApplicationRoute.Models)).toBe(true);
  });

  test('returns true for model ENDPOINTS source when only responsesEndpoint is valid', () => {
    const entity = { source: { $type: SOURCE_TYPE.ENDPOINTS }, responsesEndpoint: 'https://valid.com/responses' };
    expect(isValidSourceField(entity as any, ApplicationRoute.Models)).toBe(true);
  });

  test('returns true for model ENDPOINTS source when both endpoints are valid', () => {
    const entity = {
      source: { $type: SOURCE_TYPE.ENDPOINTS },
      endpoint: 'https://valid.com/chat/completions',
      responsesEndpoint: 'https://valid.com/responses',
    };
    expect(isValidSourceField(entity as any, ApplicationRoute.Models)).toBe(true);
  });

  test('returns false for model ENDPOINTS source when endpoint is invalid', () => {
    const entity = {
      source: { $type: SOURCE_TYPE.ENDPOINTS },
      endpoint: 'invalid-url',
      responsesEndpoint: 'https://valid.com/responses',
    };
    expect(isValidSourceField(entity as any, ApplicationRoute.Models)).toBe(false);
  });

  test('returns false for model ENDPOINTS source when responsesEndpoint is invalid', () => {
    const entity = {
      source: { $type: SOURCE_TYPE.ENDPOINTS },
      endpoint: 'https://valid.com/chat/completions',
      responsesEndpoint: 'invalid-url',
    };
    expect(isValidSourceField(entity as any, ApplicationRoute.Models)).toBe(false);
  });

  test('returns false for unknown source type', () => {
    const entity = { source: { $type: 'UNKNOWN' } };
    expect(isValidSourceField(entity as any)).toBe(false);
  });

  test('returns false if source is missing', () => {
    const entity = {};
    expect(isValidSourceField(entity as any)).toBe(false);
  });
});

describe('getContainerRoute', () => {
  test('return AdapterContainers route for Adapters', () => {
    expect(getContainerRoute(ApplicationRoute.Adapters)).toBe(ApplicationRoute.AdapterContainers);
  });
  test('return ModelServings route for Models', () => {
    expect(getContainerRoute(ApplicationRoute.Models)).toBe(ApplicationRoute.ModelServings);
  });
  test('return InterceptorContainers route for Interceptors', () => {
    expect(getContainerRoute(ApplicationRoute.Interceptors)).toBe(ApplicationRoute.InterceptorContainers);
  });
  test('return McpContainers route for Toolsets', () => {
    expect(getContainerRoute(ApplicationRoute.Toolsets)).toBe(ApplicationRoute.McpContainers);
  });
});

describe('toolset container capability helpers', () => {
  test('isMcpContainer is true only for MCP containers', () => {
    expect(isMcpContainer(container({ $type: CONTAINER_TYPE.MCP }))).toBe(true);
    expect(isMcpContainer(container({ $type: CONTAINER_TYPE.HF }))).toBe(false);
  });

  test('isTextClassificationInferenceContainer is true only for text-classification inference', () => {
    expect(
      isTextClassificationInferenceContainer(
        container({ $type: CONTAINER_TYPE.HF, inferenceTask: INFERENCE_TASK.TEXT_CLASSIFICATION }),
      ),
    ).toBe(true);
    expect(
      isTextClassificationInferenceContainer(
        container({ $type: CONTAINER_TYPE.HF, inferenceTask: INFERENCE_TASK.TEXT_GENERATION }),
      ),
    ).toBe(false);
    expect(isTextClassificationInferenceContainer(container({ $type: CONTAINER_TYPE.MCP }))).toBe(false);
  });

  test('isToolsetCapableContainer accepts MCP and text-classification inference only', () => {
    expect(isToolsetCapableContainer(container({ $type: CONTAINER_TYPE.MCP }))).toBe(true);
    expect(
      isToolsetCapableContainer(
        container({ $type: CONTAINER_TYPE.HF, inferenceTask: INFERENCE_TASK.TEXT_CLASSIFICATION }),
      ),
    ).toBe(true);
    expect(isToolsetCapableContainer(container({ $type: CONTAINER_TYPE.HF, inferenceTask: INFERENCE_TASK.NONE }))).toBe(
      false,
    );
    expect(isToolsetCapableContainer(container({ $type: CONTAINER_TYPE.NIM }))).toBe(false);
  });

  test('isContainerFamilySource recognises both toolset container selector values', () => {
    expect(isContainerFamilySource(SOURCE_TYPE.CONTAINER)).toBe(true);
    expect(isContainerFamilySource(MODEL_SERVING_SOURCE_TYPE)).toBe(true);
    expect(isContainerFamilySource(SOURCE_TYPE.ENDPOINTS)).toBe(false);
    expect(isContainerFamilySource(undefined)).toBe(false);
  });
});

describe('getRouteForContainer', () => {
  test('routes an MCP container to McpContainers', () => {
    expect(getRouteForContainer(container({ $type: CONTAINER_TYPE.MCP }), ApplicationRoute.Toolsets)).toBe(
      ApplicationRoute.McpContainers,
    );
  });

  test('routes an inference (Model Serving) container to ModelServings', () => {
    expect(getRouteForContainer(container({ $type: CONTAINER_TYPE.HF }), ApplicationRoute.Toolsets)).toBe(
      ApplicationRoute.ModelServings,
    );
    expect(getRouteForContainer(container({ $type: CONTAINER_TYPE.NIM }), ApplicationRoute.Toolsets)).toBe(
      ApplicationRoute.ModelServings,
    );
  });

  test('routes interceptor / adapter / application containers to their pages', () => {
    expect(getRouteForContainer(container({ $type: CONTAINER_TYPE.INTERCEPTOR }), ApplicationRoute.Interceptors)).toBe(
      ApplicationRoute.InterceptorContainers,
    );
    expect(getRouteForContainer(container({ $type: CONTAINER_TYPE.ADAPTER }), ApplicationRoute.Adapters)).toBe(
      ApplicationRoute.AdapterContainers,
    );
    expect(getRouteForContainer(container({ $type: CONTAINER_TYPE.APPLICATION }), ApplicationRoute.Applications)).toBe(
      ApplicationRoute.ApplicationContainers,
    );
  });

  test('falls back to the view-based route when the container is unknown', () => {
    expect(getRouteForContainer(null, ApplicationRoute.Toolsets)).toBe(ApplicationRoute.McpContainers);
    expect(getRouteForContainer(undefined, ApplicationRoute.Models)).toBe(ApplicationRoute.ModelServings);
  });
});
