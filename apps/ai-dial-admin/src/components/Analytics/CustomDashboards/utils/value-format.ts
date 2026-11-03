import { formatChartNumber } from '@/src/components/Analytics/Usage/utils/chart-options';
import {
  GROUPING_LOCALE,
  formatCompactNumber,
  formatDuration,
  formatGroupedMoney,
  formatGroupedNumber,
  formatMoney,
} from '@/src/components/Analytics/Usage/utils/format';
import { DEFAULT_CURRENCY } from '@/src/constants/analytics/dashboards';
import { WidgetValueFormat } from '@/src/models/analytics/dashboard';

interface Figure {
  value: string;
  unit?: string;
}

/** The currency's own sign in the page's grouping locale: `$`, `€`, `£`; the code where it has none. */
export const getCurrencySymbol = (currency: string): string =>
  new Intl.NumberFormat(GROUPING_LOCALE, { style: 'currency', currency, currencyDisplay: 'narrowSymbol' })
    .formatToParts(0)
    .find((part) => part.type === 'currency')?.value ?? currency;

/**
 * A card's figure: abbreviated, with its unit apart so the card can draw it smaller — the usage KPI card's
 * form. A plain figure under one keeps its significant digits, since compact notation rounds it to nothing.
 */
export const formatCardFigure = (
  value: number,
  format = WidgetValueFormat.Number,
  currency = DEFAULT_CURRENCY,
): Figure => {
  if (format === WidgetValueFormat.Money) {
    const symbol = getCurrencySymbol(currency);
    // Cents would round a per-turn price of 0.027 to 0.03; under one unit the significant digits stay.
    return Math.abs(value) < 1 && value !== 0
      ? { value: `${symbol}${formatChartNumber(value, 4)}` }
      : formatMoney(value, symbol);
  }
  if (format === WidgetValueFormat.Duration) return formatDuration(value);
  if (format === WidgetValueFormat.Percent) return { value: formatGroupedNumber(value, 1), unit: '%' };
  return Math.abs(value) >= 1 ? formatCompactNumber(value) : { value: formatChartNumber(value, 4) };
};

/** A figure in full, as a legend or a footnote states it: one string, unit included. */
export const formatFullFigure = (
  value: number,
  format = WidgetValueFormat.Number,
  currency = DEFAULT_CURRENCY,
): string => {
  if (format === WidgetValueFormat.Money) return formatGroupedMoney(value, getCurrencySymbol(currency));
  if (format === WidgetValueFormat.Number) return formatChartNumber(value);
  const figure = formatCardFigure(value, format, currency);
  return `${figure.value}${figure.unit ?? ''}`;
};
