import { EntityParameterKeys } from '@/src/components/ActivityAudit/constants';
import { ActivityAuditDiff } from '@/src/models/dial/activity-audit';
import { DiffStatus } from '@/src/types/activity-audit';
import { PricingType } from '@/src/models/dial/model';
import { roleLimitsKeys } from '@/src/components/ActivityAudit/View/DiffReport/utils';
import { NO_LIMITS_KEY } from '@/src/constants/role';
import { DialModelEndpoint } from '@/src/models/dial/model';
import { describe, expect, test } from 'vitest';
import {
  compareSimpleTypes,
  fillSimpleTypes,
  compareSimpleObjects,
  fillSimpleObjects,
  compareStringArray,
  fillStringArray,
  compareDefaultLimits,
  fillDefaultLimits,
  compareUpstreams,
  fillUpstreams,
  compareDefaults,
  fillDefaults,
  compareAppRunnerParameters,
  fillAppRunnerParameters,
} from '../create-complex-diffs';

describe('Activity audit :: compareSimpleTypes', () => {
  test('should push REMOVE when val1 is defined and val2 is null', () => {
    const diffs = [];
    compareSimpleTypes(diffs, 'key', 'value1', void 0);
    expect(diffs).toEqual([{ parameter: 'key', value: '', diffStatus: DiffStatus.REMOVED }]);
  });

  test('should push ADD when val1 is null and val2 is defined', () => {
    const diffs = [];
    compareSimpleTypes(diffs, 'key', void 0, 'value2');
    expect(diffs).toEqual([{ parameter: 'key', value: 'value2', diffStatus: DiffStatus.ADDED }]);
  });

  test('should push CHANGE when val1 and val2 are different', () => {
    const diffs = [];
    compareSimpleTypes(diffs, 'key', 'old', 'new');
    expect(diffs).toEqual([{ parameter: 'key', value: 'new', pairedValue: 'old', diffStatus: DiffStatus.CHANGED }]);
  });

  test('should push unchanged value when val1 and val2 are the same', () => {
    const diffs = [];
    compareSimpleTypes(diffs, 'key', 'same', 'same');
    expect(diffs).toEqual([{ parameter: 'key', value: 'same' }]);
  });

  test('should handle number types and push CHANGE if different', () => {
    const diffs = [];
    compareSimpleTypes(diffs, 'count', 1, 2);
    expect(diffs).toEqual([{ parameter: 'count', value: '2', pairedValue: '1', diffStatus: DiffStatus.CHANGED }]);
  });

  test('should handle boolean types and push CHANGE if different', () => {
    const diffs = [];
    compareSimpleTypes(diffs, 'enabled', true, false);
    expect(diffs).toEqual([
      { parameter: 'enabled', value: 'false', pairedValue: 'true', diffStatus: DiffStatus.CHANGED },
    ]);
  });

  test('should push unchanged value for boolean true === true', () => {
    const diffs = [];
    compareSimpleTypes(diffs, 'flag', true, true);
    expect(diffs).toEqual([{ parameter: 'flag', value: 'true' }]);
  });

  test('should push unchanged value for number 42 === 42', () => {
    const diffs = [];
    compareSimpleTypes(diffs, 'answer', 42, 42);
    expect(diffs).toEqual([{ parameter: 'answer', value: '42' }]);
  });
});

describe('Activity audit :: fillSimpleTypes', () => {
  test('should push string value as-is', () => {
    const diffs = [];
    fillSimpleTypes(diffs, 'name', 'John');
    expect(diffs).toEqual([{ parameter: 'name', value: 'John' }]);
  });

  test('should convert number to string', () => {
    const diffs = [];
    fillSimpleTypes(diffs, 'age', 30);
    expect(diffs).toEqual([{ parameter: 'age', value: '30' }]);
  });

  test('should convert boolean true to string', () => {
    const diffs = [];
    fillSimpleTypes(diffs, 'active', true);
    expect(diffs).toEqual([{ parameter: 'active', value: 'true' }]);
  });

  test('should convert boolean false to string', () => {
    const diffs = [];
    fillSimpleTypes(diffs, 'active', false);
    expect(diffs).toEqual([{ parameter: 'active', value: 'false' }]);
  });

  test('should push empty string when value is undefined', () => {
    const diffs = [];
    fillSimpleTypes(diffs, 'optional', undefined);
    expect(diffs).toEqual([{ parameter: 'optional', value: '' }]);
  });
});

describe('Activity audit :: compareSimpleObjects', () => {
  test('should push CHANGED for primitive difference', () => {
    const diffs: ActivityAuditDiff[] = [];
    compareSimpleObjects(diffs, { name: 'Alice' }, { name: 'Bob' });
    expect(diffs).toEqual([{ parameter: 'name', value: 'Bob', pairedValue: 'Alice', diffStatus: DiffStatus.CHANGED }]);
  });

  test('should push unchanged value when both primitives are same', () => {
    const diffs: ActivityAuditDiff[] = [];
    compareSimpleObjects(diffs, { name: 'Alice' }, { name: 'Alice' });
    expect(diffs).toEqual([{ parameter: 'name', value: 'Alice' }]);
  });

  test('should detect ADDED field (exists only in val2)', () => {
    const diffs: ActivityAuditDiff[] = [];
    compareSimpleObjects(diffs, { name: 'Alice' }, { name: 'Alice', country: 'US' });
    expect(diffs).toEqual([
      { parameter: 'country', value: 'US', diffStatus: DiffStatus.ADDED },
      { parameter: 'name', value: 'Alice' },
    ]);
  });

  test('should detect REMOVED field (exists only in val1)', () => {
    const diffs: ActivityAuditDiff[] = [];
    compareSimpleObjects(diffs, { name: 'Alice', age: 25 }, { name: 'Alice' });
    expect(diffs).toEqual([
      { parameter: 'age', value: '', diffStatus: DiffStatus.REMOVED },
      { parameter: 'name', value: 'Alice' },
    ]);
  });

  test('should handle nested object by calling compareStringArray', () => {
    const diffs: ActivityAuditDiff[] = [];
    compareSimpleObjects(diffs, { config: { enabled: true } }, { config: { enabled: false } });
    expect(diffs).toEqual([
      { parameter: 'config', value: 'enabled: false', pairedValue: 'enabled: true', diffStatus: DiffStatus.CHANGED },
    ]);
  });

  test('should handle mix of primitive and nested values', () => {
    const diffs: ActivityAuditDiff[] = [];
    compareSimpleObjects(
      diffs,
      { name: 'Alice', settings: { theme: 'dark' } },
      { name: 'Bob', settings: { theme: 'light' } },
    );

    expect(diffs).toEqual([
      { parameter: 'name', value: 'Bob', pairedValue: 'Alice', diffStatus: DiffStatus.CHANGED },
      { parameter: 'settings', value: 'theme: light', pairedValue: 'theme: dark', diffStatus: DiffStatus.CHANGED },
    ]);
  });

  test('should correctly apply isCurrent flag for added values', () => {
    const diffs: ActivityAuditDiff[] = [];
    compareSimpleObjects(diffs, {}, { key: 'value' }, true);
    expect(diffs).toEqual([{ parameter: 'key', value: 'value', diffStatus: DiffStatus.MIRROR }]);
  });

  test('should correctly apply isCurrent flag for removed values', () => {
    const diffs: ActivityAuditDiff[] = [];
    compareSimpleObjects(diffs, { key: 'value' }, {}, true);
    expect(diffs).toEqual([{ parameter: 'key', value: '', diffStatus: DiffStatus.MIRROR }]);
  });

  test('should handle empty objects gracefully', () => {
    const diffs: ActivityAuditDiff[] = [];
    compareSimpleObjects(diffs, {}, {});
    expect(diffs).toEqual([]);
  });

  test('should handle undefined objects gracefully', () => {
    const diffs: ActivityAuditDiff[] = [];
    compareSimpleObjects(diffs, undefined as any, { a: 'x' });
    expect(diffs).toEqual([{ parameter: 'a', value: 'x', diffStatus: DiffStatus.ADDED }]);
  });
});

describe('Activity audit :: fillSimpleObjects', () => {
  test('should fill diffs for all primitive keys in object', () => {
    const diffs: ActivityAuditDiff[] = [];
    const obj = { name: 'John', age: 30, active: true };

    fillSimpleObjects(diffs, obj);

    expect(diffs).toEqual([
      { parameter: 'active', value: 'true' },
      { parameter: 'age', value: '30' },
      { parameter: 'name', value: 'John' },
    ]);
  });

  test('should sort keys alphabetically before pushing', () => {
    const diffs: ActivityAuditDiff[] = [];
    const obj = { zeta: 1, alpha: 2, middle: 3 };

    fillSimpleObjects(diffs, obj);

    expect(diffs.map((d) => d.parameter)).toEqual(['alpha', 'middle', 'zeta']);
  });

  test('should handle undefined and push empty string value', () => {
    const diffs: ActivityAuditDiff[] = [];
    const obj = { optional: undefined };

    fillSimpleObjects(diffs, obj);

    expect(diffs).toEqual([{ parameter: 'optional', value: '' }]);
  });

  test('should handle numeric values correctly', () => {
    const diffs: ActivityAuditDiff[] = [];
    const obj = { id: 123 };

    fillSimpleObjects(diffs, obj);

    expect(diffs).toEqual([{ parameter: 'id', value: '123' }]);
  });

  test('should handle boolean false values correctly', () => {
    const diffs: ActivityAuditDiff[] = [];
    const obj = { enabled: false };

    fillSimpleObjects(diffs, obj);

    expect(diffs).toEqual([{ parameter: 'enabled', value: 'false' }]);
  });

  test('should push nothing for empty object', () => {
    const diffs: ActivityAuditDiff[] = [];
    fillSimpleObjects(diffs, {});
    expect(diffs).toEqual([]);
  });
});

describe('Activity audit :: compareStringArray', () => {
  const t = (str: string) => str;

  test('should push REMOVED when val1 is defined and val2 is undefined', () => {
    const diffs: ActivityAuditDiff[] = [];
    const val1 = { a: 1, b: 2 };

    compareStringArray(diffs, 'key', val1, undefined, false);

    expect(diffs[0]).toEqual({
      parameter: 'key',
      value: '',
      diffStatus: DiffStatus.REMOVED,
    });
  });

  test('should push ADDED when val1 is undefined and val2 is defined', () => {
    const diffs: ActivityAuditDiff[] = [];
    const val2 = { a: 1, b: 2 };

    compareStringArray(diffs, 'key', undefined, val2, false);

    expect(diffs[0]).toEqual({
      parameter: 'key',
      value: 'a: 1, b: 2',
      diffStatus: DiffStatus.ADDED,
    });
  });

  test('should push CHANGED when val1 and val2 are different', () => {
    const diffs: ActivityAuditDiff[] = [];
    const val1 = { a: 1, b: 2 };
    const val2 = { a: 1, b: 3 };

    compareStringArray(diffs, 'key', val1, val2, false);

    expect(diffs[0]).toEqual({
      parameter: 'key',
      value: 'a: 1, b: 3',
      pairedValue: 'a: 1, b: 2',
      diffStatus: DiffStatus.CHANGED,
    });
  });

  test('should push unchanged value when val1 and val2 serialize to the same string', () => {
    const diffs: ActivityAuditDiff[] = [];
    const val1 = { x: 'foo', y: 'bar' };
    const val2 = { x: 'foo', y: 'bar' };

    compareStringArray(diffs, 'key', val1, val2, false);

    expect(diffs[0]).toEqual({
      parameter: 'key',
      value: 'x: foo, y: bar',
    });
  });

  test('should use translator when key is PRICING', () => {
    const diffs: ActivityAuditDiff[] = [];
    const val1 = { unit: PricingType.Token, input: 0.002 };
    const val2 = { unit: PricingType.Token, input: 0.003 };

    compareStringArray(diffs, EntityParameterKeys.PRICING, val1, val2, false, t);

    expect(diffs[0].parameter).toBe(EntityParameterKeys.PRICING);
    expect(diffs[0].value).toContain('input: 3000');
    expect(diffs[0].value).toContain('ModelView.Pricing.Tokens ModelView.Pricing.PerMillion');
    expect(diffs[0].diffStatus).toBe(DiffStatus.CHANGED);
  });

  test('should push ADDED with MIRROR status if isCurrent is true', () => {
    const diffs: ActivityAuditDiff[] = [];
    const val2 = { a: 1 };

    compareStringArray(diffs, 'key', undefined, val2, true);

    expect(diffs[0]).toEqual({
      parameter: 'key',
      value: 'a: 1',
      diffStatus: DiffStatus.MIRROR,
    });
  });

  test('should push REMOVED with MIRROR status if val1 exists and val2 is undefined and isCurrent is true', () => {
    const diffs: ActivityAuditDiff[] = [];
    const val1 = { a: 1 };

    compareStringArray(diffs, 'key', val1, undefined, true);

    expect(diffs[0]).toEqual({
      parameter: 'key',
      value: '',
      diffStatus: DiffStatus.MIRROR,
    });
  });
});

describe('Activity audit :: fillStringArray', () => {
  test('should convert a normal object to string and push via fillSimpleTypes', () => {
    const diffs: any[] = [];
    const obj = { a: 1, b: 2 };

    fillStringArray(diffs, 'myKey', obj);

    expect(diffs).toHaveLength(1);
    expect(diffs[0]).toEqual({
      parameter: 'myKey',
      value: 'a: 1, b: 2',
    });
  });

  test('should handle empty object', () => {
    const diffs: any[] = [];
    fillStringArray(diffs, 'emptyKey', {});

    expect(diffs).toHaveLength(1);
    expect(diffs[0]).toEqual({
      parameter: 'emptyKey',
      value: '',
    });
  });

  test('should use translator for pricing key', () => {
    const diffs: any[] = [];
    const pricing = { unit: PricingType.Token, input: 0.002 };

    const t = (str: string) => str;
    fillStringArray(diffs, EntityParameterKeys.PRICING, pricing, t);

    expect(diffs).toHaveLength(1);
    expect(diffs[0].parameter).toBe(EntityParameterKeys.PRICING);
    expect(diffs[0].value).toContain('input: 2000');
    expect(diffs[0].value).toContain('ModelView.Pricing.Tokens ModelView.Pricing.PerMillion');
  });

  test('should handle non-pricing key even with translator', () => {
    const diffs: any[] = [];
    const obj = { x: 1, y: 2 };
    const t = (str: string) => str;

    fillStringArray(diffs, 'nonPricingKey', obj, t);

    expect(diffs[0]).toEqual({
      parameter: 'nonPricingKey',
      value: 'x: 1, y: 2',
    });
  });

  test('should handle nested object values', () => {
    const diffs: any[] = [];
    const obj = { nested: { a: 1 } };

    fillStringArray(diffs, 'nestedKey', obj);

    expect(diffs[0].parameter).toBe('nestedKey');
    expect(diffs[0].value).toContain('nested: [object Object]');
  });
});

describe('Activity audit :: compareDefaultLimits', () => {
  test('should push REMOVED when val1 has a limit and val2 is empty', () => {
    const diffs: ActivityAuditDiff[] = [];
    const val1 = { minute: '10', day: '100', week: '500', month: '2000', enabled: true };
    const val2 = {};

    compareDefaultLimits(diffs, val1, val2);

    expect(diffs.length).toBe(roleLimitsKeys.length);
    expect(
      diffs.every(
        (d) => d.diffStatus === DiffStatus.CHANGED || d.diffStatus === DiffStatus.REMOVED || d.diffStatus === undefined,
      ),
    ).toBe(true);
  });

  test('should push CHANGED when val1 is empty and val2 has limits', () => {
    const diffs: ActivityAuditDiff[] = [];
    const val1 = {};
    const val2 = { minute: '10', day: '100', week: '500', month: '2000', enabled: true };

    compareDefaultLimits(diffs, val1, val2);

    expect(diffs.length).toBe(roleLimitsKeys.length);
    expect(diffs.some((d) => d.diffStatus === DiffStatus.CHANGED)).toBe(true);
  });

  test('should push CHANGED for differing values', () => {
    const diffs: ActivityAuditDiff[] = [];
    const val1 = { minute: '10', day: '100' };
    const val2 = { minute: '15', day: '100' };

    compareDefaultLimits(diffs, val1, val2);

    const minuteDiff = diffs.find((d) => d.parameter === 'minute');
    expect(minuteDiff?.diffStatus).toBe(DiffStatus.CHANGED);

    const dayDiff = diffs.find((d) => d.parameter === 'day');
    expect(dayDiff?.diffStatus).toBeUndefined();
  });

  test('should treat missing values as NO_LIMITS_KEY', () => {
    const diffs: ActivityAuditDiff[] = [];
    const val1 = { minute: '10' };
    const val2 = { day: '50' };

    compareDefaultLimits(diffs, val1, val2);

    const minuteDiff = diffs.find((d) => d.parameter === 'minute');
    expect(minuteDiff?.value).toBe(NO_LIMITS_KEY);

    const dayDiff = diffs.find((d) => d.parameter === 'day');
    expect(dayDiff?.value).toBe('50');
  });

  test('should respect isCurrent flag (changed status)', () => {
    const diffs: ActivityAuditDiff[] = [];
    const val1 = { minute: '10' };
    const val2 = {};

    compareDefaultLimits(diffs, val1, val2, true);

    const minuteDiff = diffs.find((d) => d.parameter === 'minute');
    expect(minuteDiff?.diffStatus).toBe(DiffStatus.CHANGED);
  });
});

describe('Activity audit :: fillDefaultLimits', () => {
  test('should fill diffs for all roleLimitsKeys', () => {
    const diffs: ActivityAuditDiff[] = [];
    const value = {
      minute: '10',
      day: '100',
      week: '500',
      month: '2000',
      enabled: true,
    };

    fillDefaultLimits(diffs, value);

    expect(diffs.length).toBe(roleLimitsKeys.length);
    roleLimitsKeys.forEach((key) => {
      const diff = diffs.find((d) => d.parameter === key);
      expect(diff).toBeDefined();
      expect(diff?.value).toBe(String(value[key as keyof typeof value]));
    });
  });

  test('should use NO_LIMITS_KEY for missing values', () => {
    const diffs: ActivityAuditDiff[] = [];
    const value = {
      minute: '10',
      day: undefined,
      week: null,
      // month and enabled missing
    } as any;

    fillDefaultLimits(diffs, value);

    expect(diffs.length).toBe(roleLimitsKeys.length);
    roleLimitsKeys.forEach((key) => {
      const diff = diffs.find((d) => d.parameter === key);
      expect(diff).toBeDefined();
      if (value[key as keyof typeof value] != null) {
        expect(diff?.value).toBe(String(value[key as keyof typeof value]));
      } else {
        expect(diff?.value).toBe(NO_LIMITS_KEY);
      }
    });
  });

  test('should handle empty value object', () => {
    const diffs: ActivityAuditDiff[] = [];
    fillDefaultLimits(diffs, {} as any);

    expect(diffs.length).toBe(roleLimitsKeys.length);
    diffs.forEach((d) => {
      expect(d.value).toBe(NO_LIMITS_KEY);
    });
  });

  test('should convert boolean values to string', () => {
    const diffs: ActivityAuditDiff[] = [];
    const value = {
      enabled: true,
    } as any;

    fillDefaultLimits(diffs, value);

    const enabledDiff = diffs.find((d) => d.parameter === 'enabled');
    expect(enabledDiff?.value).toBe('true');
  });

  test('should convert number values to string', () => {
    const diffs: ActivityAuditDiff[] = [];
    const value = {
      minute: 30,
    } as any;

    fillDefaultLimits(diffs, value);

    const minuteDiff = diffs.find((d) => d.parameter === 'minute');
    expect(minuteDiff?.value).toBe('30');
  });
});

describe('Activity audit :: compareUpstreams', () => {
  const makeEndpoint = (endpoint: string, config: Partial<DialModelEndpoint> = {}): DialModelEndpoint => ({
    endpoint,
    url: `${endpoint}.com`,
    active: true,
    timeout: 1000,
    ...config,
  });

  test('should mark endpoint as REMOVED when present in val1 but not in val2', () => {
    const diffMap: Record<string, ActivityAuditDiff[]> = {};
    const val1 = [makeEndpoint('api1')];
    const val2: EntityParameterKeys[] = [];

    compareUpstreams(diffMap, val1, val2);

    const sectionKey = `${EntityParameterKeys.UPSTREAMS}0`;
    const diffs = diffMap[sectionKey];

    expect(diffs.some((d) => d.diffStatus === DiffStatus.REMOVED)).toBe(true);
    expect(diffs.every((d) => d.parameter)).toBe(true);
  });

  test('should mark endpoint as ADDED when present in val2 but not in val1', () => {
    const diffMap: Record<string, ActivityAuditDiff[]> = {};
    const val1: EntityParameterKeys[] = [];
    const val2 = [makeEndpoint('api2')];

    compareUpstreams(diffMap, val1, val2);

    const sectionKey = `${EntityParameterKeys.UPSTREAMS}0`;
    const diffs = diffMap[sectionKey];

    expect(diffs.some((d) => d.diffStatus === DiffStatus.ADDED)).toBe(true);
    expect(diffs.find((d) => d.parameter === 'endpoint')?.value).toBe('api2');
  });

  test('should compare common endpoints with changed fields and mark as CHANGED', () => {
    const diffMap: Record<string, ActivityAuditDiff[]> = {};
    const val1 = [makeEndpoint('api3', { timeout: 1000 })];
    const val2 = [makeEndpoint('api3', { timeout: 2000 })];

    compareUpstreams(diffMap, val1, val2);

    const sectionKey = `${EntityParameterKeys.UPSTREAMS}0`;
    const diffs = diffMap[sectionKey];

    expect(diffs.some((d) => d.diffStatus === DiffStatus.CHANGED)).toBe(true);
    expect(diffs.find((d) => d.parameter === 'timeout')?.value).toBe('2000');
  });

  test('should produce multiple UPSTREAMS sections for multiple endpoints', () => {
    const diffMap: Record<string, ActivityAuditDiff[]> = {};
    const val1 = [makeEndpoint('alpha'), makeEndpoint('beta')];
    const val2 = [makeEndpoint('alpha'), makeEndpoint('gamma')];

    compareUpstreams(diffMap, val1, val2);

    const keys = Object.keys(diffMap);
    expect(keys).toEqual([
      `${EntityParameterKeys.UPSTREAMS}0`,
      `${EntityParameterKeys.UPSTREAMS}1`,
      `${EntityParameterKeys.UPSTREAMS}2`,
    ]);

    Object.values(diffMap).forEach((diffs) => {
      expect(diffs.some((d) => d.parameter === 'endpoint')).toBe(true);
    });
  });

  test('should handle empty arrays without errors', () => {
    const diffMap: Record<string, ActivityAuditDiff[]> = {};
    compareUpstreams(diffMap, [], []);
    expect(diffMap).toEqual({});
  });

  test('should preserve provided isCurrent flag (mirror status)', () => {
    const diffMap: Record<string, ActivityAuditDiff[]> = {};
    const val1 = [makeEndpoint('api1')];
    const val2: EntityParameterKeys[] = [];

    compareUpstreams(diffMap, val1, val2, true);

    const sectionKey = `${EntityParameterKeys.UPSTREAMS}0`;
    expect(diffMap[sectionKey].some((d) => d.diffStatus === DiffStatus.MIRROR)).toBe(true);
  });
});

describe('Activity audit :: fillUpstreams', () => {
  const makeEndpoint = (endpoint: string, extra: Partial<DialModelEndpoint> = {}): DialModelEndpoint => ({
    endpoint,
    url: `${endpoint}.example.com`,
    active: true,
    timeout: 1000,
    ...extra,
  });

  test('should create one section per endpoint and fill its properties', () => {
    const diffMap: Record<string, ActivityAuditDiff[]> = {};
    const endpoints: DialModelEndpoint[] = [makeEndpoint('api1'), makeEndpoint('api2')];

    fillUpstreams(diffMap, endpoints);

    expect(Object.keys(diffMap)).toEqual([`${EntityParameterKeys.UPSTREAMS}0`, `${EntityParameterKeys.UPSTREAMS}1`]);

    const api1Diffs = diffMap[`${EntityParameterKeys.UPSTREAMS}0`];
    const api2Diffs = diffMap[`${EntityParameterKeys.UPSTREAMS}1`];

    expect(api1Diffs).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ parameter: 'endpoint', value: 'api1' }),
        expect.objectContaining({ parameter: 'url', value: 'api1.example.com' }),
        expect.objectContaining({ parameter: 'active', value: 'true' }),
        expect.objectContaining({ parameter: 'timeout', value: '1000' }),
      ]),
    );

    expect(api2Diffs).toEqual(
      expect.arrayContaining([expect.objectContaining({ parameter: 'endpoint', value: 'api2' })]),
    );
  });

  test('should append to an existing section instead of overwriting it', () => {
    const diffMap: Record<string, ActivityAuditDiff[]> = {
      [`${EntityParameterKeys.UPSTREAMS}0`]: [{ parameter: 'existing', value: 'keep' }],
    };

    const endpoints: DialModelEndpoint[] = [makeEndpoint('api1')];

    fillUpstreams(diffMap, endpoints);

    expect(diffMap[`${EntityParameterKeys.UPSTREAMS}0`]).toEqual(
      expect.arrayContaining([
        { parameter: 'existing', value: 'keep' },
        expect.objectContaining({ parameter: 'endpoint', value: 'api1' }),
      ]),
    );
  });

  test('should handle empty input gracefully', () => {
    const diffMap: Record<string, ActivityAuditDiff[]> = {};
    fillUpstreams(diffMap, []);
    expect(diffMap).toEqual({});
  });

  test('should correctly fill complex nested object properties', () => {
    const diffMap: Record<string, ActivityAuditDiff[]> = {};
    const endpoints = [
      makeEndpoint('nested-api', {
        config: { retries: 3, secure: true },
      }) as unknown as DialModelEndpoint,
    ];

    fillUpstreams(diffMap, endpoints);

    const diffs = diffMap[`${EntityParameterKeys.UPSTREAMS}0`];
    expect(diffs).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ parameter: 'endpoint', value: 'nested-api' }),
        expect.objectContaining({ parameter: 'url', value: 'nested-api.example.com' }),
      ]),
    );
  });
});

describe('Activity audit :: compareDefaults', () => {
  test('should push ADDED diff when key exists only in val2', () => {
    const diffMap: Record<string, ActivityAuditDiff[]> = {};
    const val1 = {};
    const val2 = { defaultKey: 'newValue' };

    compareDefaults(diffMap, 'defaults', val1, val2);

    const sectionKey = `${EntityParameterKeys.DEFAULTS}0`;
    expect(diffMap[sectionKey]).toHaveLength(3);
    expect(diffMap[sectionKey][0]).toEqual({
      parameter: 'key',
      value: 'defaultKey',
      diffStatus: DiffStatus.ADDED,
    });
  });

  test('should push REMOVED diff when key exists only in val1', () => {
    const diffMap: Record<string, ActivityAuditDiff[]> = {};
    const val1 = { defaultKey: 'oldValue' };
    const val2 = {};

    compareDefaults(diffMap, 'defaults', val1, val2);

    const sectionKey = `${EntityParameterKeys.DEFAULTS}0`;
    const diff = diffMap[sectionKey];
    expect(diff).toBeDefined();
    expect(diff[0]).toEqual({
      parameter: 'key',
      value: '',
      diffStatus: DiffStatus.REMOVED,
    });
  });

  test('should push CHANGED diff when both keys exist but values differ', () => {
    const diffMap: Record<string, ActivityAuditDiff[]> = {};
    const val1 = { defaultKey: 'oldValue' };
    const val2 = { defaultKey: 'newValue' };

    compareDefaults(diffMap, 'defaults', val1, val2);

    const sectionKey = `${EntityParameterKeys.DEFAULTS}0`;
    expect(diffMap[sectionKey]).toEqual([
      { parameter: 'key', value: 'defaultKey' },
      { parameter: 'type', value: 'string' },
      { parameter: 'value', value: 'newValue', pairedValue: 'oldValue', diffStatus: DiffStatus.CHANGED },
    ]);
  });

  test('should not push diff when both keys and values are equal', () => {
    const diffMap: Record<string, ActivityAuditDiff[]> = {};
    const val1 = { defaultKey: 'same' };
    const val2 = { defaultKey: 'same' };

    compareDefaults(diffMap, 'defaults', val1, val2);

    const sectionKey = `${EntityParameterKeys.DEFAULTS}0`;
    expect(diffMap[sectionKey]).toEqual([
      { parameter: 'key', value: 'defaultKey' },
      { parameter: 'type', value: 'string' },
      { parameter: 'value', value: 'same' },
    ]);
  });

  test('should create multiple sections for multiple default keys', () => {
    const diffMap: Record<string, ActivityAuditDiff[]> = {};
    const val1 = { first: 'A', second: 'B' };
    const val2 = { first: 'C', second: 'B' };

    compareDefaults(diffMap, 'defaults', val1, val2);

    expect(Object.keys(diffMap)).toEqual([`${EntityParameterKeys.DEFAULTS}0`, `${EntityParameterKeys.DEFAULTS}1`]);
    expect(diffMap[`${EntityParameterKeys.DEFAULTS}0`].some((d) => d.diffStatus === DiffStatus.CHANGED)).toBe(true);
    expect(diffMap[`${EntityParameterKeys.DEFAULTS}1`].some((d) => d.diffStatus === DiffStatus.CHANGED)).toBe(false);
  });

  test('should apply isCurrent flag correctly (MIRROR status)', () => {
    const diffMap: Record<string, ActivityAuditDiff[]> = {};
    const val1 = {};
    const val2 = { newKey: 'newValue' };

    compareDefaults(diffMap, 'defaults', val1, val2, true);

    const sectionKey = `${EntityParameterKeys.DEFAULTS}0`;
    expect(diffMap[sectionKey].some((d) => d.diffStatus === DiffStatus.MIRROR)).toBe(true);
  });

  test('should handle numeric and boolean defaults correctly', () => {
    const diffMap: Record<string, ActivityAuditDiff[]> = {};
    const val1 = { numberKey: 10, boolKey: true };
    const val2 = { numberKey: 15, boolKey: false };

    compareDefaults(diffMap, 'defaults', val1, val2);

    const keys = Object.keys(diffMap);
    expect(keys.length).toBe(2);
    expect(diffMap[keys[0]].some((d) => d.diffStatus === DiffStatus.CHANGED)).toBe(true);
    expect(diffMap[keys[1]].some((d) => d.diffStatus === DiffStatus.CHANGED)).toBe(true);
  });

  test('should not crash when both objects are empty', () => {
    const diffMap: Record<string, ActivityAuditDiff[]> = {};
    compareDefaults(diffMap, 'defaults', {}, {});
    expect(diffMap).toEqual({});
  });
});

describe('Activity audit :: fillDefaults', () => {
  test('should fill one DEFAULTS section with proper structure', () => {
    const diffMap: Record<string, ActivityAuditDiff[]> = {};
    const value = { defaultKey: 'value1' };

    fillDefaults(diffMap, 'defaults', value);

    const sectionKey = `${EntityParameterKeys.DEFAULTS}0`;
    expect(Object.keys(diffMap)).toContain(sectionKey);
    expect(diffMap[sectionKey]).toEqual([
      { parameter: 'key', value: 'defaultKey' },
      { parameter: 'type', value: 'string' },
      { parameter: 'value', value: 'value1' },
    ]);
  });

  test('should handle multiple default keys with correct index ordering', () => {
    const diffMap: Record<string, ActivityAuditDiff[]> = {};
    const value = { first: 'one', second: 'two', third: 'three' };

    fillDefaults(diffMap, 'defaults', value);

    expect(Object.keys(diffMap)).toEqual([
      `${EntityParameterKeys.DEFAULTS}0`,
      `${EntityParameterKeys.DEFAULTS}1`,
      `${EntityParameterKeys.DEFAULTS}2`,
    ]);

    expect(diffMap[`${EntityParameterKeys.DEFAULTS}0`][0].value).toBe('first');
    expect(diffMap[`${EntityParameterKeys.DEFAULTS}1`][0].value).toBe('second');
    expect(diffMap[`${EntityParameterKeys.DEFAULTS}2`][0].value).toBe('third');
  });

  test('should correctly detect value types (string, number, boolean)', () => {
    const diffMap: Record<string, ActivityAuditDiff[]> = {};
    const value = {
      s: 'text',
      n: 42,
      b: true,
    };

    fillDefaults(diffMap, 'defaults', value);

    const sections = Object.values(diffMap);
    const types = sections.map((diffs) => diffs.find((d) => d.parameter === 'type')?.value);
    expect(types).toEqual(['string', 'number', 'boolean']);
  });

  test('should append to existing diffMap without overwriting', () => {
    const diffMap: Record<string, ActivityAuditDiff[]> = {
      [`${EntityParameterKeys.DEFAULTS}0`]: [{ parameter: 'existing', value: 'keep' }],
    };
    const value = { newKey: 'newVal' };

    fillDefaults(diffMap, 'defaults', value);

    expect(diffMap[`${EntityParameterKeys.DEFAULTS}0`]).toEqual([
      { parameter: 'existing', value: 'keep' },
      { parameter: 'key', value: 'newKey' },
      { parameter: 'type', value: 'string' },
      { parameter: 'value', value: 'newVal' },
    ]);
  });

  test('should not crash with empty object', () => {
    const diffMap: Record<string, ActivityAuditDiff[]> = {};
    fillDefaults(diffMap, 'defaults', {});
    expect(diffMap).toEqual({});
  });
});

describe('Activity audit :: compareAppRunnerParameters', () => {
  test('should call compareSimpleTypes when key is a path key and mark CHANGED if values differ', () => {
    const diffs: ActivityAuditDiff[] = [];
    const key = 'dial:123';
    const val1 = 'oldValue';
    const val2 = 'newValue';

    compareAppRunnerParameters(diffs, key, val1, val2);

    expect(diffs).toHaveLength(1);
    expect(diffs[0]).toEqual({
      parameter: key,
      value: 'newValue',
      pairedValue: 'oldValue',
      diffStatus: DiffStatus.CHANGED,
    });
  });

  test('should call compareSimpleTypes and mark REMOVED when val2 is undefined for path key', () => {
    const diffs: ActivityAuditDiff[] = [];
    const key = 'dial:path';
    const val1 = 'value1';
    const val2 = undefined;

    compareAppRunnerParameters(diffs, key, val1, val2 as any);

    expect(diffs[0]).toEqual({
      parameter: key,
      value: '',
      diffStatus: DiffStatus.REMOVED,
    });
  });

  test('should call compareStringArray when key is not a path key and detect CHANGED', () => {
    const diffs: ActivityAuditDiff[] = [];
    const key = 'normalKey';
    const val1 = { a: 1, b: 2 };
    const val2 = { a: 1, b: 3 };

    compareAppRunnerParameters(diffs, key, val1, val2);

    expect(diffs[0].parameter).toBe(key);
    expect(diffs[0].value).toBe('a: 1, b: 3');
    expect(diffs[0].diffStatus).toBe(DiffStatus.CHANGED);
  });

  test('should detect ADDED when val1 is undefined for non-path key', () => {
    const diffs: ActivityAuditDiff[] = [];
    const key = 'objectKey';
    const val1 = undefined;
    const val2 = { a: 1 };

    compareAppRunnerParameters(diffs, key, val1 as any, val2);

    expect(diffs[0].parameter).toBe(key);
    expect(diffs[0].value).toBe('a: 1');
    expect(diffs[0].diffStatus).toBe(DiffStatus.ADDED);
  });

  test('should detect REMOVED when val2 is undefined for non-path key', () => {
    const diffs: ActivityAuditDiff[] = [];
    const key = 'objectKey';
    const val1 = { a: 1 };
    const val2 = undefined;

    compareAppRunnerParameters(diffs, key, val1, val2 as any);

    expect(diffs[0].parameter).toBe(key);
    expect(diffs[0].value).toBe('');
    expect(diffs[0].diffStatus).toBe(DiffStatus.REMOVED);
  });

  test('should push unchanged value when objects are equal', () => {
    const diffs: ActivityAuditDiff[] = [];
    const key = 'objectKey';
    const val1 = { x: 1, y: 2 };
    const val2 = { x: 1, y: 2 };

    compareAppRunnerParameters(diffs, key, val1, val2);

    expect(diffs[0]).toEqual({
      parameter: key,
      value: 'x: 1, y: 2',
    });
  });
});

describe('Activity audit :: fillAppRunnerParameters', () => {
  test('should call fillSimpleTypes when key is a path key', () => {
    const diffs: ActivityAuditDiff[] = [];
    const key = 'dial:123';
    const value = 'someValue';

    fillAppRunnerParameters(diffs, key, value);

    expect(diffs).toHaveLength(1);
    expect(diffs[0]).toEqual({
      parameter: key,
      value: 'someValue',
    });
  });

  test('should call fillStringArray when key is not a path key', () => {
    const diffs: ActivityAuditDiff[] = [];
    const key = 'myObjectKey';
    const value = { a: 1, b: 2 };

    fillAppRunnerParameters(diffs, key, value);

    expect(diffs).toHaveLength(1);
    expect(diffs[0].parameter).toBe(key);
    expect(diffs[0].value).toBe('a: 1, b: 2');
  });

  test('should handle empty object for non-path key', () => {
    const diffs: ActivityAuditDiff[] = [];
    const key = 'emptyKey';
    const value = {};

    fillAppRunnerParameters(diffs, key, value);

    expect(diffs[0]).toEqual({
      parameter: key,
      value: '',
    });
  });

  test('should handle pricing object with translator when key is PRICING', () => {
    const diffs: ActivityAuditDiff[] = [];
    const key = EntityParameterKeys.PRICING;
    const value = { unit: PricingType.Token, input: 0.002 };

    fillAppRunnerParameters(diffs, key, value);

    expect(diffs[0].parameter).toBe(key);
    expect(diffs[0].value).toContain('unit: token, input: 0.002');
  });

  test('should correctly handle a path key with empty string value', () => {
    const diffs: ActivityAuditDiff[] = [];
    const key = 'dial:path';
    const value = '';

    fillAppRunnerParameters(diffs, key, value);

    expect(diffs[0]).toEqual({
      parameter: key,
      value: '',
    });
  });

  test('should correctly handle nested objects for non-path keys', () => {
    const diffs: ActivityAuditDiff[] = [];
    const key = 'nested';
    const value = { nested: { x: 1 } };

    fillAppRunnerParameters(diffs, key, value);

    expect(diffs[0].parameter).toBe('nested');
    expect(diffs[0].value).toBe('nested: [object Object]');
  });
});
