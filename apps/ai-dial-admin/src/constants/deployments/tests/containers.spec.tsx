import { describe, test, expect, vi, beforeEach } from 'vitest';
import { ApplicationRoute } from '@/src/types/routes';
import { CreateSteps, PROBE_TYPE } from '@/src/types/deployments/containers';
import { ContainersI18nKey } from '@/src/constants/i18n';
import { AUTOSCALE_OPTIONS, CREATE_CONTAINER_STEPS, DEFAULT_PROBE_CONFIG, RESTART_REASONS } from '../containers';
import { Container } from '@/src/models/deployments/containers';

describe('CREATE_CONTAINER_STEPS', () => {
  const mockT = vi.fn((key: string, options?: Record<string, string | number>) => {
    if (options?.type) {
      return `Translated: ${key} with type: ${options.type}`;
    }
    return `Translated: ${key}`;
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('should return array with two steps', () => {
    const result = CREATE_CONTAINER_STEPS(ApplicationRoute.McpContainers, mockT);

    expect(result).toHaveLength(2);
    expect(Array.isArray(result)).toBe(true);
  });
});

describe('AUTOSCALE_OPTIONS', () => {
  const mockT = vi.fn((key: string) => `Translated: ${key}`);

  test('should return options with correct structure', () => {
    const result = AUTOSCALE_OPTIONS(mockT);

    result.forEach((option) => {
      expect(option).toHaveProperty('label');
      expect(option).toHaveProperty('value');
      expect(typeof option.label).toBe('string');
      expect(typeof option.value).toBe('string');
    });
  });
});

describe('RESTART_REASONS', () => {
  const mockT = vi.fn((key: string) => `Translated: ${key}`);

  test('should have specific restart reason keys', () => {
    const result = RESTART_REASONS(mockT);
    const keys = Object.keys(result);

    expect(keys).toContain('StartError');
    expect(keys).toContain('OOMKilled');
    expect(keys).toContain('Error');
    expect(keys).not.toContain('Success');
    expect(keys).not.toContain('Unknown');
  });
});
describe('DEFAULT_PROBE_CONFIG', () => {
  test('should return defaults + container port', () => {
    expect(DEFAULT_PROBE_CONFIG({ containerPort: 9999 } as Container)).toEqual({
      enabled: true,
      initialDelaySeconds: 0,
      failureThreshold: 3,
      periodSeconds: 10,
      timeoutSeconds: -1,
      probe: {
        path: '',
        port: 9999,
        $type: PROBE_TYPE.TCP,
      },
    });
  });
  test('should return defaults + container port', () => {
    expect(DEFAULT_PROBE_CONFIG({} as Container)).toEqual({
      enabled: true,
      initialDelaySeconds: 0,
      failureThreshold: 3,
      periodSeconds: 10,
      timeoutSeconds: -1,
      probe: {
        path: '',
        port: void 0,
        $type: PROBE_TYPE.TCP,
      },
    });
  });
});
