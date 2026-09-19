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
  RequestState,
  SpendPeriod,
  TimeSeriesView,
  UsageMeasures,
  UsageView,
} from '@/src/components/Analytics/Usage/models';
import {
  QueryScope,
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
import { buildSpendPeriods, getSpendRange, getSpendScale } from '@/src/components/Analytics/Usage/utils/spend-periods';
import { StructuredQuery, StructuredQueryResult } from '@/src/models/analytics/query';
import { ChartResolution } from '@/src/utils/time-filter/get-chart-resolution';

const pending = <T>(): RequestState<T> => ({ data: null, isLoading: true, hasFailed: false });
const failed = <T>(error?: string): RequestState<T> => ({ data: null, isLoading: false, hasFailed: true, error });
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
  timeSeriesView: TimeSeriesView;
  tabSearch?: string;
  /** Changing this re-issues every request; the manual refresh control increments it. */
  refreshToken: number;
}

export interface UsageDashboardData {
  totals: RequestState<UsageMeasures | null>;
  previousTotals: RequestState<UsageMeasures | null>;
  buckets: RequestState<BucketPoint[]>;
  previousBuckets: RequestState<BucketPoint[]>;
  donutRows: RequestState<BreakdownRow[]>;
  dimensionBuckets: RequestState<DimensionBucketPoint[]>;
  spendPeriods: RequestState<SpendPeriod[]>;
  tabRows: RequestState<BreakdownRow[]>;
  previousTabRows: RequestState<BreakdownRow[]>;
  isRefreshing: boolean;
}

export const useUsageDashboardData = ({
  view,
  windows,
  resolution,
  tab,
  tabLimit,
  donutLimit,
  timeSeriesView,
  tabSearch,
  refreshToken,
}: Params): UsageDashboardData => {
  const [totals, setTotals] = useState<RequestState<UsageMeasures | null>>(pending);
  const [previousTotals, setPreviousTotals] = useState<RequestState<UsageMeasures | null>>(loaded(null));
  const [buckets, setBuckets] = useState<RequestState<BucketPoint[]>>(pending);
  const [previousBuckets, setPreviousBuckets] = useState<RequestState<BucketPoint[]>>(loaded([]));
  const [donutRows, setDonutRows] = useState<RequestState<BreakdownRow[]>>(pending);
  const [dimensionBuckets, setDimensionBuckets] = useState<RequestState<DimensionBucketPoint[]>>(loaded([]));
  const [spendPeriods, setSpendPeriods] = useState<RequestState<SpendPeriod[]>>(loaded([]));
  const [tabRows, setTabRows] = useState<RequestState<BreakdownRow[]>>(pending);
  const [previousTabRows, setPreviousTabRows] = useState<RequestState<BreakdownRow[]>>(loaded([]));

  // A superseded response must not overwrite a newer one.
  const viewGeneration = useRef(0);
  const tabGeneration = useRef(0);
  const splitGeneration = useRef(0);
  const spendGeneration = useRef(0);
  const donutGeneration = useRef(0);

  const baseScope = useMemo(() => ({ view }), [view]);

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

    setBuckets(pending);
    setTotals(pending);
    const currentScope: QueryScope = { ...baseScope, window: windows.current };

    void runQuery(buildBucketedQuery(currentScope, resolution)).then(({ result, error }) => {
      if (!isCurrent()) return;
      setBuckets(result ? loaded(foldBucketPoints(result)) : failed(error));
    });

    void runQuery(buildTotalsQuery(currentScope)).then(({ result, error }) => {
      if (!isCurrent()) return;
      const row = result?.rows?.[0];
      setTotals(result ? loaded(row ? readMeasures(row) : null) : failed(error));
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
      setPreviousBuckets(result ? loaded(foldBucketPoints(result)) : failed(error));
    });

    void runQuery(buildTotalsQuery(previousScope)).then(({ result, error }) => {
      if (!isCurrent()) return;
      const row = result?.rows?.[0];
      setPreviousTotals(result ? loaded(row ? readMeasures(row) : null) : failed(error));
    });
  }, [baseScope, windows, resolution, refreshToken, runQuery]);

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
        result ? loaded(foldDimensionBuckets(result, BREAKDOWN_TAB_COLUMN[donutTab])) : failed(error),
      );
    });
    // `seriesKey` stands in for `seriesIds`, which is a fresh array on every response.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [baseScope, windows, resolution, donutTab, seriesKey, timeSeriesView, refreshToken, runQuery]);

  /**
   * The share chart names the view's leading dimension. Driving it from the breakdown tab made it
   * reload — and change meaning — every time the reader switched tabs below it, so it has its own
   * request; and its own effect, so widening it for the full-list dialog re-reads nothing else.
   */
  useEffect(() => {
    donutGeneration.current += 1;
    const generation = donutGeneration.current;
    const leadingTab = VIEW_BREAKDOWN_TABS[view][0];

    setDonutRows(pending);

    void runQuery(buildTabQuery({ ...baseScope, window: windows.current }, leadingTab, donutLimit)).then(
      ({ result, error }) => {
        if (generation !== donutGeneration.current) return;
        setDonutRows(result ? loaded(foldBreakdownRows(result, BREAKDOWN_TAB_COLUMN[leadingTab])) : failed(error));
      },
    );
  }, [baseScope, view, windows, donutLimit, refreshToken, runQuery]);

  useEffect(() => {
    spendGeneration.current += 1;
    const generation = spendGeneration.current;
    const isCurrent = () => generation === spendGeneration.current;

    if (timeSeriesView !== TimeSeriesView.Cost) {
      setSpendPeriods(loaded([]));
      return;
    }

    setSpendPeriods(pending);
    const scale = getSpendScale(windows.current);
    const range = getSpendRange(windows.current, scale);

    void runQuery(buildSpendBucketedQuery({ ...baseScope, window: range }, scale.unit)).then(({ result, error }) => {
      if (!isCurrent()) return;
      setSpendPeriods(
        result ? loaded(buildSpendPeriods(foldSpendBuckets(result), windows.current, scale)) : failed(error),
      );
    });
  }, [baseScope, windows, timeSeriesView, refreshToken, runQuery]);

  useEffect(() => {
    tabGeneration.current += 1;
    const generation = tabGeneration.current;
    const isCurrent = () => generation === tabGeneration.current;
    const column = BREAKDOWN_TAB_COLUMN[tab];

    setTabRows(pending);
    void runQuery(buildTabQuery({ ...baseScope, window: windows.current }, tab, tabLimit, tabSearch)).then(
      ({ result, error }) => {
        if (!isCurrent()) return;
        setTabRows(result ? loaded(foldBreakdownRows(result, column)) : failed(error));
      },
    );

    if (!windows.previous) {
      setPreviousTabRows(loaded([]));
      return;
    }

    setPreviousTabRows(pending);
    void runQuery(buildTabQuery({ ...baseScope, window: windows.previous }, tab, tabLimit, tabSearch)).then(
      ({ result, error }) => {
        if (!isCurrent()) return;
        setPreviousTabRows(result ? loaded(foldBreakdownRows(result, column)) : failed(error));
      },
    );
  }, [baseScope, windows, tab, tabLimit, tabSearch, refreshToken, runQuery]);

  // Every request the page has in flight, not just the ones behind the first widget: the control
  // re-enabling while a window is still arriving invites a second round of the same reads.
  const isRefreshing = [
    totals,
    previousTotals,
    buckets,
    previousBuckets,
    donutRows,
    dimensionBuckets,
    spendPeriods,
    tabRows,
    previousTabRows,
  ].some((request) => request.isLoading);

  return {
    totals,
    previousTotals,
    buckets,
    previousBuckets,
    donutRows,
    dimensionBuckets,
    spendPeriods,
    tabRows,
    previousTabRows,
    isRefreshing,
  };
};
