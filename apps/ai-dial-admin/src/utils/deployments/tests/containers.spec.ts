import { describe, expect, test, vi, beforeEach } from 'vitest';
import { getContainerRedeploySnapshot, getContainerTemplate, normalizeEnvironmentVariables } from '../containers';
import { ApplicationRoute } from '@/src/types/routes';
import { CONTAINER_STATUS, CONTAINER_TRANSPORT, CONTAINER_TYPE } from '@/src/types/deployments/containers';
import { Container } from '@/src/models/deployments/containers';
import { MOUNT_TYPE, VALUE_TYPE } from '@/src/types/deployments/variables';

vi.mock('@/src/utils/deployments/validation');
vi.mock('@/src/utils/validation/name-error');

describe('containers utils', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getContainerTemplate', () => {
    test('returns template for ModelServings', () => {
      const template = getContainerTemplate(ApplicationRoute.ModelServings);
      expect(template?.$type).toBe(CONTAINER_TYPE.HF);
      expect(template?.resources?.requests?.['nvidia.com/gpu']).toBe('1');
    });

    test('returns template for McpContainers', () => {
      const template = getContainerTemplate(ApplicationRoute.McpContainers);
      expect(template?.$type).toBe(CONTAINER_TYPE.MCP);
      expect(template?.transport).toBe(CONTAINER_TRANSPORT.HTTP);
    });

    test('returns template for Interceptors', () => {
      const template = getContainerTemplate(ApplicationRoute.InterceptorDeployments);
      expect(template?.$type).toBe(CONTAINER_TYPE.INTERCEPTOR);
    });

    test('returns null for unknown route', () => {
      expect(getContainerTemplate('unknown' as ApplicationRoute)).toBeNull();
    });

    test('uses defaults if provided', () => {
      const defaults = {
        CPU_REQUEST: '2',
        MEMORY_REQUEST: '4096',
        CPU_LIMIT: '4',
        MEMORY_LIMIT: '8192',
        GPU_REQUEST: '2',
        GPU_LIMIT: '2',
      };
      const template = getContainerTemplate(ApplicationRoute.ModelServings, defaults);
      expect(template?.resources?.requests?.cpu).toBe('2');
      expect(template?.resources?.requests?.memory).toBe(`${4096 * 1024 * 1024}`);
    });
  });

  describe('getContainerRedeploySnapshot', () => {
    const baseContainer: Container = {
      $type: CONTAINER_TYPE.NIM,
      name: 'container-1',
      displayName: 'c1',
      imageDefinitionId: 'img-1',
      status: CONTAINER_STATUS.NOT_DEPLOYED,
      metadata: {},
    };

    test('normalizes ports ordering', () => {
      const a: Container = { ...baseContainer, containerPorts: [8080, 80] };
      const b: Container = { ...baseContainer, containerPorts: [80, 8080] };
      expect(getContainerRedeploySnapshot(a)).toEqual(getContainerRedeploySnapshot(b));
    });

    test('treats missing envs and empty envs as equivalent', () => {
      const a: Container = { ...baseContainer, metadata: {} };
      const b: Container = { ...baseContainer, metadata: { envs: [] } };
      expect(getContainerRedeploySnapshot(a)).toEqual(getContainerRedeploySnapshot(b));
    });

    test('normalizes env ordering by name/mountType', () => {
      const envA = {
        name: 'B_VAR',
        description: 'b',
        mountType: MOUNT_TYPE.CONTENT,
        value: { $type: VALUE_TYPE.SIMPLE, value: '1' },
      };
      const envB = {
        name: 'A_VAR',
        description: 'a',
        mountType: MOUNT_TYPE.CONTENT,
        value: { $type: VALUE_TYPE.SIMPLE, value: '2' },
      };
      const a: Container = { ...baseContainer, metadata: { envs: [envA as any, envB as any] } };
      const b: Container = { ...baseContainer, metadata: { envs: [envB as any, envA as any] } };
      expect(getContainerRedeploySnapshot(a)).toEqual(getContainerRedeploySnapshot(b));
    });

    test('detects imageDefinitionId change via snapshot inequality', () => {
      const a: Container = { ...baseContainer, imageDefinitionId: 'img-1' };
      const b: Container = { ...baseContainer, imageDefinitionId: 'img-2' };
      expect(getContainerRedeploySnapshot(a)).not.toEqual(getContainerRedeploySnapshot(b));
    });

    test('detects env value change via snapshot inequality', () => {
      const env1 = {
        name: 'A_VAR',
        description: 'a',
        mountType: MOUNT_TYPE.CONTENT,
        value: { $type: VALUE_TYPE.SIMPLE, value: '1' },
      };
      const env2 = {
        name: 'A_VAR',
        description: 'a',
        mountType: MOUNT_TYPE.CONTENT,
        value: { $type: VALUE_TYPE.SIMPLE, value: '2' },
      };
      const a: Container = { ...baseContainer, metadata: { envs: [env1 as any] } };
      const b: Container = { ...baseContainer, metadata: { envs: [env2 as any] } };
      expect(getContainerRedeploySnapshot(a)).not.toEqual(getContainerRedeploySnapshot(b));
    });

    test('detects resources change via snapshot inequality', () => {
      const a: Container = {
        ...baseContainer,
        resources: {
          requests: { cpu: '1', memory: '1', 'nvidia.com/gpu': '1' },
          limits: { cpu: '2', memory: '2', 'nvidia.com/gpu': '1' },
        },
      };
      const b: Container = {
        ...baseContainer,
        resources: {
          requests: { cpu: '1', memory: '1', 'nvidia.com/gpu': '2' },
          limits: { cpu: '2', memory: '2', 'nvidia.com/gpu': '1' },
        },
      };
      expect(getContainerRedeploySnapshot(a)).not.toEqual(getContainerRedeploySnapshot(b));
    });

    test('treats missing and empty resources as equivalent', () => {
      const a: Container = {
        ...baseContainer,
        resources: undefined,
      };
      const b: Container = {
        ...baseContainer,
        resources: { requests: {}, limits: {} },
      };
      expect(getContainerRedeploySnapshot(a)).toEqual(getContainerRedeploySnapshot(b));
    });
  });

  describe('normalizeEnvironmentVariables', () => {
    test('does not throw when env name is undefined', () => {
      const envUndefinedName = { name: undefined, mountType: undefined } as any;
      const envA = { name: 'A_VAR', mountType: MOUNT_TYPE.CONTENT } as any;
      const envB = { name: 'B_VAR', mountType: MOUNT_TYPE.CONTENT } as any;

      expect(() => normalizeEnvironmentVariables([envB, envUndefinedName, envA])).not.toThrow();

      const normalized = normalizeEnvironmentVariables([envB, envB, envUndefinedName, envA]);
      expect(normalized).toHaveLength(4);
      expect(normalized[0]).toBe(envUndefinedName);
      expect(normalized[1]).toBe(envA);
      expect(normalized[2]).toBe(envB);
    });
  });
});
