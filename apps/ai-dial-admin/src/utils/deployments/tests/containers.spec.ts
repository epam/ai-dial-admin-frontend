import { beforeEach, describe, expect, test, vi } from 'vitest';
import {
  convertCoresToMilliCores,
  convertMilliCoresToCores,
  getContainerRedeploySnapshot,
  getContainerSourceTypeLabel,
  getContainerTemplate,
  getContainerScaling,
  getContainerResources,
  getContainerSource,
  isEditDisabled,
  normalizeEnvironmentVariables,
  convertMbToBytes,
  convertBytesToMb,
  normalizeContainerPorts,
  isErrorPresent,
  isAutoscalingEnabled,
  deriveScaling,
} from '../containers';
import { ApplicationRoute } from '@/src/types/routes';
import { SOURCE_TYPE } from '@/src/components/SourceField/types';
import { SourceI18nKey } from '@/src/constants/i18n';
import { DEFAULT_SCALING, SERVING_SCALING } from '@/src/constants/deployments/containers';
import {
  CONTAINER_SOURCE_TYPE,
  CONTAINER_STATUS,
  CONTAINER_TRANSPORT,
  CONTAINER_TYPE,
  SCALING_STRATEGY_TYPE,
} from '@/src/types/deployments/containers';
import { Container } from '@/src/models/deployments/containers';
import { MOUNT_TYPE, VALUE_TYPE } from '@/src/types/deployments/variables';

vi.mock('@/src/utils/deployments/validation');
vi.mock('@/src/utils/validation/name-error');

describe('containers utils', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getContainerScaling', () => {
    test('returns SERVING_SCALING for NIM', () => {
      expect(getContainerScaling(CONTAINER_TYPE.NIM)).toEqual(SERVING_SCALING);
    });

    test('returns SERVING_SCALING for HF', () => {
      expect(getContainerScaling(CONTAINER_TYPE.HF)).toEqual(SERVING_SCALING);
    });

    test('returns DEFAULT_SCALING for MCP', () => {
      expect(getContainerScaling(CONTAINER_TYPE.MCP)).toEqual(DEFAULT_SCALING);
    });

    test('returns DEFAULT_SCALING for INTERCEPTOR', () => {
      expect(getContainerScaling(CONTAINER_TYPE.INTERCEPTOR)).toEqual(DEFAULT_SCALING);
    });

    test('returns DEFAULT_SCALING for ADAPTER', () => {
      expect(getContainerScaling(CONTAINER_TYPE.ADAPTER)).toEqual(DEFAULT_SCALING);
    });
  });

  describe('getContainerResources', () => {
    test('includes GPU for NIM', () => {
      const resources = getContainerResources(CONTAINER_TYPE.NIM);
      expect(resources.requests?.['nvidia.com/gpu']).toBe('1');
      expect(resources.limits?.['nvidia.com/gpu']).toBe('1');
    });

    test('includes GPU for HF', () => {
      const resources = getContainerResources(CONTAINER_TYPE.HF);
      expect(resources.requests?.['nvidia.com/gpu']).toBe('1');
      expect(resources.limits?.['nvidia.com/gpu']).toBe('1');
    });

    test('does not include GPU for MCP', () => {
      const resources = getContainerResources(CONTAINER_TYPE.MCP);
      expect(resources.requests?.['nvidia.com/gpu']).toBeUndefined();
      expect(resources.limits?.['nvidia.com/gpu']).toBeUndefined();
    });

    test('does not include GPU for INTERCEPTOR', () => {
      const resources = getContainerResources(CONTAINER_TYPE.INTERCEPTOR);
      expect(resources.requests?.['nvidia.com/gpu']).toBeUndefined();
    });

    test('does not include GPU for ADAPTER', () => {
      const resources = getContainerResources(CONTAINER_TYPE.ADAPTER);
      expect(resources.requests?.['nvidia.com/gpu']).toBeUndefined();
    });

    test('uses provided defaults', () => {
      const defaults = {
        CPU_REQUEST: '2',
        MEMORY_REQUEST: '4096',
        CPU_LIMIT: '4',
        MEMORY_LIMIT: '8192',
        GPU_REQUEST: '2',
        GPU_LIMIT: '2',
      };
      const resources = getContainerResources(CONTAINER_TYPE.HF, defaults);
      expect(resources.requests?.cpu).toBe('2');
      expect(resources.requests?.memory).toBe(`${4096 * 1024 * 1024}`);
      expect(resources.requests?.['nvidia.com/gpu']).toBe('2');
      expect(resources.limits?.cpu).toBe('4');
      expect(resources.limits?.memory).toBe(`${8192 * 1024 * 1024}`);
      expect(resources.limits?.['nvidia.com/gpu']).toBe('2');
    });

    test('uses fallback values when no defaults provided', () => {
      const resources = getContainerResources(CONTAINER_TYPE.MCP);
      expect(resources.requests?.cpu).toBe('1');
      expect(resources.requests?.memory).toBe(`${2048 * 1024 * 1024}`);
      expect(resources.limits?.cpu).toBe('1');
      expect(resources.limits?.memory).toBe(`${2048 * 1024 * 1024}`);
    });
  });

  describe('getContainerSource', () => {
    test('returns NGC_REGISTRY for NIM', () => {
      const source = getContainerSource(CONTAINER_TYPE.NIM);
      expect(source.$type).toBe(CONTAINER_SOURCE_TYPE.NGC_REGISTRY);
    });

    test('returns HUGGINGFACE for HF', () => {
      const source = getContainerSource(CONTAINER_TYPE.HF);
      expect(source.$type).toBe(CONTAINER_SOURCE_TYPE.HUGGINGFACE);
    });

    test('returns IMAGE_REFERENCE when sourceType is IMAGE_REFERENCE', () => {
      const source = getContainerSource(CONTAINER_TYPE.MCP, CONTAINER_SOURCE_TYPE.IMAGE_REFERENCE);
      expect(source.$type).toBe(CONTAINER_SOURCE_TYPE.IMAGE_REFERENCE);
      expect(source.imageReference).toBe('');
    });

    test('returns IMAGE_REFERENCE with externalRegistryRef for MCP registry', () => {
      const source = getContainerSource(CONTAINER_TYPE.MCP, CONTAINER_SOURCE_TYPE.IMAGE_REFERENCE, {
        mcpRegistry: true,
      });
      expect(source.$type).toBe(CONTAINER_SOURCE_TYPE.IMAGE_REFERENCE);
      expect(source.externalRegistryRef).toEqual({ $type: SOURCE_TYPE.MCP_REGISTRY, packageName: '' });
    });

    test('returns INTERNAL_IMAGE by default for MCP', () => {
      const source = getContainerSource(CONTAINER_TYPE.MCP);
      expect(source.$type).toBe(CONTAINER_SOURCE_TYPE.INTERNAL_IMAGE);
      expect(source.imageDefinitionId).toBe('');
    });

    test('returns IMAGE_REFERENCE for ADAPTER with IMAGE_REFERENCE sourceType', () => {
      const source = getContainerSource(CONTAINER_TYPE.ADAPTER, CONTAINER_SOURCE_TYPE.IMAGE_REFERENCE);
      expect(source.$type).toBe(CONTAINER_SOURCE_TYPE.IMAGE_REFERENCE);
      expect(source.imageReference).toBe('');
    });

    test('returns INTERNAL_IMAGE for ADAPTER without sourceType', () => {
      const source = getContainerSource(CONTAINER_TYPE.ADAPTER);
      expect(source.$type).toBe(CONTAINER_SOURCE_TYPE.INTERNAL_IMAGE);
      expect(source.imageDefinitionId).toBe('');
    });

    test('returns INTERNAL_IMAGE for INTERCEPTOR without sourceType', () => {
      const source = getContainerSource(CONTAINER_TYPE.INTERCEPTOR);
      expect(source.$type).toBe(CONTAINER_SOURCE_TYPE.INTERNAL_IMAGE);
      expect(source.imageDefinitionId).toBe('');
    });
  });

  describe('getContainerTemplate', () => {
    test('returns template for HF with SERVING_SCALING', () => {
      const template = getContainerTemplate(CONTAINER_TYPE.HF);
      expect(template?.$type).toBe(CONTAINER_TYPE.HF);
      expect(template?.resources?.requests?.['nvidia.com/gpu']).toBe('1');
      expect(template?.scaling).toEqual(SERVING_SCALING);
      expect(template?.modelFormat).toBe('huggingface');
    });

    test('returns template for MCP with DEFAULT_SCALING', () => {
      const template = getContainerTemplate(CONTAINER_TYPE.MCP);
      expect(template?.$type).toBe(CONTAINER_TYPE.MCP);
      expect(template?.transport).toBe(CONTAINER_TRANSPORT.HTTP);
      expect(template?.scaling).toEqual(DEFAULT_SCALING);
    });

    test('returns template for Interceptors with DEFAULT_SCALING', () => {
      const template = getContainerTemplate(CONTAINER_TYPE.INTERCEPTOR);
      expect(template?.$type).toBe(CONTAINER_TYPE.INTERCEPTOR);
      expect(template?.scaling).toEqual(DEFAULT_SCALING);
    });

    test('returns template for NIM with SERVING_SCALING', () => {
      const template = getContainerTemplate(CONTAINER_TYPE.NIM);
      expect(template?.$type).toBe(CONTAINER_TYPE.NIM);
      expect(template?.scaling).toEqual(SERVING_SCALING);
      expect(getContainerTemplate(CONTAINER_TYPE.NIM, { GPU_REQUEST: '2', GPU_LIMIT: '2' })?.$type).toBe(
        CONTAINER_TYPE.NIM,
      );
    });

    test('returns template for ADAPTER with DEFAULT_SCALING', () => {
      const template = getContainerTemplate(CONTAINER_TYPE.ADAPTER);
      expect(template?.$type).toBe(CONTAINER_TYPE.ADAPTER);
      expect(template?.scaling).toEqual(DEFAULT_SCALING);
    });

    test('returns template for ADAPTER with INTERNAL_IMAGE and DEFAULT_SCALING', () => {
      const template = getContainerTemplate(CONTAINER_TYPE.ADAPTER);
      expect(template?.$type).toBe(CONTAINER_TYPE.ADAPTER);
      expect(template?.source?.$type).toBe(CONTAINER_SOURCE_TYPE.INTERNAL_IMAGE);
      expect(template?.scaling).toEqual(DEFAULT_SCALING);
    });

    test('returns null for falsy type', () => {
      const template = getContainerTemplate('' as CONTAINER_TYPE);
      expect(template).toBeNull();
    });

    test('returns MCP template with IMAGE_REFERENCE source when sourceType is provided', () => {
      const template = getContainerTemplate(CONTAINER_TYPE.MCP, undefined, CONTAINER_SOURCE_TYPE.IMAGE_REFERENCE);
      expect(template?.$type).toBe(CONTAINER_TYPE.MCP);
      expect(template?.source?.$type).toBe(CONTAINER_SOURCE_TYPE.IMAGE_REFERENCE);
      expect(template?.source?.imageReference).toBe('');
      expect(template?.transport).toBe(CONTAINER_TRANSPORT.HTTP);
    });

    test('returns MCP template with INTERNAL_IMAGE source when no sourceType', () => {
      const template = getContainerTemplate(CONTAINER_TYPE.MCP);
      expect(template?.source?.$type).toBe(CONTAINER_SOURCE_TYPE.INTERNAL_IMAGE);
      expect(template?.source?.imageDefinitionId).toBe('');
    });

    test('returns ADAPTER template with IMAGE_REFERENCE source when sourceType is provided', () => {
      const template = getContainerTemplate(CONTAINER_TYPE.ADAPTER, undefined, CONTAINER_SOURCE_TYPE.IMAGE_REFERENCE);
      expect(template?.$type).toBe(CONTAINER_TYPE.ADAPTER);
      expect(template?.source?.$type).toBe(CONTAINER_SOURCE_TYPE.IMAGE_REFERENCE);
      expect(template?.source?.imageReference).toBe('');
      expect(template?.scaling).toEqual(DEFAULT_SCALING);
      expect(template?.transport).toBeUndefined();
    });

    test('returns APPLICATION template with INTERNAL_IMAGE and DEFAULT_SCALING', () => {
      const template = getContainerTemplate(CONTAINER_TYPE.APPLICATION);
      expect(template?.$type).toBe(CONTAINER_TYPE.APPLICATION);
      expect(template?.source?.$type).toBe(CONTAINER_SOURCE_TYPE.INTERNAL_IMAGE);
      expect(template?.scaling).toEqual(DEFAULT_SCALING);
      expect(template?.transport).toBeUndefined();
    });

    test('returns APPLICATION template with IMAGE_REFERENCE source when sourceType is provided', () => {
      const template = getContainerTemplate(
        CONTAINER_TYPE.APPLICATION,
        undefined,
        CONTAINER_SOURCE_TYPE.IMAGE_REFERENCE,
      );
      expect(template?.$type).toBe(CONTAINER_TYPE.APPLICATION);
      expect(template?.source?.$type).toBe(CONTAINER_SOURCE_TYPE.IMAGE_REFERENCE);
      expect(template?.source?.imageReference).toBe('');
      expect(template?.scaling).toEqual(DEFAULT_SCALING);
      expect(template?.transport).toBeUndefined();
    });

    test('returns INTERCEPTOR template with IMAGE_REFERENCE source when sourceType is provided', () => {
      const template = getContainerTemplate(
        CONTAINER_TYPE.INTERCEPTOR,
        undefined,
        CONTAINER_SOURCE_TYPE.IMAGE_REFERENCE,
      );
      expect(template?.$type).toBe(CONTAINER_TYPE.INTERCEPTOR);
      expect(template?.source?.$type).toBe(CONTAINER_SOURCE_TYPE.IMAGE_REFERENCE);
      expect(template?.source?.imageReference).toBe('');
      expect(template?.scaling).toEqual(DEFAULT_SCALING);
      expect(template?.transport).toBeUndefined();
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
      const template = getContainerTemplate(CONTAINER_TYPE.HF, defaults);
      expect(template?.resources?.requests?.cpu).toBe('2');
      expect(template?.resources?.requests?.memory).toBe(`${4096 * 1024 * 1024}`);
    });
  });

  describe('getContainerRedeploySnapshot', () => {
    const baseContainer: Container = {
      $type: CONTAINER_TYPE.NIM,
      name: 'container-1',
      displayName: 'c1',
      source: { $type: CONTAINER_SOURCE_TYPE.INTERNAL_IMAGE, imageDefinitionId: 'img-1' },
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

    test('detects source change via snapshot inequality', () => {
      const a: Container = {
        ...baseContainer,
        source: { $type: CONTAINER_SOURCE_TYPE.INTERNAL_IMAGE, imageDefinitionId: 'img-1' },
      };
      const b: Container = {
        ...baseContainer,
        source: { $type: CONTAINER_SOURCE_TYPE.INTERNAL_IMAGE, imageDefinitionId: 'img-2' },
      };
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

    test('detects command change via snapshot inequality', () => {
      const a: Container = { ...baseContainer, command: '/bin/sh' };
      const b: Container = { ...baseContainer, command: '/bin/bash' };
      expect(getContainerRedeploySnapshot(a)).not.toEqual(getContainerRedeploySnapshot(b));
    });

    test('detects args change via snapshot inequality', () => {
      const a: Container = { ...baseContainer, args: '--port 8080' };
      const b: Container = { ...baseContainer, args: '--port 9090' };
      expect(getContainerRedeploySnapshot(a)).not.toEqual(getContainerRedeploySnapshot(b));
    });

    test('treats missing command and args as equivalent', () => {
      const a: Container = { ...baseContainer };
      const b: Container = { ...baseContainer, command: undefined, args: undefined };
      expect(getContainerRedeploySnapshot(a)).toEqual(getContainerRedeploySnapshot(b));
    });

    test('detects scaling change via snapshot inequality', () => {
      const a: Container = { ...baseContainer, scaling: { minReplicas: 1, maxReplicas: 1 } };
      const b: Container = { ...baseContainer, scaling: { minReplicas: 1, maxReplicas: 3 } };
      expect(getContainerRedeploySnapshot(a)).not.toEqual(getContainerRedeploySnapshot(b));
    });

    test('treats identical scaling as equal', () => {
      const scaling = {
        minReplicas: 1,
        maxReplicas: 3,
        strategy: { $type: SCALING_STRATEGY_TYPE.REQUESTS, threshold: 2 },
      };
      const a: Container = { ...baseContainer, scaling };
      const b: Container = { ...baseContainer, scaling: { ...scaling } };
      expect(getContainerRedeploySnapshot(a)).toEqual(getContainerRedeploySnapshot(b));
    });

    test('treats missing scaling on both sides as equal', () => {
      const a: Container = { ...baseContainer };
      const b: Container = { ...baseContainer, scaling: undefined };
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

  describe('isEditDisabled for containers', () => {
    test('should be true', () => {
      expect(isEditDisabled({ status: CONTAINER_STATUS.PENDING } as Container)).toBeTruthy();
      expect(isEditDisabled({ status: CONTAINER_STATUS.STOPPING } as Container)).toBeTruthy();
    });

    test('should be false', () => {
      expect(isEditDisabled({ status: CONTAINER_STATUS.FAILED } as Container)).toBeFalsy();
      expect(isEditDisabled({ status: CONTAINER_STATUS.STOPPED } as Container)).toBeFalsy();
      expect(isEditDisabled({ status: CONTAINER_STATUS.RUNNING } as Container)).toBeFalsy();
      expect(isEditDisabled({ status: CONTAINER_STATUS.NOT_DEPLOYED } as Container)).toBeFalsy();
    });
  });

  describe('CPU values conversion', () => {
    test('should convert cores to millicores', () => {
      expect(convertCoresToMilliCores('1')).toBe('1000');
    });

    test('should convert millicores to cores', () => {
      expect(convertMilliCoresToCores('1000')).toBe('1');
    });
  });

  describe('Memory values conversion', () => {
    test('should convert MB to Bytes', () => {
      expect(convertMbToBytes('1')).toBe('1048576');
    });

    test('should convert Bytes to MB', () => {
      expect(convertBytesToMb('1048576')).toBe('1');
    });
  });

  describe('normalizeContainerPorts', () => {
    test('should convert ContainerPorts', () => {
      expect(normalizeContainerPorts(undefined)).toEqual([]);
      expect(normalizeContainerPorts([80, 8080])).toEqual([80, 8080]);
    });
  });

  describe('isErrorPresent', () => {
    const errors = new Map().set('name', false).set('version', true);

    test('should return true when errors present', () => {
      expect(isErrorPresent(errors, ['name'])).toBeTruthy();
    });

    test('should return false when errors present', () => {
      expect(isErrorPresent(errors, ['displayName'])).toBeFalsy();
    });

    test('should return false when key exist but valid', () => {
      expect(isErrorPresent(errors, ['version'])).toBeFalsy();
    });
  });

  describe('isAutoscalingEnabled', () => {
    test('returns false when min equals max', () => {
      expect(isAutoscalingEnabled(1, 1)).toBe(false);
      expect(isAutoscalingEnabled(3, 3)).toBe(false);
    });

    test('returns false when max is 1 even if min < max', () => {
      expect(isAutoscalingEnabled(0, 1)).toBe(false);
    });

    test('returns true when max > min and max > 1', () => {
      expect(isAutoscalingEnabled(0, 2)).toBe(true);
      expect(isAutoscalingEnabled(1, 3)).toBe(true);
    });

    test('handles undefined values', () => {
      expect(isAutoscalingEnabled(undefined, undefined)).toBe(false);
      expect(isAutoscalingEnabled(undefined, 2)).toBe(true);
      expect(isAutoscalingEnabled(1, undefined)).toBe(false);
    });
  });

  describe('deriveScaling', () => {
    test('adds default strategy when autoscaling enabled and no strategy present', () => {
      const result = deriveScaling({ minReplicas: 1, maxReplicas: 1 }, { maxReplicas: 3 });
      expect(result.strategy).toEqual({
        $type: SCALING_STRATEGY_TYPE.REQUESTS,
        threshold: 2,
      });
    });

    test('preserves existing strategy when autoscaling enabled', () => {
      const existing = {
        minReplicas: 1,
        maxReplicas: 3,
        strategy: { $type: SCALING_STRATEGY_TYPE.REQUESTS, threshold: 5 },
      };
      const result = deriveScaling(existing, { maxReplicas: 4 });
      expect(result.strategy?.threshold).toBe(5);
    });

    test('removes strategy when max equals min', () => {
      const existing = {
        minReplicas: 1,
        maxReplicas: 3,
        strategy: { $type: SCALING_STRATEGY_TYPE.REQUESTS, threshold: 2 },
      };
      const result = deriveScaling(existing, { maxReplicas: 1 });
      expect(result.strategy).toBeUndefined();
    });

    test('removes strategy when max is 1', () => {
      const existing = {
        minReplicas: 0,
        maxReplicas: 3,
        strategy: { $type: SCALING_STRATEGY_TYPE.REQUESTS, threshold: 2 },
      };
      const result = deriveScaling(existing, { maxReplicas: 1 });
      expect(result.strategy).toBeUndefined();
    });

    test('adds strategy when scale-to-zero with max > 1', () => {
      const result = deriveScaling({ minReplicas: 1, maxReplicas: 3 }, { minReplicas: 0 });
      expect(result.strategy).toEqual({
        $type: SCALING_STRATEGY_TYPE.REQUESTS,
        threshold: 2,
      });
    });

    test('merges updates into scaling', () => {
      const result = deriveScaling(
        { minReplicas: 1, maxReplicas: 1 },
        { maxReplicas: 5, scaleToZeroDelaySeconds: 300 },
      );
      expect(result.maxReplicas).toBe(5);
      expect(result.scaleToZeroDelaySeconds).toBe(300);
      expect(result.minReplicas).toBe(1);
    });

    test('handles undefined scaling', () => {
      const result = deriveScaling(undefined, { minReplicas: 1, maxReplicas: 3 });
      expect(result.minReplicas).toBe(1);
      expect(result.maxReplicas).toBe(3);
      expect(result.strategy).toEqual({
        $type: SCALING_STRATEGY_TYPE.REQUESTS,
        threshold: 2,
      });
    });
  });

  describe('getContainerSourceTypeLabel', () => {
    const t = (key: string, params?: Record<string, string>) => (params ? `${key}|${JSON.stringify(params)}` : key);

    test('returns Internal {type} Image key with MCP type for INTERNAL_IMAGE on McpContainers route', () => {
      const result = getContainerSourceTypeLabel(
        { $type: CONTAINER_SOURCE_TYPE.INTERNAL_IMAGE, imageDefinitionId: 'img-1' },
        ApplicationRoute.McpContainers,
        t,
      );
      expect(result).toContain(SourceI18nKey.InternalImage);
      expect(result).toContain('Entities.MCP');
    });

    test('returns Internal {type} Image key with Adapter type for INTERNAL_IMAGE on AdapterContainers route', () => {
      const result = getContainerSourceTypeLabel(
        { $type: CONTAINER_SOURCE_TYPE.INTERNAL_IMAGE, imageDefinitionId: 'img-1' },
        ApplicationRoute.AdapterContainers,
        t,
      );
      expect(result).toContain(SourceI18nKey.InternalImage);
      expect(result).toContain('Entities.Adapter');
    });

    test('returns Internal {type} Image key with Interceptor type for INTERNAL_IMAGE on InterceptorContainers route', () => {
      const result = getContainerSourceTypeLabel(
        { $type: CONTAINER_SOURCE_TYPE.INTERNAL_IMAGE, imageDefinitionId: 'img-1' },
        ApplicationRoute.InterceptorContainers,
        t,
      );
      expect(result).toContain(SourceI18nKey.InternalImage);
      expect(result).toContain('Entities.Interceptor');
    });

    test('returns DockerImage key for IMAGE_REFERENCE', () => {
      expect(
        getContainerSourceTypeLabel(
          { $type: CONTAINER_SOURCE_TYPE.IMAGE_REFERENCE, imageReference: 'foo' },
          ApplicationRoute.McpContainers,
          t,
        ),
      ).toBe(SourceI18nKey.DockerImage);
    });

    test('returns NgcRegistry key for NGC_REGISTRY', () => {
      expect(
        getContainerSourceTypeLabel(
          { $type: CONTAINER_SOURCE_TYPE.NGC_REGISTRY, imageRef: 'foo' },
          ApplicationRoute.ModelServings,
          t,
        ),
      ).toBe(SourceI18nKey.NgcRegistry);
    });

    test('returns HuggingFace key for HUGGINGFACE', () => {
      expect(
        getContainerSourceTypeLabel(
          { $type: CONTAINER_SOURCE_TYPE.HUGGINGFACE, modelName: 'foo' },
          ApplicationRoute.ModelServings,
          t,
        ),
      ).toBe(SourceI18nKey.HuggingFace);
    });

    test('returns empty string for unknown source type', () => {
      expect(
        getContainerSourceTypeLabel({ $type: 'unknown' as CONTAINER_SOURCE_TYPE }, ApplicationRoute.McpContainers, t),
      ).toBe('');
    });
  });
});
