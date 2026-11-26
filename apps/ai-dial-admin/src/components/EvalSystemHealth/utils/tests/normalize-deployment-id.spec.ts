import { describe, expect, test } from 'vitest';

import { normalizeDeploymentId } from '@/src/components/EvalSystemHealth/utils/normalize-deployment-id';

describe('normalizeDeploymentId', () => {
  test('leaves a plain id as it is', () => {
    expect(normalizeDeploymentId('gpt-4o')).toBe('gpt-4o');
  });

  test('decodes each URI-encoded segment of a path id', () => {
    expect(normalizeDeploymentId('applications/bucket/Code%20Apps')).toBe('applications/bucket/Code Apps');
  });

  test('makes an encoded id and the same id written plain equal', () => {
    expect(normalizeDeploymentId('Code%20Apps')).toBe(normalizeDeploymentId('Code Apps'));
  });

  test('keeps an id that is not valid percent-encoding', () => {
    expect(normalizeDeploymentId('100%')).toBe('100%');
  });
});
