import { describe, expect, test } from 'vitest';

import { BreakdownRow, BreakdownTab, RouteKind } from '@/src/components/Analytics/Usage/models';
import { EMPTY_MEASURES } from '@/src/components/Analytics/Usage/utils/folds';
import { getRouteKind, getRowRouteOwner } from '@/src/components/Analytics/Usage/utils/routes';

const row = (overrides: Partial<BreakdownRow>): BreakdownRow => ({
  id: 'id',
  label: 'label',
  isFallbackLabel: false,
  measures: EMPTY_MEASURES,
  ...overrides,
});

describe('getRouteKind', () => {
  test('reads an owner built from a path as a global route', () => {
    expect(getRouteKind('/proxy')).toBe(RouteKind.Global);
  });

  test('reads a deployment name, bucket path included, as an application route', () => {
    expect(getRouteKind('eval-metrics')).toBe(RouteKind.Application);
    expect(getRouteKind('applications/public/scheduler__1.0.0')).toBe(RouteKind.Application);
  });
});

describe('getRowRouteOwner', () => {
  test("reads an owner row's own value", () => {
    expect(getRowRouteOwner(BreakdownTab.Owners, row({ label: 'app-a' }))).toBe('app-a');
  });

  test("reads a path row's lead qualifier", () => {
    expect(getRowRouteOwner(BreakdownTab.Paths, row({ qualifiers: ['/proxy', 'POST'] }))).toBe('/proxy');
  });

  test('names no owner for a fallback row or a tab that states no kind', () => {
    expect(getRowRouteOwner(BreakdownTab.Owners, row({ isFallbackLabel: true, label: '' }))).toBeNull();
    expect(getRowRouteOwner(BreakdownTab.Paths, row({}))).toBeNull();
    expect(getRowRouteOwner(BreakdownTab.Callers, row({ label: 'app-a' }))).toBeNull();
  });
});
