import { describe, expect, test } from 'vitest';

import { UnitNamespace } from '@/src/models/user-access';
import { ApplicationRoute } from '@/src/types/routes';
import { getRouteNamespace } from '@/src/utils/org-units/namespaces';

describe('getRouteNamespace', () => {
  test.each([
    [ApplicationRoute.AssetsApplications, UnitNamespace.APPLICATIONS],
    [ApplicationRoute.AssetsToolsets, UnitNamespace.TOOLSETS],
    [ApplicationRoute.Prompts, UnitNamespace.PROMPTS],
    [ApplicationRoute.Files, UnitNamespace.FILES],
    [ApplicationRoute.Skills, UnitNamespace.SKILLS],
    [ApplicationRoute.Projects, UnitNamespace.PROJECTS],
    [ApplicationRoute.Conversations, UnitNamespace.CONVERSATIONS],
    [ApplicationRoute.Publications, UnitNamespace.PUBLICATIONS],
    [ApplicationRoute.SkillPublications, UnitNamespace.PUBLICATIONS],
    [ApplicationRoute.FoldersStorage, UnitNamespace.ROLE_ASSIGNMENTS],
  ])('maps %s to %s', (route, namespace) => {
    expect(getRouteNamespace(route)).toBe(namespace);
  });

  test.each([ApplicationRoute.PlatformModels, ApplicationRoute.Models, ApplicationRoute.Home])('has no namespace for %s', (route) => {
    expect(getRouteNamespace(route)).toBeUndefined();
  });

  test('has no namespace for an unknown route string', () => {
    expect(getRouteNamespace('/nowhere')).toBeUndefined();
  });
});
