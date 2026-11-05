import { describe, expect, test } from 'vitest';

import { ComparePeriod } from '@/src/components/Analytics/Usage/models';
import { DEFAULT_TIME_PERIOD } from '@/src/constants/global-time-filter';
import { Dashboard, DashboardVisibility } from '@/src/models/analytics/dashboard';
import { SavedQueryTimeMode } from '@/src/models/analytics/saved-query';
import {
  getDashboardHref,
  isSameDashboardRequest,
  newDashboardRequest,
  toDashboardRequest,
  toDashboardTime,
  toTimeFilterValue,
} from '@/src/utils/analytics/dashboard-request';

const dashboard: Dashboard = {
  id: 'd1',
  name: 'Ops',
  description: 'Weekly',
  visibility: DashboardVisibility.Private,
  time: { mode: SavedQueryTimeMode.Relative, period: '7d' },
  widgets: [],
  generation: 3,
  created_at: '2026-10-01T00:00:00.000Z',
  updated_at: '2026-10-02T00:00:00.000Z',
  permissions: { write: true, publish: true },
};

describe('newDashboardRequest', () => {
  test('starts empty over the usage dashboard default period', () => {
    expect(newDashboardRequest('Ops', 'Weekly')).toEqual({
      name: 'Ops',
      description: 'Weekly',
      time: { mode: SavedQueryTimeMode.Relative, period: DEFAULT_TIME_PERIOD },
      visibility: DashboardVisibility.Private,
      compare: ComparePeriod.Off,
      widgets: [],
    });
  });

  test('creates a public dashboard when asked', () => {
    expect(newDashboardRequest('Ops', '', ComparePeriod.Off, DashboardVisibility.Public).visibility).toBe(
      DashboardVisibility.Public,
    );
  });

  test('leaves an empty description out', () => {
    expect(newDashboardRequest('Ops', '').description).toBeUndefined();
  });

  test('opens with the compare chosen at creation', () => {
    expect(newDashboardRequest('Ops', '', ComparePeriod.PreviousMonth).compare).toBe(ComparePeriod.PreviousMonth);
  });
});

describe('toDashboardRequest', () => {
  test('keeps only the members a caller writes', () => {
    expect(toDashboardRequest(dashboard)).toEqual({
      name: 'Ops',
      description: 'Weekly',
      time: dashboard.time,
      visibility: DashboardVisibility.Private,
      compare: ComparePeriod.Off,
      widgets: [],
    });
  });

  test('carries the stored settings, so a replace does not remove them', () => {
    const settings = { theme: 'dark', refresh: { seconds: 60 } };

    expect(toDashboardRequest({ ...dashboard, settings }).settings).toEqual(settings);
    expect(toDashboardRequest(dashboard)).not.toHaveProperty('settings');
  });

  test('carries a public visibility', () => {
    expect(toDashboardRequest({ ...dashboard, visibility: DashboardVisibility.Public }).visibility).toBe(
      DashboardVisibility.Public,
    );
  });

  test('keeps a stored compare choice', () => {
    expect(toDashboardRequest({ ...dashboard, compare: ComparePeriod.PreviousMonth }).compare).toBe(
      ComparePeriod.PreviousMonth,
    );
  });
});

describe('isSameDashboardRequest', () => {
  test('treats an absent and an empty description as the same', () => {
    const visibility = DashboardVisibility.Private;
    expect(
      isSameDashboardRequest(
        { name: 'Ops', visibility, widgets: [] },
        { name: 'Ops', description: '', visibility, widgets: [] },
      ),
    ).toBe(true);
  });

  test('tells a visibility change apart', () => {
    const base = toDashboardRequest(dashboard);
    expect(isSameDashboardRequest(base, { ...base, visibility: DashboardVisibility.Public })).toBe(false);
  });

  test('tells a moved widget apart', () => {
    const base = toDashboardRequest({
      ...dashboard,
      widgets: [{ id: 'w', saved_query_id: 'q', row_limit: 100, layout: { x: 0, y: 0, w: 6, h: 4 } }],
    });
    const moved = { ...base, widgets: [{ ...base.widgets[0], layout: { x: 6, y: 0, w: 6, h: 4 } }] };
    expect(isSameDashboardRequest(base, moved)).toBe(false);
  });
});

describe('toTimeFilterValue', () => {
  test('returns the preset of a relative intent', () => {
    expect(toTimeFilterValue({ mode: SavedQueryTimeMode.Relative, period: '7d' })).toBe('7d');
  });

  test('returns the range of an absolute intent', () => {
    expect(
      toTimeFilterValue({
        mode: SavedQueryTimeMode.Absolute,
        from: '2026-10-01T00:00:00.000Z',
        to: '2026-10-02T00:00:00.000Z',
      }),
    ).toEqual({ startDate: new Date('2026-10-01T00:00:00.000Z'), endDate: new Date('2026-10-02T00:00:00.000Z') });
  });

  test('falls back to the default period without an intent', () => {
    expect(toTimeFilterValue()).toBe(DEFAULT_TIME_PERIOD);
  });
});

describe('toDashboardTime', () => {
  const range = { startDate: new Date('2026-10-01T00:00:00.000Z'), endDate: new Date('2026-10-02T00:00:00.000Z') };

  test('stores a preset as a relative intent', () => {
    expect(toDashboardTime('24h', range, false)).toEqual({ mode: SavedQueryTimeMode.Relative, period: '24h' });
  });

  test('stores a custom range as its two instants', () => {
    expect(toDashboardTime('', range, true)).toEqual({
      mode: SavedQueryTimeMode.Absolute,
      from: '2026-10-01T00:00:00.000Z',
      to: '2026-10-02T00:00:00.000Z',
    });
  });
});

describe('getDashboardHref', () => {
  test('addresses a dashboard by its encoded id', () => {
    expect(getDashboardHref('a b')).toBe('/dashboards/a%20b');
  });

  test('opens a dashboard in edit mode on request', () => {
    expect(getDashboardHref('d1', true)).toBe('/dashboards/d1?edit=1');
  });
});
