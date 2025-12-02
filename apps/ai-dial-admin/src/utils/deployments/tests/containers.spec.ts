import { describe, expect, test, vi, beforeEach } from 'vitest';
import { getContainerTemplate, validateContainer } from '../containers';
import { ApplicationRoute } from '@/src/types/routes';
import { getPathError, getVariableNameError } from '@/src/utils/deployments/validation';
import { getErrorForName } from '@/src/utils/validation/name-error';
import { CONTAINER_TRANSPORT, CONTAINER_TYPE } from '@/src/types/deployments/containers';
import { Container } from '@/src/models/deployments/containers';

vi.mock('@/src/utils/deployments/validation');
vi.mock('@/src/utils/validation/name-error');

describe('containers utils', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('validateContainer', () => {
    const validContainer: Container = {
      name: 'valid-container',
      metadata: { envs: [] },
      mcpEndpointPath: '/valid/path',
      transport: CONTAINER_TRANSPORT.SSE,
      resources: {
        requests: { cpu: '1', memory: '1', 'nvidia.com/gpu': '1' },
        limits: { cpu: '1', memory: '1', 'nvidia.com/gpu': '1' },
      },
    } as any;

    test('returns false if name is empty', () => {
      expect(validateContainer({ ...validContainer, name: '' }, ApplicationRoute.ModelDeployments, [])).toBe(false);
    });

    test('returns false if name is duplicate', () => {
      expect(
        validateContainer({ ...validContainer, name: 'duplicate' }, ApplicationRoute.ModelDeployments, ['duplicate']),
      ).toBe(false);
    });

    test('returns false if name has error', () => {
      (getErrorForName as any).mockReturnValue('Name Error');
      expect(validateContainer(validContainer, ApplicationRoute.ModelDeployments, [])).toBe(false);
    });

    test('returns false if variables are invalid', () => {
      (getVariableNameError as any).mockReturnValue('Variable Error');
      const container = { ...validContainer, metadata: { envs: [{ name: 'invalid' }] } } as any;
      expect(validateContainer(container, ApplicationRoute.ModelDeployments, [])).toBe(false);
    });

    test('returns false if mcpEndpointPath has error', () => {
      (getPathError as any).mockReturnValue('Path Error');
      expect(validateContainer(validContainer, ApplicationRoute.ModelDeployments, [])).toBe(false);
    });

    test('returns false if transport missing for McpDeployments', () => {
      const container = { ...validContainer, transport: undefined };
      expect(validateContainer(container, ApplicationRoute.McpDeployments, [])).toBe(false);
    });

    test('returns false if resources missing for ModelDeployments', () => {
      const container = {
        ...validContainer,
        resources: { requests: { cpu: '' } }, // Missing other resources
      } as any;
      expect(validateContainer(container, ApplicationRoute.ModelDeployments, [])).toBe(false);
    });

    test('returns true for valid container', () => {
      (getErrorForName as any).mockReturnValue(null);
      (getVariableNameError as any).mockReturnValue(null);
      (getPathError as any).mockReturnValue(null);
      expect(validateContainer(validContainer, ApplicationRoute.ModelDeployments, [])).toBe(true);
    });
  });

  describe('getContainerTemplate', () => {
    test('returns template for ModelDeployments', () => {
      const template = getContainerTemplate(ApplicationRoute.ModelDeployments);
      expect(template?.$type).toBe(CONTAINER_TYPE.MODEL);
      expect(template?.resources?.requests?.['nvidia.com/gpu']).toBe('1');
    });

    test('returns template for McpDeployments', () => {
      const template = getContainerTemplate(ApplicationRoute.McpDeployments);
      expect(template?.$type).toBe(CONTAINER_TYPE.MCP);
      expect(template?.transport).toBe(CONTAINER_TRANSPORT.SSE);
    });

    test('returns template for Interceptors', () => {
      const template = getContainerTemplate(ApplicationRoute.Interceptors);
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
      const template = getContainerTemplate(ApplicationRoute.ModelDeployments, defaults);
      expect(template?.resources?.requests?.cpu).toBe('2');
      expect(template?.resources?.requests?.memory).toBe(`${4096 * 1024 * 1024}`);
    });
  });
});
