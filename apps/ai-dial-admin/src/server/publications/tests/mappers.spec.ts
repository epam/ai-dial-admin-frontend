import { describe, expect, test } from 'vitest';

import { resolvePublicationResourceType } from '../mappers';
import { CoreResourceType } from '../models';
import { ResourceType } from '@/src/types/resource-type';

describe('Server :: Publications :: resolvePublicationResourceType', () => {
  test('resolves a publication carrying only SKILL to ResourceType.SKILL', () => {
    expect(resolvePublicationResourceType([CoreResourceType.SKILL])).toBe(ResourceType.SKILL);
  });

  test('SKILL is the lowest-priority type when a publication names multiple types', () => {
    expect(resolvePublicationResourceType([CoreResourceType.SKILL, CoreResourceType.FILE])).toBe(ResourceType.FILE);
    expect(resolvePublicationResourceType([CoreResourceType.SKILL, CoreResourceType.APPLICATION])).toBe(
      ResourceType.APPLICATION,
    );
  });

  test('returns undefined for an empty or missing type list', () => {
    expect(resolvePublicationResourceType([])).toBeUndefined();
    expect(resolvePublicationResourceType(undefined)).toBeUndefined();
  });
});
