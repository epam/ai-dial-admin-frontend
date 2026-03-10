import { describe, test, expect } from 'vitest';
import { formatDeploymentImageName } from '../deployments';

describe('Utils :: formatDeploymentImageName', () => {
  test('returns formatted name when name and version provided', () => {
    const result = formatDeploymentImageName({
      imageDefinitionName: 'my-image',
      imageDefinitionVersion: '1.2.3',
    });

    expect(result).toBe('my-image (1.2.3)');
  });

  test('returns null when imageDefinitionName is empty', () => {
    const result = formatDeploymentImageName({
      imageDefinitionName: '',
      imageDefinitionVersion: '1.2.3',
    });

    expect(result).toBeNull();
  });

  test('returns null when imageDefinitionVersion is empty', () => {
    const result = formatDeploymentImageName({
      imageDefinitionName: 'my-image',
      imageDefinitionVersion: '',
    });

    expect(result).toBeNull();
  });

  test('returns null when both name and version are empty', () => {
    const result = formatDeploymentImageName({
      imageDefinitionName: '',
      imageDefinitionVersion: '',
    });

    expect(result).toBeNull();
  });
});
