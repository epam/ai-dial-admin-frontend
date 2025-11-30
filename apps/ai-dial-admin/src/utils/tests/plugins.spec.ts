import { describe, test, expect } from 'vitest';
import { isDeploymentsEnabled } from '../plugins';

describe('isDeploymentsEnabled', () => {
  test('returns true if mcp-plugin is present', () => {
    const embeddedApps = [{ name: 'other-plugin' }, { name: 'mcp-plugin' }];
    expect(isDeploymentsEnabled(embeddedApps as any)).toBe(true);
  });

  test('returns false if mcp-plugin is not present', () => {
    const embeddedApps = [{ name: 'other-plugin' }, { name: 'another-plugin' }];
    expect(isDeploymentsEnabled(embeddedApps as any)).toBe(false);
  });

  test('returns false for empty array', () => {
    expect(isDeploymentsEnabled([])).toBe(false);
  });
});
