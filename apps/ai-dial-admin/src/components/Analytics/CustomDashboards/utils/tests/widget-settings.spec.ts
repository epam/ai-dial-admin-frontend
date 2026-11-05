import { describe, expect, test } from 'vitest';

import { WidgetSettings, WidgetSourceKind } from '@/src/components/Analytics/CustomDashboards/models';
import { toStoredWidgetSettings } from '@/src/components/Analytics/CustomDashboards/utils/widget-settings';
import { DEFAULT_CURRENCY } from '@/src/constants/analytics/dashboards';
import { ChangeDirection, WidgetValueFormat, WidgetView } from '@/src/models/analytics/dashboard';

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
});
