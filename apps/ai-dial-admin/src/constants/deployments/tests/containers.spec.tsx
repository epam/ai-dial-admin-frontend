import { describe, test, expect, vi, beforeEach } from 'vitest';
import { ApplicationRoute } from '@/src/types/routes';
import { CreateSteps } from '@/src/types/deployments/containers';
import { ContainersI18nKey } from '@/src/constants/i18n';
import { AUTOSCALE_OPTIONS, CREATE_CONTAINER_STEPS, RESTART_REASONS } from '../containers';

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
