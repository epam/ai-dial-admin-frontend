import { describe, expect, test } from 'vitest';

import {
  CONTAINER_KIND_BY_TYPE,
  CONTAINER_TYPE_LABELS,
  isContainerKind,
  UNIFIED_CONTAINER_TYPES,
} from '@/src/constants/deployments/container-types';
import { CONTAINER_TYPE } from '@/src/types/deployments/containers';
import { ApplicationRoute } from '@/src/types/routes';

describe('container types config', () => {
  test('covers adapter, application, interceptor and mcp, and nothing else', () => {
    expect(UNIFIED_CONTAINER_TYPES).toEqual([
      CONTAINER_TYPE.ADAPTER,
      CONTAINER_TYPE.APPLICATION,
      CONTAINER_TYPE.INTERCEPTOR,
      CONTAINER_TYPE.MCP,
    ]);
  });

  test('every unified type has a label and a kind', () => {
    UNIFIED_CONTAINER_TYPES.forEach((type) => {
      expect(CONTAINER_TYPE_LABELS[type]).toBeDefined();
      expect(CONTAINER_KIND_BY_TYPE[type]).toBeDefined();
    });
  });

  test('inference is not a container kind', () => {
    expect(CONTAINER_KIND_BY_TYPE[CONTAINER_TYPE.HF]).toBeUndefined();
  });

  test('isContainerKind accepts the four kinds only', () => {
    expect(isContainerKind(ApplicationRoute.McpContainers)).toBe(true);
    expect(isContainerKind(ApplicationRoute.AdapterContainers)).toBe(true);
    expect(isContainerKind(ApplicationRoute.Containers)).toBe(false);
    expect(isContainerKind(ApplicationRoute.ModelServings)).toBe(false);
    expect(isContainerKind(undefined)).toBe(false);
  });
});
