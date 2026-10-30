import { describe, expect, test } from 'vitest';

import { ResourceAccess, ResourceDependency } from '@/src/models/dial/resource-dependency';
import { DependencyFormValues } from '../../models';
import { formatResource, toApprovedResources } from '../resources';
import {
  addDependency,
  insertDependencyAfter,
  isDeclarationDirty,
  removeDependency,
  replaceDependency,
  toDependency,
  toFormValues,
} from '../update-dependencies';

const makeDependency = (linkId: string, overrides: Partial<ResourceDependency> = {}): ResourceDependency => ({
  kind: 'dial.resourceLink',
  link_id: linkId,
  target: { path: `files/public/${linkId}/` },
  access: [ResourceAccess.Read],
  required: false,
  ...overrides,
});

describe('toDependency', () => {
  test('builds the persisted shape with trimmed text and ordered access', () => {
    const values: DependencyFormValues = {
      linkId: ' docs ',
      path: ' skills/{current-user}/ ',
      access: [ResourceAccess.Write, ResourceAccess.Read],
      isRequired: true,
    };

    expect(toDependency(values)).toEqual({
      kind: 'dial.resourceLink',
      link_id: 'docs',
      target: { path: 'skills/{current-user}/' },
      access: ['READ', 'WRITE'],
      required: true,
    });
  });
});

describe('toFormValues', () => {
  test('maps a dependency back to form values', () => {
    expect(toFormValues(makeDependency('a', { required: true, access: [ResourceAccess.Write] }))).toEqual({
      linkId: 'a',
      path: 'files/public/a/',
      access: [ResourceAccess.Write],
      isRequired: true,
    });
  });

  test('tolerates a sparse entry from hand-edited JSON', () => {
    const sparse = { link_id: 'a' } as ResourceDependency;

    expect(toFormValues(sparse)).toEqual({ linkId: 'a', path: '', access: [], isRequired: false });
  });
});

describe('list updates', () => {
  const a = makeDependency('a');
  const b = makeDependency('b');
  const c = makeDependency('c');

  test('adds to an absent declaration', () => {
    expect(addDependency(undefined, a)).toEqual([a]);
  });

  test('appends last', () => {
    expect(addDependency([a], b)).toEqual([a, b]);
  });

  test('replaces in place', () => {
    expect(replaceDependency([a, b, c], 1, c)).toEqual([a, c, c]);
  });

  test('inserts directly after the source', () => {
    const copy = makeDependency('a_copy');

    expect(insertDependencyAfter([a, b], 0, copy)).toEqual([a, copy, b]);
  });

  test('does not mutate its input', () => {
    const list = [a, b];
    insertDependencyAfter(list, 0, c);
    removeDependency(list, 0);

    expect(list).toEqual([a, b]);
  });

  test('removes a row', () => {
    expect(removeDependency([a, b], 0)).toEqual([b]);
  });

  test('returns undefined once the last row is removed', () => {
    expect(removeDependency([a], 0)).toBeUndefined();
    expect(removeDependency(undefined, 0)).toBeUndefined();
  });
});

describe('isDeclarationDirty', () => {
  test('treats absent and empty as equal', () => {
    expect(isDeclarationDirty(undefined, [])).toBe(false);
    expect(isDeclarationDirty([], undefined)).toBe(false);
  });

  test('is clean for equal content', () => {
    expect(isDeclarationDirty([makeDependency('a')], [makeDependency('a')])).toBe(false);
  });

  test('is dirty after any change, including reordering', () => {
    const a = makeDependency('a');
    const b = makeDependency('b');

    expect(isDeclarationDirty([a], [a, b])).toBe(true);
    expect(isDeclarationDirty([a, b], [b, a])).toBe(true);
    expect(isDeclarationDirty([a], [makeDependency('a', { required: true })])).toBe(true);
  });
});

describe('resources', () => {
  test('lists the saved declaration as paths with rights', () => {
    const resources = toApprovedResources([
      makeDependency('a', { access: [ResourceAccess.Read, ResourceAccess.Write] }),
    ]);

    expect(resources).toEqual([{ path: 'files/public/a/', access: ['READ', 'WRITE'] }]);
  });

  test('is empty without a declaration', () => {
    expect(toApprovedResources(undefined)).toEqual([]);
  });

  test('formats a resource with its rights, or the bare path without any', () => {
    expect(
      formatResource({ path: 'skills/{current-user}/', access: [ResourceAccess.Write, ResourceAccess.Read] }),
    ).toBe('skills/{current-user}/ (WRITE, READ)');
    expect(formatResource({ path: 'x', access: [] })).toBe('x');
  });
});
