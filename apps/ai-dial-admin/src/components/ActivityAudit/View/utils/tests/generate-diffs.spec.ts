import { EntityParameterKeys } from '@/src/components/ActivityAudit/constants';
import { DialModelEndpoint } from '@/src/models/dial/model';
import { ActivityAuditEntity, ActivityAuditResourceType, DiffStatus } from '@/src/types/activity-audit';
import { describe, expect, test } from 'vitest';
import {
  compareObjectArray,
  createSectionFromDiffs,
  fillObjectArray,
  generateCurrentResource,
  mergeEntityMaps,
} from '../generate-diffs';
import { ActivityAuditDiff } from '@/src/models/activity-audit';

describe('Activity audit :: generateCurrentResource ', () => {
  test('should return only empty properties array', () => {
    const result = generateCurrentResource(null, null);
    expect(result).toEqual({ properties: [] });
  });

  test('should return same array if current and compare are identical', () => {
    const current = { name: 'John', age: '30' };
    const compare = { name: 'John', age: '30' };
    const result = generateCurrentResource(current, compare);
    expect(result).toEqual({
      properties: [
        { parameter: 'name', value: 'John' },
        { parameter: 'age', value: '30' },
      ],
    });
  });

  test('should return an ADD and REMOVE diff if current has a key and compare does not', () => {
    const current = { name: 'John' };
    const compare = { age: '30' };
    const result = generateCurrentResource(current, compare);
    expect(result).toEqual({
      properties: [
        { parameter: 'name', value: '', diffStatus: DiffStatus.REMOVED },
        { parameter: 'age', value: '30', diffStatus: DiffStatus.ADDED },
      ],
    });
  });

  test('should return a CHANGE diff if current and compare have different values for the same key', () => {
    const current = { name: 'John', age: '30' };
    const compare = { name: 'Doe', age: '30' };
    const result = generateCurrentResource(current, compare);
    expect(result).toEqual({
      properties: [
        { parameter: 'name', value: 'Doe', diffStatus: DiffStatus.CHANGED },
        { parameter: 'age', value: '30' },
      ],
    });
  });

  test('should return diffs for multiple keys with mixed values', () => {
    const current = { name: 'John', age: '30', country: 'US' };
    const compare = { name: 'John', age: '31', city: 'NY' };
    const result = generateCurrentResource(current, compare);
    expect(result).toEqual({
      properties: [
        { parameter: 'name', value: 'John' },
        { parameter: 'age', value: '31', diffStatus: DiffStatus.CHANGED },
        { parameter: 'city', value: 'NY', diffStatus: DiffStatus.ADDED },
        { parameter: 'country', value: '', diffStatus: DiffStatus.REMOVED },
      ],
    });
  });

  test('should return values from compare if current is null', () => {
    const compare = { name: 'Doe', age: '25' };
    const result = generateCurrentResource(null, compare);
    expect(result).toEqual({
      properties: [
        { parameter: 'name', value: 'Doe' },
        { parameter: 'age', value: '25' },
      ],
    });
  });
});

describe('Activity audit :: compareObjectArray', () => {
  test('should call compareUpstreams for UPSTREAMS key', () => {
    const diffs: Record<string, ActivityAuditDiff[]> = {};
    const val1: DialModelEndpoint[] = [
      { endpoint: 'a', key: 'key1' },
      { endpoint: 'b', key: 'key2' },
    ];
    const val2: DialModelEndpoint[] = [
      { endpoint: 'b', key: 'key2' },
      { endpoint: 'c', key: 'key3' },
    ];

    compareObjectArray(diffs, EntityParameterKeys.UPSTREAMS, val1, val2);

    expect(Object.keys(diffs).length).toBe(3);
    Object.values(diffs).forEach((arr) => {
      expect(Array.isArray(arr)).toBe(true);
    });
  });

  test('should call compareDefaults for DEFAULTS key', () => {
    const diffs: Record<string, ActivityAuditDiff[]> = {};
    const val1: Record<string, unknown> = { key1: 'val1', key2: 'val2' };
    const val2: Record<string, unknown> = { key2: 'val2', key3: 'val3' };

    compareObjectArray(diffs, EntityParameterKeys.DEFAULTS, val1, val2);

    expect(Object.keys(diffs).length).toBe(3);
    Object.values(diffs).forEach((arr) => {
      expect(Array.isArray(arr)).toBe(true);
    });

    const key3Section = Object.values(diffs).find((arr) => arr.some((d) => d.value === 'val3'));
    expect(key3Section?.some((d) => d.diffStatus === DiffStatus.ADDED)).toBe(true);

    const key2Section = Object.values(diffs).find((arr) => arr.some((d) => d.value === 'val2'));
    expect(key2Section?.some((d) => d.diffStatus === undefined)).toBe(true);
  });

  test('should do nothing for unknown key', () => {
    const diffs: Record<string, ActivityAuditDiff[]> = {};
    compareObjectArray(diffs, 'UNKNOWN', [], []);

    expect(diffs).toEqual({});
  });
});

describe('Activity audit :: fillObjectArray', () => {
  test('should fill diffs for UPSTREAMS key', () => {
    const diffMap: Record<string, ActivityAuditDiff[]> = {};
    const value: DialModelEndpoint[] = [
      { endpoint: 'a', key: 'key1' },
      { endpoint: 'b', key: 'key2' },
    ];

    fillObjectArray(diffMap, EntityParameterKeys.UPSTREAMS, value);

    expect(Object.keys(diffMap).length).toBe(2);

    Object.values(diffMap).forEach((arr) => {
      expect(Array.isArray(arr)).toBe(true);
      expect(arr.length).toBeGreaterThan(0);
    });

    const sectionA = Object.values(diffMap).find((arr) => arr.some((d) => d.parameter === 'endpoint'));
    expect(sectionA).toBeDefined();
  });

  test('should fill diffs for DEFAULTS key', () => {
    const diffMap: Record<string, ActivityAuditDiff[]> = {};
    const value: Record<string, unknown> = {
      key1: 'val1',
      key2: 'val2',
    };

    fillObjectArray(diffMap, EntityParameterKeys.DEFAULTS, value);

    expect(Object.keys(diffMap).length).toBe(2);

    Object.values(diffMap).forEach((arr) => {
      expect(Array.isArray(arr)).toBe(true);
      expect(arr.length).toBeGreaterThan(0);
    });

    const sectionKey1 = Object.values(diffMap).find((arr) => arr.some((d) => d.value === 'val1'));
    expect(sectionKey1).toBeDefined();
  });

  test('should do nothing for unknown key', () => {
    const diffMap: Record<string, ActivityAuditDiff[]> = {};
    fillObjectArray(diffMap, 'UNKNOWN', []);

    expect(diffMap).toEqual({});
  });

  test('should handle empty arrays or objects', () => {
    const diffMap1: Record<string, ActivityAuditDiff[]> = {};
    fillObjectArray(diffMap1, EntityParameterKeys.UPSTREAMS, []);
    expect(diffMap1).toEqual({});

    const diffMap2: Record<string, ActivityAuditDiff[]> = {};
    fillObjectArray(diffMap2, EntityParameterKeys.DEFAULTS, {});
    expect(diffMap2).toEqual({});
  });
});

describe('Activity audit :: createSectionFromDiffs', () => {
  test('should create sections with default and role limits under ROLES', () => {
    const current: Record<string, ActivityAuditDiff[]> = {
      [EntityParameterKeys.DEFAULT_ROLE_LIMIT]: [{ parameter: 'default', value: '10' }],
      [EntityParameterKeys.ROLE_LIMITS]: [{ parameter: 'role1', value: '5' }],
    };
    const compare: Record<string, ActivityAuditDiff[]> = {
      [EntityParameterKeys.DEFAULT_ROLE_LIMIT]: [{ parameter: 'default', value: '15' }],
      [EntityParameterKeys.ROLE_LIMITS]: [{ parameter: 'role1', value: '7' }],
    };

    const result = createSectionFromDiffs(current, compare);

    expect(result[EntityParameterKeys.ROLES]).toHaveLength(2);
    expect(result[EntityParameterKeys.ROLES][0]).toEqual({
      current: current[EntityParameterKeys.DEFAULT_ROLE_LIMIT],
      compare: compare[EntityParameterKeys.DEFAULT_ROLE_LIMIT],
    });
    expect(result[EntityParameterKeys.ROLES][1]).toEqual({
      current: current[EntityParameterKeys.ROLE_LIMITS],
      compare: compare[EntityParameterKeys.ROLE_LIMITS],
    });
  });

  test('should merge limits and share limits under ROLES', () => {
    const current: Record<string, ActivityAuditDiff[]> = {
      [EntityParameterKeys.DEFAULT_ROLE_LIMIT]: [{ parameter: 'default', value: '10' }],
      [EntityParameterKeys.ROLE_LIMITS]: [{ parameter: 'role1', value: '5' }],
    };
    const compare: Record<string, ActivityAuditDiff[]> = {
      [EntityParameterKeys.DEFAULT_ROLE_LIMIT]: [{ parameter: 'default', value: '15' }],
      [EntityParameterKeys.ROLE_LIMITS]: [{ parameter: 'role1', value: '7' }],
    };

    const result = createSectionFromDiffs(current, compare);

    expect(result[EntityParameterKeys.ROLES]).toHaveLength(2);

    expect(result[EntityParameterKeys.ROLES][0]).toEqual({
      current: [...current[EntityParameterKeys.DEFAULT_ROLE_LIMIT]],
      compare: [...compare[EntityParameterKeys.DEFAULT_ROLE_LIMIT]],
    });

    expect(result[EntityParameterKeys.ROLES][1]).toEqual({
      current: [...current[EntityParameterKeys.ROLE_LIMITS]],
      compare: [...compare[EntityParameterKeys.ROLE_LIMITS]],
    });
  });

  test('should handle merging of default role limits without share limits', () => {
    const current: Record<string, ActivityAuditDiff[]> = {
      [EntityParameterKeys.DEFAULT_ROLE_LIMIT]: [{ parameter: 'default', value: '10' }],
      [EntityParameterKeys.ROLE_LIMITS]: [{ parameter: 'role1', value: '5' }],
    };
    const compare: Record<string, ActivityAuditDiff[]> = {
      [EntityParameterKeys.DEFAULT_ROLE_LIMIT]: [{ parameter: 'default', value: '15' }],
      [EntityParameterKeys.ROLE_LIMITS]: [{ parameter: 'role1', value: '7' }],
    };

    const result = createSectionFromDiffs(current, compare);

    expect(result[EntityParameterKeys.ROLES]).toHaveLength(2);
    expect(result[EntityParameterKeys.ROLES][0]).toEqual({
      current: current[EntityParameterKeys.DEFAULT_ROLE_LIMIT],
      compare: compare[EntityParameterKeys.DEFAULT_ROLE_LIMIT],
    });
    expect(result[EntityParameterKeys.ROLES][1]).toEqual({
      current: current[EntityParameterKeys.ROLE_LIMITS],
      compare: compare[EntityParameterKeys.ROLE_LIMITS],
    });
  });

  test('should create sections for UPSTREAMS keys correctly', () => {
    const current: Record<string, ActivityAuditDiff[]> = {
      upstreams1: [{ parameter: 'u1', value: 'val1' }],
      upstreams2: [{ parameter: 'u2', value: 'val2' }],
    };
    const compare: Record<string, ActivityAuditDiff[]> = {
      upstreams1: [{ parameter: 'u1', value: 'val1_changed' }],
    };

    const result = createSectionFromDiffs(current, compare);

    expect(result[EntityParameterKeys.UPSTREAMS]).toHaveLength(2);
    expect(result[EntityParameterKeys.UPSTREAMS]).toContainEqual({
      current: current['upstreams1'],
      compare: compare['upstreams1'],
    });
    expect(result[EntityParameterKeys.UPSTREAMS]).toContainEqual({
      current: current['upstreams2'],
      compare: undefined,
    });
  });

  test('should create sections for other keys when arrays exist', () => {
    const current: Record<string, ActivityAuditDiff[]> = {
      [EntityParameterKeys.PROPERTIES]: [{ parameter: 'prop1', value: 'val1' }],
      [EntityParameterKeys.FEATURES]: [],
      [EntityParameterKeys.INTERCEPTORS]: [{ parameter: 'int1', value: 'val1' }],
    };
    const compare: Record<string, ActivityAuditDiff[]> = {
      [EntityParameterKeys.PROPERTIES]: [{ parameter: 'prop1', value: 'val2' }],
      [EntityParameterKeys.FEATURES]: [{ parameter: 'feat1', value: 'valF' }],
      [EntityParameterKeys.INTERCEPTORS]: [],
    };

    const result = createSectionFromDiffs(current, compare);

    expect(result[EntityParameterKeys.PROPERTIES]).toEqual([
      { current: current[EntityParameterKeys.PROPERTIES], compare: compare[EntityParameterKeys.PROPERTIES] },
    ]);
    expect(result[EntityParameterKeys.FEATURES]).toEqual([
      { current: [], compare: compare[EntityParameterKeys.FEATURES] },
    ]);
    expect(result[EntityParameterKeys.INTERCEPTORS]).toEqual([
      { current: current[EntityParameterKeys.INTERCEPTORS], compare: [] },
    ]);
  });

  test('should omit sections if both current and compare are empty or undefined', () => {
    const current = {};
    const compare = {};
    const result = createSectionFromDiffs(current, compare);
    expect(result).toEqual({});
  });

  test('should handle edge case where ROLES section contains only roles', () => {
    const current: Record<string, ActivityAuditDiff[]> = {
      [EntityParameterKeys.ROLES]: [{ parameter: 'role1', value: 'admin' }],
    };
    const compare: Record<string, ActivityAuditDiff[]> = {
      [EntityParameterKeys.ROLES]: [{ parameter: 'role1', value: 'user' }],
    };

    const result = createSectionFromDiffs(current, compare);

    expect(result[EntityParameterKeys.ROLES]).toHaveLength(1);
    expect(result[EntityParameterKeys.ROLES][0]).toEqual({
      current: current[EntityParameterKeys.ROLES],
      compare: compare[EntityParameterKeys.ROLES],
    });
  });
});

describe('Activity audit :: mergeEntityMaps', () => {
  const entity1: ActivityAuditEntity = { name: 'User', value: 1 };
  const entity1Changed: ActivityAuditEntity = { name: 'User', value: 2 };
  const entity2: ActivityAuditEntity = { name: 'Admin', value: 3 };

  test('should mark entity as added when only in current', () => {
    const current = new Map([[ActivityAuditResourceType.MODEL, [entity1]]]);
    const previous = new Map([[ActivityAuditResourceType.MODEL, []]]);

    const result = mergeEntityMaps(current, previous, true);
    const output = result.get(ActivityAuditResourceType.MODEL)!;

    expect(output).toHaveLength(1);
    expect(output[0]).toEqual({ ...entity1, diffStatus: DiffStatus.ADDED });
  });

  test('should mark entity as removed when only in previous and isCurrent=false', () => {
    const current = new Map([[ActivityAuditResourceType.MODEL, []]]);
    const previous = new Map([[ActivityAuditResourceType.MODEL, [entity1]]]);

    const result = mergeEntityMaps(current, previous, false);
    const output = result.get(ActivityAuditResourceType.MODEL)!;

    expect(output).toHaveLength(1);
    expect(output[0]).toEqual({ diffStatus: DiffStatus.MIRROR });
  });

  test('should mark entity as changed when values differ', () => {
    const current = new Map([[ActivityAuditResourceType.MODEL, [entity1Changed]]]);
    const previous = new Map([[ActivityAuditResourceType.MODEL, [entity1]]]);

    const result = mergeEntityMaps(current, previous, true);
    const output = result.get(ActivityAuditResourceType.MODEL)!;

    expect(output).toHaveLength(1);
    expect(output[0]).toEqual({ ...entity1Changed, diffStatus: DiffStatus.CHANGED });
  });

  test('should not add status when entities are equal', () => {
    const current = new Map([[ActivityAuditResourceType.MODEL, [entity1]]]);
    const previous = new Map([[ActivityAuditResourceType.MODEL, [entity1]]]);

    const result = mergeEntityMaps(current, previous, true);
    const output = result.get(ActivityAuditResourceType.MODEL)!;

    expect(output).toHaveLength(1);
    expect(output[0]).toEqual(entity1);
  });

  test('should handle multiple resource types', () => {
    const current = new Map([
      [ActivityAuditResourceType.MODEL, [entity1]],
      [ActivityAuditResourceType.ROLE, [entity2]],
    ]);
    const previous = new Map([
      [ActivityAuditResourceType.MODEL, [entity1Changed]],
      [ActivityAuditResourceType.ROLE, []],
    ]);

    const result = mergeEntityMaps(current, previous, true);
    const modelOutput = result.get(ActivityAuditResourceType.MODEL)!;
    const roleOutput = result.get(ActivityAuditResourceType.ROLE)!;

    expect(modelOutput[0]).toEqual({ ...entity1, diffStatus: DiffStatus.CHANGED });
    expect(roleOutput[0]).toEqual({ ...entity2, diffStatus: DiffStatus.ADDED });
  });

  test('should return empty array if both inputs are null or empty', () => {
    const current = new Map([[ActivityAuditResourceType.MODEL, null]]);
    const previous = new Map([[ActivityAuditResourceType.MODEL, null]]);

    const result = mergeEntityMaps(current, previous, true);
    const output = result.get(ActivityAuditResourceType.MODEL)!;

    expect(output).toEqual([]);
  });
});

describe('Activity audit :: image entity top-level $type is suppressed', () => {
  test('does not emit a $type row at the top level for image-definition entities', () => {
    const before = { $type: 'mcp', displayName: 'GPT-4', source: { $type: 'docker', imageUri: 'foo' } };
    const after = { $type: 'mcp', displayName: 'GPT-4 turbo', source: { $type: 'docker', imageUri: 'foo' } };

    const result = generateCurrentResource(before, after, ActivityAuditResourceType.MCP_IMAGE_DEFINITION, false);

    const topLevelTypeRow = result.properties.find((d) => d.parameter === '$type' && d.value === 'mcp');
    expect(topLevelTypeRow).toBeUndefined();
    // Nested source.$type still produces a row (with value `docker`).
    const sourceTypeRow = result.properties.find((d) => d.parameter === '$type' && d.value === 'docker');
    expect(sourceTypeRow).toBeDefined();
  });

  test('keeps the top-level $type row for non-image entities', () => {
    const before = { $type: 'something', name: 'foo' };
    const after = { $type: 'something', name: 'foo' };

    const result = generateCurrentResource(before, after, ActivityAuditResourceType.MODEL, false);

    const topLevelTypeRow = result.properties.find((d) => d.parameter === '$type');
    expect(topLevelTypeRow).toBeDefined();
  });
});

describe('Activity audit :: image source normalization for MCP Registry', () => {
  test('flattens externalRegistryRef into $type=mcp-registry + packageName + version', () => {
    const before = {
      source: {
        $type: 'docker',
        externalRegistryRef: { packageName: 'qa-mcp', version: '1.0.0' },
      },
    };
    const after = {
      source: {
        $type: 'docker',
        externalRegistryRef: { packageName: 'qa-mcp', version: '1.1.0' },
      },
    };
    const result = generateCurrentResource(before, after, ActivityAuditResourceType.MCP_IMAGE_DEFINITION, false);

    const params = result.properties.map((d) => d.parameter);
    expect(params).toContain('$type');
    expect(params).toContain('packageName');
    expect(params).toContain('serverVersion');
    expect(params).not.toContain('externalRegistryRef');
    expect(params).not.toContain('imageUri');

    const typeRow = result.properties.find((d) => d.parameter === '$type');
    expect(typeRow?.value).toBe('mcp-registry');
  });

  test('returns plain docker/git source as-is when no externalRegistryRef present', () => {
    const before = { source: { $type: 'docker', imageUri: 'registry/foo:1.0' } };
    const after = { source: { $type: 'docker', imageUri: 'registry/foo:1.1' } };
    const result = generateCurrentResource(before, after, ActivityAuditResourceType.MCP_IMAGE_DEFINITION, false);
    const params = result.properties.map((d) => d.parameter);
    expect(params).toContain('$type');
    expect(params).toContain('imageUri');
    expect(params).not.toContain('packageName');
  });
});

describe('Activity audit :: image with Firewall settings section', () => {
  test('routes allowedDomains into its own section with policy + per-domain rows', () => {
    // Both sides have non-empty lists w/o wildcard → policy "Specific" (MIRROR, no status).
    const before = { displayName: 'GPT-4', allowedDomains: ['aws.com'] };
    const after = { displayName: 'GPT-4', allowedDomains: ['epam.com', 'github.com'] };

    const result = generateCurrentResource(before, after, ActivityAuditResourceType.MCP_IMAGE_DEFINITION, false);

    expect(result.properties.find((d) => d.parameter === 'allowedDomains')).toBeUndefined();
    expect(result.properties.find((d) => d.parameter === 'displayName')).toBeDefined();

    const firewallSection = result[EntityParameterKeys.ALLOWED_DOMAINS];
    expect(firewallSection).toBeDefined();
    expect(firewallSection?.[0].parameter).toBe('domainAccessPolicy');
    expect(firewallSection?.[0].diffStatus).toBeUndefined();
    const allowedDomainRows = firewallSection?.filter((d) => d.parameter === 'allowedDomain');
    expect(allowedDomainRows?.map((r) => r.value)).toEqual(['epam.com', 'github.com']);
  });

  test('policy CHANGED when one side has wildcard "*" and the other does not', () => {
    const before = { allowedDomains: ['asd.com'] };
    const after = { allowedDomains: ['*', 'asd.com'] };

    const result = generateCurrentResource(before, after, ActivityAuditResourceType.MCP_IMAGE_DEFINITION, false);

    const firewallSection = result[EntityParameterKeys.ALLOWED_DOMAINS];
    expect(firewallSection?.[0].parameter).toBe('domainAccessPolicy');
    expect(firewallSection?.[0].diffStatus).toBe(DiffStatus.CHANGED);
    // No domain rows on the After side because the wildcard hides them.
    const allowedDomainRows = firewallSection?.filter((d) => d.parameter === 'allowedDomain');
    expect(allowedDomainRows).toEqual([]);
  });

  test('image without allowedDomains key emits only Properties section', () => {
    const before = { displayName: 'GPT-4' };
    const after = { displayName: 'GPT-4-turbo' };

    const result = generateCurrentResource(before, after, ActivityAuditResourceType.MCP_IMAGE_DEFINITION, false);

    expect(result.properties).toEqual([
      { parameter: 'displayName', value: 'GPT-4-turbo', diffStatus: DiffStatus.CHANGED },
    ]);
    expect(result[EntityParameterKeys.ALLOWED_DOMAINS]).toBeUndefined();
  });
});

describe('Activity audit :: Global firewall section', () => {
  test('after side: marks added entries as ADDED and removed entries as blank-mirror', () => {
    const before: ActivityAuditEntity = { domains: ['aws.com', 'gmail.com', 'azure.com'] };
    const after: ActivityAuditEntity = { domains: ['aws.com', 'google.com', 'azure.com', 'meta.com', 'remote.com'] };

    const result = generateCurrentResource(
      before,
      after,
      ActivityAuditResourceType.IMAGE_BUILD_DOMAIN_WHITELIST,
      false,
    );

    const section = result[EntityParameterKeys.DOMAINS];
    expect(section).toBeDefined();
    expect(section?.find((d) => d.value === 'google.com')?.diffStatus).toBe(DiffStatus.ADDED);
    expect(section?.find((d) => d.value === 'meta.com')?.diffStatus).toBe(DiffStatus.ADDED);
    expect(section?.find((d) => d.value === 'remote.com')?.diffStatus).toBe(DiffStatus.ADDED);
    expect(section?.find((d) => d.value === 'aws.com')?.diffStatus).toBeUndefined();
    // gmail.com is only on the before side → after side shows a blank mirror placeholder.
    const blankMirror = section?.filter((d) => d.diffStatus === DiffStatus.MIRROR && d.value === '');
    expect(blankMirror?.length).toBeGreaterThan(0);
  });

  test('Before side: marks removed entries as REMOVED', () => {
    // isCurrent=true means val1=current (NEWER), val2=compare (OLDER).
    const newer: ActivityAuditEntity = { domains: ['aws.com', 'google.com', 'azure.com'] };
    const older: ActivityAuditEntity = { domains: ['aws.com', 'gmail.com', 'azure.com'] };

    const result = generateCurrentResource(newer, older, ActivityAuditResourceType.IMAGE_BUILD_DOMAIN_WHITELIST, true);

    const section = result[EntityParameterKeys.DOMAINS];
    expect(section?.find((d) => d.value === 'gmail.com')?.diffStatus).toBe(DiffStatus.REMOVED);
    expect(section?.find((d) => d.value === 'aws.com')?.diffStatus).toBeUndefined();
  });

  test('empty firewall snapshot emits an empty domains section', () => {
    const before: ActivityAuditEntity = { domains: [] };
    const after: ActivityAuditEntity = { domains: [] };

    const result = generateCurrentResource(
      before,
      after,
      ActivityAuditResourceType.IMAGE_BUILD_DOMAIN_WHITELIST,
      false,
    );

    expect(result[EntityParameterKeys.DOMAINS]).toEqual([]);
  });
});

describe('Activity audit :: createSectionFromDiffs surfaces firewall sections', () => {
  test('includes allowedDomains in the generated sections map', () => {
    const current: Record<string, ActivityAuditDiff[]> = {
      properties: [],
      [EntityParameterKeys.ALLOWED_DOMAINS]: [
        { parameter: 'domainAccessPolicy', value: 'Specific domains', diffStatus: DiffStatus.CHANGED },
      ],
    };
    const compare: Record<string, ActivityAuditDiff[]> = {
      properties: [],
      [EntityParameterKeys.ALLOWED_DOMAINS]: [
        { parameter: 'domainAccessPolicy', value: 'Specific domains', diffStatus: DiffStatus.CHANGED },
      ],
    };
    const sections = createSectionFromDiffs(current, compare);
    expect(sections[EntityParameterKeys.ALLOWED_DOMAINS]).toBeDefined();
  });

  test('includes domains in the generated sections map', () => {
    const current: Record<string, ActivityAuditDiff[]> = {
      properties: [],
      [EntityParameterKeys.DOMAINS]: [{ parameter: '', value: 'aws.com' }],
    };
    const compare: Record<string, ActivityAuditDiff[]> = {
      properties: [],
      [EntityParameterKeys.DOMAINS]: [{ parameter: '', value: 'aws.com' }],
    };
    const sections = createSectionFromDiffs(current, compare);
    expect(sections[EntityParameterKeys.DOMAINS]).toBeDefined();
  });
});
