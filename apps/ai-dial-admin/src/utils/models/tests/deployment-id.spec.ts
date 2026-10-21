import { describe, expect, test } from 'vitest';

import { ApplicationRoute } from '@/src/types/routes';
import { isEntitiesWithDisplayVersion } from '@/src/utils/is-view';
import { getModelDeploymentId } from '../deployment-id';

describe('Models Utils :: getModelDeploymentId', () => {
  test('Should return the bare resource name, since Core keys models by short name', () => {
    expect(getModelDeploymentId('gpt-4')).toBe('gpt-4');
  });

  test('Should not alter a name that already contains dots or dashes', () => {
    expect(getModelDeploymentId('gpt-4.1-mini')).toBe('gpt-4.1-mini');
  });

  test.each([undefined, ''])('Should return an empty string for %s rather than a bare prefix', (name) => {
    expect(getModelDeploymentId(name)).toBe('');
  });
});

/**
 * Pins the decision behind task 11.6: the entity surfaces treat display name + version as a unique
 * deployment identity, enforced against a names list. DIAL Core identifies a model resource by its
 * resource name instead and permits duplicate display names, so this view must not inherit that rule.
 */
describe('Model asset :: display identity is not the entity uniqueness rule', () => {
  test('Should not classify the model asset view as display-version-identified', () => {
    expect(isEntitiesWithDisplayVersion(ApplicationRoute.PlatformModels)).toBe(false);
  });

  test.each([ApplicationRoute.Models, ApplicationRoute.Applications])(
    'Should keep %s display-version-identified',
    (view) => {
      expect(isEntitiesWithDisplayVersion(view)).toBe(true);
    },
  );
});
