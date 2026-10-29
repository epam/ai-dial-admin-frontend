import { describe, expect, test } from 'vitest';

import { ResourceType } from '@/src/types/resource-type';
import { PROJECTS_PREFIX, RESOURCE_TYPE_PREFIX, SKILLS_PREFIX } from '../publications-core';

describe('RESOURCE_TYPE_PREFIX', () => {
  test('maps every ResourceType to its Core URL prefix', () => {
    Object.values(ResourceType).forEach((type) => {
      expect(RESOURCE_TYPE_PREFIX[type]).toBeTruthy();
    });
  });

  test('maps PROJECT to the projects/ prefix', () => {
    expect(RESOURCE_TYPE_PREFIX[ResourceType.PROJECT]).toBe(PROJECTS_PREFIX);
    expect(PROJECTS_PREFIX).toBe('projects/');
  });

  test('maps SKILL to the skills/ prefix', () => {
    expect(RESOURCE_TYPE_PREFIX[ResourceType.SKILL]).toBe(SKILLS_PREFIX);
    expect(SKILLS_PREFIX).toBe('skills/');
  });
});
