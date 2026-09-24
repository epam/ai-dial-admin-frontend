'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { executeQuery } from '@/src/app/[lang]/queries/actions';
import {
  BREAKDOWN_TAB_COLUMN,
  DONUT_SLICE_COUNT,
  VIEW_BREAKDOWN_TABS,
} from '@/src/components/Analytics/Usage/constants';
import {
  BreakdownRow,
  BreakdownTab,
  BucketPoint,
  ComparedWindows,
  DimensionBucketPoint,
  DonutMetric,
  RequestState,
  SpendBucket,
  TimeSeriesView,
  UsageMeasures,
  UsageView,
} from '@/src/components/Analytics/Usage/models';
import {
  CALLS_ALIAS,
  QueryScope,
  SPEND_ALIAS,
  buildBucketedQuery,
  buildDimensionBucketedQuery,
  buildSpendBucketedQuery,
  buildTabQuery,
  buildTotalsQuery,
} from '@/src/components/Analytics/Usage/queries';
import {
  foldBreakdownRows,
  foldBucketPoints,
  foldDimensionBuckets,
  foldSpendBuckets,
  readMeasures,
} from '@/src/components/Analytics/Usage/utils/folds';
import { padSpendBuckets } from '@/src/components/Analytics/Usage/utils/buckets';
import { getSpendResolution } from '@/src/components/Analytics/Usage/utils/spend-resolution';
import { StructuredQuery, StructuredQueryResult } from '@/src/models/analytics/query';
import { ChartResolution } from '@/src/utils/time-filter/get-chart-resolution';
import { LoadFailureNotice } from '@/src/components/Analytics/Usage/use-load-failure-notice';

const pending = <T>(): RequestState<T> => ({ data: null, isLoading: true, hasFailed: false });
const failed = <T>(): RequestState<T> => ({ data: null, isLoading: false, hasFailed: true });
const loaded = <T>(data: T): RequestState<T> => ({ data, isLoading: false, hasFailed: false });

interface QueryOutcome {
  result: StructuredQueryResult | null;
  error?: string;
}

interface Params {
  view: UsageView;
  windows: ComparedWindows;
  resolution: ChartResolution;
  tab: BreakdownTab;
  tabLimit: number;
  donutLimit: number;
  /** Ranking the donut on spend is a different top-N, so it is a different request. */
  donutMetric: DonutMetric;
  timeSeriesView: TimeSeriesView;
  /** Changing this re-issues every request; the manual refresh control increments it. */
  refreshToken: number;
  /** Shared with the heatmap's hook, so one outage is one notification. */
  notice: LoadFailureNotice;
}

export interface UsageDashboardData {
  totals: RequestState<UsageMeasures | null>;
  previousTotals: RequestState<UsageMeasures | null>;
  buckets: RequestState<BucketPoint[]>;
  previousBuckets: RequestState<BucketPoint[]>;
  donutRows: RequestState<BreakdownRow[]>;
  /** Which measure `donutRows` was ranked by; it lags the selection while a re-ranking is read. */
  donutRowsMetric: DonutMetric;
  dimensionBuckets: RequestState<DimensionBucketPoint[]>;
  spendBuckets: RequestState<SpendBucket[]>;
  tabRows: RequestState<BreakdownRow[]>;
  previousTabRows: RequestState<BreakdownRow[]>;
  /** A widened donut limit is read without clearing the rows, so it says it is reading separately. */
  isDonutReadingMore: boolean;
  isRefreshing: boolean;
}

export const useUsageDashboardData = ({
  view,
  windows,
  resolution,
  tab,
  tabLimit,
  donutLimit,
  donutMetric,
  timeSeriesView,
  refreshToken,
  notice,
}: Params): UsageDashboardData => {
  const { report, reset } = notice;

  const [totals, setTotals] = useState<RequestState<UsageMeasures | null>>(pending);
  const [previousTotals, setPreviousTotals] = useState<RequestState<UsageMeasures | null>>(loaded(null));
  const [buckets, setBuckets] = useState<RequestState<BucketPoint[]>>(pending);
  const [previousBuckets, setPreviousBuckets] = useState<RequestState<BucketPoint[]>>(loaded([]));
  const [donutRows, setDonutRows] = useState<RequestState<BreakdownRow[]>>(pending);
  /**
   * The measure the rows on screen were ranked by, which lags the selected one while a re-ranking
   * is in flight. The card reads by this rather than by the selection, so switching the measure
   * neither empties the ring — which collapsed the card and moved every widget below it — nor
   * states the old rows' figures under the new measure's name.
   */
  const [donutRowsMetric, setDonutRowsMetric] = useState<DonutMetric>(donutMetric);
  const [isDonutReadingMore, setIsDonutReadingMore] = useState(false);
  const [dimensionBuckets, setDimensionBuckets] = useState<RequestState<DimensionBucketPoint[]>>(loaded([]));
  const [spendBuckets, setSpendBuckets] = useState<RequestState<SpendBucket[]>>(loaded([]));
  const [tabRows, setTabRows] = useState<RequestState<BreakdownRow[]>>(pending);
  const [previousTabRows, setPreviousTabRows] = useState<RequestState<BreakdownRow[]>>(loaded([]));

  // A superseded response must not overwrite a newer one.
  const viewGeneration = useRef(0);
  const tabGeneration = useRef(0);
  const splitGeneration = useRef(0);
  const spendGeneration = useRef(0);
  const donutGeneration = useRef(0);
  /** What the donut is reading, apart from how many rows of it: a change here empties the rows. */
  const donutScope = [view, windows.current.startDate.getTime(), windows.current.endDate.getTime(), refreshToken].join(
    '|',
  );
  const donutScopeKey = useRef(donutScope);

  const baseScope = useMemo(() => ({ view }), [view]);

  /** A failure states itself once, in a notification; the widget it feeds falls back to empty. */
  const reportFailed = useCallback(
    <T>(error?: string): RequestState<T> => {
      report(error);

      return failed<T>();
    },
    [report],
  );

  /**
   * Never rejects. A transport failure would otherwise become an unhandled rejection with no
   * `.then` to run, leaving the widget that asked for it on its skeleton for good.
   */
  const runQuery = useCallback(async (query: StructuredQuery): Promise<QueryOutcome> => {
    try {
      const response = await executeQuery(query);

      if (response?.success) {
        return { result: response.response ?? null };
      }

      return { result: null, error: response?.errorMessage ?? response?.errorHeader };
    } catch (error) {
      return { result: null, error: error instanceof Error ? error.message : void 0 };
    }
  }, []);

  useEffect(() => {
    viewGeneration.current += 1;
    const generation = viewGeneration.current;
    const isCurrent = () => generation === viewGeneration.current;

    reset();
    setBuckets(pending);
    setTotals(pending);
    const currentScope: QueryScope = { ...baseScope, window: windows.current };

    void runQuery(buildBucketedQuery(currentScope, resolution)).then(({ result, error }) => {
      if (!isCurrent()) return;
      setBuckets(result ? loaded(foldBucketPoints(result)) : reportFailed(error));
    });

    void runQuery(buildTotalsQuery(currentScope)).then(({ result, error }) => {
      if (!isCurrent()) return;
      const row = result?.rows?.[0];
      setTotals(result ? loaded(row ? readMeasures(row) : null) : reportFailed(error));
    });

    if (!windows.previous) {
      setPreviousBuckets(loaded([]));
      setPreviousTotals(loaded(null));
      return;
    }

    const previousScope: QueryScope = { ...baseScope, window: windows.previous };
    setPreviousBuckets(pending);
    setPreviousTotals(pending);

    void runQuery(buildBucketedQuery(previousScope, resolution)).then(({ result, error }) => {
      if (!isCurrent()) return;
      setPreviousBuckets(result ? loaded(foldBucketPoints(result)) : reportFailed(error));
    });

    void runQuery(buildTotalsQuery(previousScope)).then(({ result, error }) => {
      if (!isCurrent()) return;
      const row = result?.rows?.[0];
      setPreviousTotals(result ? loaded(row ? readMeasures(row) : null) : reportFailed(error));
    });
  }, [baseScope, windows, resolution, refreshToken, runQuery, reset, reportFailed]);

  // The stack plots the same entities the share chart names, so it waits for that ranking rather
  // than ranking again — and it is issued only while the split view is the one being read.
  const donutTab = VIEW_BREAKDOWN_TABS[view][0];
  const seriesIds = useMemo(
    () => (donutRows.data ?? []).slice(0, DONUT_SLICE_COUNT).map((row) => row.id),
    [donutRows.data],
  );
  const seriesKey = seriesIds.join('\u0000');

  useEffect(() => {
    splitGeneration.current += 1;
    const generation = splitGeneration.current;
    const isCurrent = () => generation === splitGeneration.current;

    if (timeSeriesView !== TimeSeriesView.ByDimension || seriesIds.length === 0) {
      setDimensionBuckets(loaded([]));
      return;
    }

    setDimensionBuckets(pending);
    void runQuery(
      buildDimensionBucketedQuery({ ...baseScope, window: windows.current }, resolution, donutTab, seriesIds),
    ).then(({ result, error }) => {
      if (!isCurrent()) return;
      setDimensionBuckets(
        result ? loaded(foldDimensionBuckets(result, BREAKDOWN_TAB_COLUMN[donutTab])) : reportFailed(error),
      );
    });
    // `seriesKey` stands in for `seriesIds`, which is a fresh array on every response.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [baseScope, windows, resolution, donutTab, seriesKey, timeSeriesView, refreshToken, runQuery, reportFailed]);

  /**
   * The share chart names the view's leading dimension. Driving it from the breakdown tab made it
   * reload — and change meaning — every time the reader switched tabs below it, so it has its own
   * request; and its own effect, so widening it for the full-list dialog re-reads nothing else.
   *
   * Widening the limit keeps the rows already on screen. The response feeds the ring and the split
   * plot, and clearing it put both back on their skeletons every time the dialog read a further
   * block — the widgets below flashed while nothing about them had changed.
   */
  useEffect(() => {
    donutGeneration.current += 1;
    const generation = donutGeneration.current;
    const leadingTab = VIEW_BREAKDOWN_TABS[view][0];
    const isSameScope = donutScopeKey.current === donutScope;
    donutScopeKey.current = donutScope;

    if (isSameScope) {
      setIsDonutReadingMore(true);
    } else {
      // A new scope empties the rows, so the widget is loading rather than reading further: leaving
      // the flag set drew a skeleton and a "reading more" spinner at once.
      setIsDonutReadingMore(false);
      setDonutRows(pending);
    }

    void runQuery(
      buildTabQuery({ ...baseScope, window: windows.current }, leadingTab, donutLimit, {
        orderBy: donutMetric === DonutMetric.Cost ? SPEND_ALIAS : CALLS_ALIAS,
      }),
    ).then(({ result, error }) => {
      if (generation !== donutGeneration.current) return;
      setIsDonutReadingMore(false);
      setDonutRowsMetric(donutMetric);
      setDonutRows(result ? loaded(foldBreakdownRows(result, BREAKDOWN_TAB_COLUMN[leadingTab])) : reportFailed(error));
    });
    // `donutScope` is read through a ref, so it is not a dependency of its own effect.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [baseScope, view, donutMetric, windows, donutLimit, refreshToken, runQuery, reportFailed]);

  useEffect(() => {
    spendGeneration.current += 1;
    const generation = spendGeneration.current;
    const isCurrent = () => generation === spendGeneration.current;

    if (timeSeriesView !== TimeSeriesView.Cost) {
      setSpendBuckets(loaded([]));
      return;
    }

    setSpendBuckets(pending);
    const spendResolution = getSpendResolution(windows.current);

    void runQuery(buildSpendBucketedQuery({ ...baseScope, window: windows.current }, spendResolution)).then(
      ({ result, error }) => {
        if (!isCurrent()) return;
        setSpendBuckets(
          result
            ? loaded(padSpendBuckets(foldSpendBuckets(result), windows.current, spendResolution))
            : reportFailed(error),
        );
      },
    );
  }, [baseScope, windows, timeSeriesView, refreshToken, runQuery, reportFailed]);

  useEffect(() => {
    tabGeneration.current += 1;
    const generation = tabGeneration.current;
    const isCurrent = () => generation === tabGeneration.current;
    const column = BREAKDOWN_TAB_COLUMN[tab];

    setTabRows(pending);
    void runQuery(buildTabQuery({ ...baseScope, window: windows.current }, tab, tabLimit)).then(({ result, error }) => {
      if (!isCurrent()) return;
      setTabRows(result ? loaded(foldBreakdownRows(result, column)) : reportFailed(error));
    });

    if (!windows.previous) {
      setPreviousTabRows(loaded([]));
      return;
    }

    setPreviousTabRows(pending);
    void runQuery(buildTabQuery({ ...baseScope, window: windows.previous }, tab, tabLimit)).then(
      ({ result, error }) => {
        if (!isCurrent()) return;
        setPreviousTabRows(result ? loaded(foldBreakdownRows(result, column)) : reportFailed(error));
      },
    );
  }, [baseScope, windows, tab, tabLimit, refreshToken, runQuery, reportFailed]);

  // Every request the page has in flight, not just the ones behind the first widget: the control
  // re-enabling while a window is still arriving invites a second round of the same reads.
  const isRefreshing = [
    totals,
    previousTotals,
    buckets,
    previousBuckets,
    donutRows,
    dimensionBuckets,
    spendBuckets,
    tabRows,
    previousTabRows,
  ].some((request) => request.isLoading);

  return {
    totals,
    previousTotals,
    buckets,
    previousBuckets,
    donutRows,
    donutRowsMetric,
    dimensionBuckets,
    spendBuckets,
    tabRows,
    previousTabRows,
    isDonutReadingMore,
    isRefreshing,
  };
};
