import { describe, expect, test } from 'vitest';

import { WidgetSettings, WidgetSourceKind } from '@/src/components/Analytics/CustomDashboards/models';
import {
  toStoredWidgetSettings,
  toWidgetViewPatch,
} from '@/src/components/Analytics/CustomDashboards/utils/widget-settings';
import { DEFAULT_CURRENCY } from '@/src/constants/analytics/dashboards';
import { ChangeDirection, WidgetValueFormat, WidgetView } from '@/src/models/analytics/dashboard';
import { ChartType } from '@/src/models/analytics/query-builder';

const form = (patch: Partial<WidgetSettings> = {}): WidgetSettings => ({
  source: WidgetSourceKind.SavedQuery,
  savedQueryId: 'q1',
  sql: '',
  title: '',
  description: '',
  rowCount: '100',
  view: WidgetView.SingleValue,
  valueColumn: '',
  changeDirection: ChangeDirection.HigherIsBetter,
  valueFormat: WidgetValueFormat.Number,
  currency: DEFAULT_CURRENCY,
  ...patch,
});

describe('toStoredWidgetSettings', () => {
  test('stores a money format with its currency', () => {
    expect(toStoredWidgetSettings(undefined, form({ valueFormat: WidgetValueFormat.Money, currency: 'EUR' }))).toEqual({
      value_format: WidgetValueFormat.Money,
      currency: 'EUR',
    });
  });

  test('stores no settings for a plain number in US dollars', () => {
    expect(toStoredWidgetSettings(undefined, form())).toBeUndefined();
    expect(toStoredWidgetSettings(undefined, form({ valueFormat: WidgetValueFormat.Money }))).toEqual({
      value_format: WidgetValueFormat.Money,
    });
  });

  test('drops the format of a view that does not show one', () => {
    expect(
      toStoredWidgetSettings(
        { value_format: WidgetValueFormat.Percent },
        form({ view: WidgetView.Table, valueFormat: WidgetValueFormat.Percent }),
      ),
    ).toBeUndefined();
  });

  test('keeps the members it does not set', () => {
    expect(
      toStoredWidgetSettings(
        { value_format: WidgetValueFormat.Money, currency: 'EUR', pinned: true },
        form({ view: WidgetView.Share, valueFormat: WidgetValueFormat.Duration }),
      ),
    ).toEqual({ value_format: WidgetValueFormat.Duration, pinned: true });
  });

  test('keeps a picked chart in the settings and drops it for any other view', () => {
    expect(toStoredWidgetSettings(undefined, form({ view: WidgetView.BarChart }))).toEqual({
      chart: { type: ChartType.Bar },
    });
    expect(
      toStoredWidgetSettings({ chart: { type: ChartType.Bar } }, form({ view: WidgetView.Table })),
    ).toBeUndefined();
  });
});

describe('toWidgetViewPatch', () => {
  test('keeps a picked chart in the settings, with no view', () => {
    expect(toWidgetViewPatch(form({ view: WidgetView.BarChart }), undefined, WidgetView.Table, false)).toEqual({
      view: undefined,
      settings: { chart: { type: ChartType.Bar } },
    });
  });

  test('keeps an unset view unset while its resolved view is submitted unchanged', () => {
    expect(toWidgetViewPatch(form({ view: WidgetView.BarChart }), undefined, WidgetView.BarChart, true)).toEqual({
      view: undefined,
      settings: undefined,
    });
    expect(toWidgetViewPatch(form({ view: WidgetView.Table }), undefined, WidgetView.Table, true)).toEqual({
      view: undefined,
      settings: undefined,
    });
  });

  test("clears a stored chart when the query's view is picked", () => {
    expect(
      toWidgetViewPatch(
        form({ view: WidgetView.Query }),
        { chart: { type: ChartType.Line } },
        WidgetView.LineChart,
        false,
      ),
    ).toEqual({ view: undefined, settings: undefined });
  });

  test('stores a picked service view as the view', () => {
    expect(toWidgetViewPatch(form({ view: WidgetView.Table }), undefined, WidgetView.Query, false)).toEqual({
      view: WidgetView.Table,
      settings: undefined,
    });
  });
});
