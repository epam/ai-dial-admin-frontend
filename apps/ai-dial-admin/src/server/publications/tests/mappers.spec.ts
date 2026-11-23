import { describe, expect, test } from 'vitest';

import { RuleFunction } from '@/src/models/dial/rule';
import { PublicationStatus } from '@/src/models/dial/publications';
import { mapRules, resolvePublicationResourceType, toListedPublication } from '../mappers';
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

  test('resolves a publication carrying only PROJECT to ResourceType.PROJECT', () => {
    expect(resolvePublicationResourceType([CoreResourceType.PROJECT])).toBe(ResourceType.PROJECT);
  });

  test('PROJECT is the lowest-priority type, after SKILL', () => {
    expect(resolvePublicationResourceType([CoreResourceType.PROJECT, CoreResourceType.SKILL])).toBe(ResourceType.SKILL);
    expect(resolvePublicationResourceType([CoreResourceType.PROJECT, CoreResourceType.FILE])).toBe(ResourceType.FILE);
  });

  test('returns undefined for an empty or missing type list', () => {
    expect(resolvePublicationResourceType([])).toBeUndefined();
    expect(resolvePublicationResourceType(undefined)).toBeUndefined();
  });
});

describe('Server :: Publications :: toListedPublication', () => {
  test('keeps every field and types the url and status', () => {
    expect(toListedPublication({ url: 'publications/a', status: 'PENDING', name: 'A', author: 'me' })).toEqual({
      url: 'publications/a',
      status: PublicationStatus.PENDING,
      name: 'A',
      author: 'me',
    });
  });

  test.each([
    ['url', { status: 'PENDING' as const }],
    ['status', { url: 'publications/a' }],
  ])('returns undefined for a publication without a %s', (_, publication) => {
    expect(toListedPublication(publication)).toBeUndefined();
  });
});

describe('Server :: Publications :: mapRules', () => {
  test('returns undefined when Core sent no rules', () => {
    expect(mapRules(undefined)).toBeUndefined();
  });

  test('passes an unknown function and a missing source or targets through, with no default', () => {
    const rules = mapRules([
      { source: 'title', function: 'EQUAL', targets: ['x'] },
      { source: 'role', function: 'UNKNOWN' as never },
      { function: 'TRUE' },
    ]);

    expect(rules).toEqual([
      { source: 'title', function: RuleFunction.EQUAL, targets: ['x'] },
      { source: 'role', function: 'UNKNOWN', targets: undefined },
      { source: undefined, function: 'TRUE', targets: undefined },
    ]);
  });
});
