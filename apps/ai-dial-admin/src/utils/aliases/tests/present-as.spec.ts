import { describe, expect, test } from 'vitest';

import { AliasPresentAs, AliasTargetType } from '@/src/models/dial/alias';
import { getAliasDefaultPresentAs, getAliasPresentAsOptions, toStoredPresentAs } from '../present-as';

describe('getAliasPresentAsOptions', () => {
  test('offers a toolset target only the toolset presentation', () => {
    expect(getAliasPresentAsOptions(AliasTargetType.Toolset)).toEqual([AliasPresentAs.Toolset]);
  });

  test('offers an application target all three, with its own type first', () => {
    expect(getAliasPresentAsOptions(AliasTargetType.Application)).toEqual([
      AliasPresentAs.Application,
      AliasPresentAs.Model,
      AliasPresentAs.Toolset,
    ]);
  });

  test('offers a model target model or application, never toolset', () => {
    expect(getAliasPresentAsOptions(AliasTargetType.Model)).toEqual([AliasPresentAs.Model, AliasPresentAs.Application]);
  });

  test('offers a router target router, model or application, never toolset', () => {
    expect(getAliasPresentAsOptions(AliasTargetType.Router)).toEqual([
      AliasPresentAs.Router,
      AliasPresentAs.Model,
      AliasPresentAs.Application,
    ]);
  });

  test.each([AliasTargetType.Model, AliasTargetType.Application, AliasTargetType.Toolset])(
    'never offers the router presentation to a %s target',
    (type) => {
      expect(getAliasPresentAsOptions(type)).not.toContain(AliasPresentAs.Router);
    },
  );
});

describe('getAliasDefaultPresentAs', () => {
  test.each([
    [AliasTargetType.Model, AliasPresentAs.Model],
    [AliasTargetType.Application, AliasPresentAs.Application],
    [AliasTargetType.Toolset, AliasPresentAs.Toolset],
    [AliasTargetType.Router, AliasPresentAs.Router],
  ])('is the own type of a %s target', (type, expected) => {
    expect(getAliasDefaultPresentAs(type)).toBe(expected);
  });
});

describe('toStoredPresentAs', () => {
  test('does not write the default, so a plain alias stays a plain body', () => {
    expect(toStoredPresentAs(AliasTargetType.Application, AliasPresentAs.Application)).toBeUndefined();
  });

  test('writes a choice that differs from the default', () => {
    expect(toStoredPresentAs(AliasTargetType.Application, AliasPresentAs.Toolset)).toBe(AliasPresentAs.Toolset);
  });

  test('drops a choice the target type does not allow instead of sending it to Core', () => {
    expect(toStoredPresentAs(AliasTargetType.Toolset, AliasPresentAs.Model)).toBeUndefined();
  });

  test('writes a router target shown as a model, and drops the router presentation from a model target', () => {
    expect(toStoredPresentAs(AliasTargetType.Router, AliasPresentAs.Model)).toBe(AliasPresentAs.Model);
    expect(toStoredPresentAs(AliasTargetType.Router, AliasPresentAs.Router)).toBeUndefined();
    expect(toStoredPresentAs(AliasTargetType.Model, AliasPresentAs.Router)).toBeUndefined();
  });

  test('writes nothing when nothing was chosen', () => {
    expect(toStoredPresentAs(AliasTargetType.Model, undefined)).toBeUndefined();
  });
});
