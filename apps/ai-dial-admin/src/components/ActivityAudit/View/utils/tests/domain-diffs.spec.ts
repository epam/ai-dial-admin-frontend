import { describe, expect, test } from 'vitest';

import { DOMAIN_ACCESS_POLICY_KEY } from '@/src/components/ActivityAudit/constants';
import {
  compareAllowedDomains,
  compareDomains,
  fillAllowedDomains,
  fillDomains,
} from '@/src/components/ActivityAudit/View/utils/create-simple-diffs';
import { EntityFieldsI18nKey } from '@/src/constants/i18n';
import { ActivityAuditDiff } from '@/src/models/activity-audit';
import { DiffStatus } from '@/src/types/activity-audit';

describe('compareAllowedDomains :: synthesized Domain access policy row', () => {
  test('empty list -> default policy key and no domain rows', () => {
    const diffs: ActivityAuditDiff[] = [];
    compareAllowedDomains(diffs, [], [], false);
    expect(diffs).toEqual([{ parameter: DOMAIN_ACCESS_POLICY_KEY, value: EntityFieldsI18nKey.specificDomains }]);
  });

  test('missing list -> default policy key and no rows', () => {
    const diffs: ActivityAuditDiff[] = [];
    compareAllowedDomains(diffs, undefined as unknown as string[], undefined as unknown as string[], false);
    expect(diffs).toEqual([{ parameter: DOMAIN_ACCESS_POLICY_KEY, value: EntityFieldsI18nKey.specificDomains }]);
  });

  test('wildcard "*" present -> "All domains" key and no rows', () => {
    const diffs: ActivityAuditDiff[] = [];
    compareAllowedDomains(diffs, ['*'], ['*'], false);
    expect(diffs).toEqual([{ parameter: DOMAIN_ACCESS_POLICY_KEY, value: EntityFieldsI18nKey.allDomains }]);
  });

  test('wildcard alongside other entries -> still "All domains", domains hidden', () => {
    const diffs: ActivityAuditDiff[] = [];
    compareAllowedDomains(diffs, ['*', 'asd.com'], ['*', 'asd.com'], false);
    expect(diffs).toEqual([{ parameter: DOMAIN_ACCESS_POLICY_KEY, value: EntityFieldsI18nKey.allDomains }]);
  });

  test('non-empty without wildcard -> "Specific domains" key and all rows', () => {
    const diffs: ActivityAuditDiff[] = [];
    compareAllowedDomains(diffs, ['aws.com'], ['aws.com'], false);
    expect(diffs).toEqual([
      { parameter: DOMAIN_ACCESS_POLICY_KEY, value: EntityFieldsI18nKey.specificDomains },
      { parameter: 'allowedDomain', value: 'aws.com' },
    ]);
  });

  test('policy change Specific -> All marks the policy row CHANGED', () => {
    const diffs: ActivityAuditDiff[] = [];
    compareAllowedDomains(diffs, ['*', 'asd.com'], ['asd.com'], false);
    expect(diffs[0]).toMatchObject({
      parameter: DOMAIN_ACCESS_POLICY_KEY,
      value: EntityFieldsI18nKey.specificDomains,
      pairedValue: EntityFieldsI18nKey.allDomains,
      diffStatus: DiffStatus.CHANGED,
    });
  });

  test('emits one Allowed domain row per entry sorted alphabetically (no wildcard)', () => {
    const diffs: ActivityAuditDiff[] = [];
    compareAllowedDomains(diffs, ['azure.com'], ['aws.com', 'azure.com', 'github.com'], false);
    const rows = diffs.slice(1);
    expect(rows.map((r) => r.value)).toEqual(['aws.com', 'azure.com', 'github.com']);
    expect(rows[0].diffStatus).toBe(DiffStatus.ADDED);
    expect(rows[1].diffStatus).toBeUndefined();
    expect(rows[2].diffStatus).toBe(DiffStatus.ADDED);
  });

  test('removed entries on the Before side carry REMOVED status', () => {
    const diffs: ActivityAuditDiff[] = [];
    compareAllowedDomains(diffs, ['aws.com'], ['aws.com', 'gmail.com'], true);
    const removed = diffs.slice(1).find((r) => r.value === 'gmail.com');
    expect(removed?.diffStatus).toBe(DiffStatus.REMOVED);
  });
});

describe('fillAllowedDomains', () => {
  test('emits policy + one Allowed domain row per entry (no wildcard)', () => {
    const diffs: ActivityAuditDiff[] = [];
    fillAllowedDomains(diffs, ['aws.com', 'github.com']);
    expect(diffs[0]).toEqual({
      parameter: DOMAIN_ACCESS_POLICY_KEY,
      value: EntityFieldsI18nKey.specificDomains,
    });
    expect(diffs.slice(1).map((d) => d.value)).toEqual(['aws.com', 'github.com']);
  });

  test('empty list -> default "Specific domains" policy key and no rows', () => {
    const diffs: ActivityAuditDiff[] = [];
    fillAllowedDomains(diffs, []);
    expect(diffs).toEqual([{ parameter: DOMAIN_ACCESS_POLICY_KEY, value: EntityFieldsI18nKey.specificDomains }]);
  });

  test('wildcard "*" -> "All domains" policy key and no rows', () => {
    const diffs: ActivityAuditDiff[] = [];
    fillAllowedDomains(diffs, ['*']);
    expect(diffs).toEqual([{ parameter: DOMAIN_ACCESS_POLICY_KEY, value: EntityFieldsI18nKey.allDomains }]);
  });

  test('wildcard alongside other entries -> "All domains" with no rows', () => {
    const diffs: ActivityAuditDiff[] = [];
    fillAllowedDomains(diffs, ['*', 'asd.com']);
    expect(diffs).toEqual([{ parameter: DOMAIN_ACCESS_POLICY_KEY, value: EntityFieldsI18nKey.allDomains }]);
  });
});

describe('compareDomains :: bare list for the Global firewall', () => {
  test('mirrors unchanged entries', () => {
    const diffs: ActivityAuditDiff[] = [];
    compareDomains(diffs, ['aws.com', 'azure.com'], ['aws.com', 'azure.com']);
    expect(diffs).toEqual([
      { parameter: '', value: 'aws.com' },
      { parameter: '', value: 'azure.com' },
    ]);
  });

  test('marks added entries on the After side', () => {
    const diffs: ActivityAuditDiff[] = [];
    compareDomains(diffs, ['aws.com'], ['aws.com', 'google.com'], false);
    expect(diffs).toEqual([
      { parameter: '', value: 'aws.com' },
      { parameter: '', value: 'google.com', diffStatus: DiffStatus.ADDED },
    ]);
  });

  test('marks removed entries on the Before side', () => {
    const diffs: ActivityAuditDiff[] = [];
    compareDomains(diffs, ['aws.com'], ['aws.com', 'gmail.com'], true);
    const removed = diffs.find((d) => d.value === 'gmail.com');
    expect(removed?.diffStatus).toBe(DiffStatus.REMOVED);
  });

  test('handles empty -> non-empty', () => {
    const diffs: ActivityAuditDiff[] = [];
    compareDomains(diffs, [], ['aws.com'], false);
    expect(diffs).toEqual([{ parameter: '', value: 'aws.com', diffStatus: DiffStatus.ADDED }]);
  });

  test('handles non-empty -> empty', () => {
    const diffs: ActivityAuditDiff[] = [];
    compareDomains(diffs, [], ['aws.com'], true);
    expect(diffs).toEqual([{ parameter: '', value: 'aws.com', diffStatus: DiffStatus.REMOVED }]);
  });
});

describe('fillDomains', () => {
  test('emits a row per domain', () => {
    const diffs: ActivityAuditDiff[] = [];
    fillDomains(diffs, ['aws.com', 'github.com']);
    expect(diffs).toEqual([
      { parameter: '', value: 'aws.com' },
      { parameter: '', value: 'github.com' },
    ]);
  });

  test('handles empty list as a no-op', () => {
    const diffs: ActivityAuditDiff[] = [];
    fillDomains(diffs, []);
    expect(diffs).toEqual([]);
  });
});
