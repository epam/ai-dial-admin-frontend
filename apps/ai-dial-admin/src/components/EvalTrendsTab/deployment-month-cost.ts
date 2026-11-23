import { hasRunCostFigure, sumRunCostParts } from '@/src/components/Runs/Summary/utils';
import { DeploymentCosts } from '@/src/models/evaluation/run';

const GROUPING_LOCALE = 'en-US';

export interface MonthCostPeriod {
  fromMs: number;
  toMs: number;
  /** `DD - DD Mon, YYYY` in en-US (e.g. `01 - 09 Nov, 2026`). */
  label: string;
}

export interface MonthCostWindows {
  current: MonthCostPeriod;
  previous: MonthCostPeriod;
}

const endOfLocalDay = (year: number, monthIndex: number, day: number): Date =>
  new Date(year, monthIndex, day, 23, 59, 59, 999);

const startOfLocalDay = (year: number, monthIndex: number, day: number): Date =>
  new Date(year, monthIndex, day, 0, 0, 0, 0);

const formatPeriodLabel = (from: Date, to: Date): string => {
  const startDay = String(from.getDate()).padStart(2, '0');
  const endDay = String(to.getDate()).padStart(2, '0');
  const month = to.toLocaleString(GROUPING_LOCALE, { month: 'short' });
  return `${startDay} - ${endDay} ${month}, ${to.getFullYear()}`;
};

/**
 * Local-calendar month-to-date window and the matching span in the previous month.
 * Previous end day is clamped when the current day does not exist last month (31 Mar → 28/29 Feb).
 */
export const buildMonthCostWindows = (now: Date): MonthCostWindows => {
  const year = now.getFullYear();
  const month = now.getMonth();
  const day = now.getDate();

  const currentFrom = startOfLocalDay(year, month, 1);
  const currentTo = endOfLocalDay(year, month, day);

  const previousMonthAnchor = new Date(year, month - 1, 1);
  const prevYear = previousMonthAnchor.getFullYear();
  const prevMonth = previousMonthAnchor.getMonth();
  const lastDayPrev = new Date(prevYear, prevMonth + 1, 0).getDate();
  const previousDay = Math.min(day, lastDayPrev);

  const previousFrom = startOfLocalDay(prevYear, prevMonth, 1);
  const previousTo = endOfLocalDay(prevYear, prevMonth, previousDay);

  return {
    current: {
      fromMs: currentFrom.getTime(),
      toMs: currentTo.getTime(),
      label: formatPeriodLabel(currentFrom, currentTo),
    },
    previous: {
      fromMs: previousFrom.getTime(),
      toMs: previousTo.getTime(),
      label: formatPeriodLabel(previousFrom, previousTo),
    },
  };
};

/** Maps deployment cost phases onto the shared run-cost sum helpers. */
export const sumDeploymentCostParts = (costs: DeploymentCosts | null | undefined): number | null =>
  sumRunCostParts({
    sourceCost: costs?.totalTestCaseCost ?? null,
    metricsCost: costs?.totalMetricEvalCost ?? null,
  });

export const hasDeploymentCostFigure = (costs: DeploymentCosts | null | undefined): boolean =>
  hasRunCostFigure({
    sourceCost: costs?.totalTestCaseCost ?? null,
    metricsCost: costs?.totalMetricEvalCost ?? null,
  });

/**
 * Card / tooltip money: `$1,842` when whole dollars, cents only when non-zero (`$1,842.50`).
 */
export const formatGroupedMonthCost = (value: number): string => {
  const cents = Math.round(value * 100);
  const hasCents = cents % 100 !== 0;
  return (cents / 100).toLocaleString(GROUPING_LOCALE, {
    style: 'currency',
    currency: 'USD',
    currencyDisplay: 'narrowSymbol',
    minimumFractionDigits: hasCents ? 2 : 0,
    maximumFractionDigits: 2,
  });
};

/** Signed delta for the MoM badge (`+$214` / `-$214`); null when either side is missing or equal. */
export const formatMonthCostDelta = (latest: number | null, previous: number | null): string | null => {
  if (latest == null || previous == null) {
    return null;
  }
  const delta = latest - previous;
  if (delta === 0) {
    return null;
  }
  const absLabel = formatGroupedMonthCost(Math.abs(delta));
  return delta > 0 ? `+${absLabel}` : `-${absLabel}`;
};
