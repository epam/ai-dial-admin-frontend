import { describe, expect, test } from 'vitest';

import { AliasPresentAs, AliasTargetType } from '@/src/models/dial/alias';
import {
  ALIAS_DEFAULT_PRESENT_AS_BY_TARGET_TYPE,
  ALIAS_NAME_PATTERN,
  ALIAS_PRESENT_AS_BY_TARGET_TYPE,
  ALIAS_WRITABLE_FIELDS,
} from '@/src/constants/aliases';

describe('ALIAS_NAME_PATTERN', () => {
  test.each(['assistant-v1', 'a.b_c-1', 'A9'])('accepts %s', (name) => {
    expect(ALIAS_NAME_PATTERN.test(name)).toBe(true);
  });

  test.each(['', 'team/assistant', 'with space', 'a:b', 'a%20b', 'a[0]'])('rejects "%s"', (name) => {
    expect(ALIAS_NAME_PATTERN.test(name)).toBe(false);
  });
});

describe('present-as compatibility table', () => {
  test('matches Core: model and application targets fit model or application, toolsets only toolset', () => {
    expect([...ALIAS_PRESENT_AS_BY_TARGET_TYPE[AliasTargetType.Model]]).toEqual([
      AliasPresentAs.Model,
      AliasPresentAs.Application,
    ]);
    expect([...ALIAS_PRESENT_AS_BY_TARGET_TYPE[AliasTargetType.Application]].sort()).toEqual(
      [AliasPresentAs.Application, AliasPresentAs.Model, AliasPresentAs.Toolset].sort(),
    );
    expect([...ALIAS_PRESENT_AS_BY_TARGET_TYPE[AliasTargetType.Toolset]]).toEqual([AliasPresentAs.Toolset]);
  });

  test.each(Object.values(AliasTargetType))('the default for %s is its own first option', (type) => {
    expect(ALIAS_PRESENT_AS_BY_TARGET_TYPE[type][0]).toBe(ALIAS_DEFAULT_PRESENT_AS_BY_TARGET_TYPE[type]);
  });
});

describe('ALIAS_WRITABLE_FIELDS', () => {
  test('is exactly the ten fields Core keeps for a stored alias', () => {
    expect([...ALIAS_WRITABLE_FIELDS].sort()).toEqual(
      [
        'target',
        'presentAs',
        'userRoles',
        'defaultHeaders',
        'displayName',
        'displayVersion',
        'iconUrl',
        'description',
        'intro',
        'descriptionKeywords',
      ].sort(),
    );
  });
});
