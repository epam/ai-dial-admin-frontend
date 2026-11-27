import { describe, expect, test } from 'vitest';

import {
  getAssetApplicationDeploymentId,
  getPlatformModelDeploymentId,
} from '@/src/components/TryOut/Deployment/utils/get-asset-deployment-id';

describe('getAssetApplicationDeploymentId', () => {
  test('prefixes the bucket-qualified Core path with applications/', () => {
    expect(getAssetApplicationDeploymentId({ name: 'app', _metadata: { path: 'public/team/app__1.0.0' } })).toBe(
      'applications/public/team/app__1.0.0',
    );
  });

  test('uses the short name of a platform application', () => {
    expect(getAssetApplicationDeploymentId({ name: 'app', _metadata: { path: 'platform/app' } })).toBe('app');
  });

  test('derives the name from a platform path when the entity has none', () => {
    expect(getAssetApplicationDeploymentId({ _metadata: { path: 'platform/app' } })).toBe('app');
  });

  test('falls back to the name for an application with no Core path', () => {
    expect(getAssetApplicationDeploymentId({ name: 'config-app' })).toBe('config-app');
    expect(getAssetApplicationDeploymentId({ name: 'config-app', _metadata: {} })).toBe('config-app');
  });

  test('is empty when there is neither a path nor a name', () => {
    expect(getAssetApplicationDeploymentId({})).toBe('');
  });
});

describe('getPlatformModelDeploymentId', () => {
  test('is the short name of the model', () => {
    expect(getPlatformModelDeploymentId('gpt-4')).toBe('gpt-4');
  });
});
