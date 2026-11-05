import { describe, expect, test } from 'vitest';

import {
  formatCardFigure,
  formatFullFigure,
  getCurrencySymbol,
} from '@/src/components/Analytics/CustomDashboards/utils/value-format';
import { WidgetValueFormat } from '@/src/models/analytics/dashboard';

describe('getCurrencySymbol', () => {
  test('reads the currency sign, or the code where it has none', () => {
    expect(getCurrencySymbol('USD')).toBe('$');
    expect(getCurrencySymbol('EUR')).toBe('€');
    expect(getCurrencySymbol('CHF')).toBe('CHF');
  });
});

describe('formatCardFigure', () => {
  test('writes money like the usage spend card, in the chosen currency', () => {
    expect(formatCardFigure(346.5, WidgetValueFormat.Money)).toEqual({ value: '$346.50' });
    expect(formatCardFigure(12_300, WidgetValueFormat.Money, 'EUR')).toEqual({ value: '€12.3', unit: 'K' });
    // A price under one unit keeps its significant digits rather than rounding to cents.
    expect(formatCardFigure(0.0273, WidgetValueFormat.Money)).toEqual({ value: '$0.0273' });
  });

  test('writes a percentage, a duration and a plain number', () => {
    expect(formatCardFigure(74.38, WidgetValueFormat.Percent)).toEqual({ value: '74.4', unit: '%' });
    expect(formatCardFigure(2800, WidgetValueFormat.Duration)).toEqual({ value: '2.8', unit: 's' });
    expect(formatCardFigure(12_900)).toEqual({ value: '12.9', unit: 'K' });
    expect(formatCardFigure(0.0267)).toEqual({ value: '0.0267' });
  });
});

describe('formatFullFigure', () => {
  test('states the figure in full with its unit in one string', () => {
    expect(formatFullFigure(1234.5, WidgetValueFormat.Money, 'GBP')).toBe('£1,234.50');
    expect(formatFullFigure(1234.567)).toBe('1,234.57');
    expect(formatFullFigure(93.6, WidgetValueFormat.Percent)).toBe('93.6%');
  });
});
