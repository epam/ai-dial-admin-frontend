import { act, render, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import { BreakdownTab, ComparePeriod, UsageView } from '@/src/components/Analytics/Usage/models';
import { CALLS_ALIAS } from '@/src/components/Analytics/Usage/queries';
import UsageBlock from '@/src/components/Analytics/Usage/UsageBlock';
import { getBlockTabs, getEntityBlocks } from '@/src/components/Analytics/Usage/utils/entity-blocks';
import { buildEntityScope } from '@/src/components/Analytics/Usage/utils/entity-scope';
import { StructuredQuery } from '@/src/models/analytics/query';
import { ApplicationRoute } from '@/src/types/routes';

const runQueryMock = vi.fn();
const RUNNER = { runQuery: (...args: unknown[]) => runQueryMock(...args), runSql: vi.fn() };
vi.mock('@/src/components/Analytics/Common/use-analytics-query', () => ({
  useAnalyticsQuery: () => RUNNER,
}));

// The widgets are stand-ins: this spec is about which total each share is taken of.
const breakdownPropsSpy = vi.fn();
vi.mock('@/src/components/Analytics/Usage/Breakdown/BreakdownTable', () => ({
  default: (props: unknown) => {
    breakdownPropsSpy(props);
    return null;
  },
}));
const sharePropsSpy = vi.fn();
vi.mock('@/src/components/Analytics/Usage/Charts/ShareBreakdown', () => ({
  default: (props: unknown) => {
    sharePropsSpy(props);
    return null;
  },
}));
vi.mock('@/src/components/Analytics/Usage/Charts/TimeSeries', () => ({ default: () => null }));
vi.mock('@/src/components/Analytics/Usage/Charts/ActivityHeatmap', () => ({ default: () => null }));
vi.mock('@/src/components/Analytics/Usage/Kpi/KpiRow', () => ({ default: () => null }));

interface BreakdownProps {
  onTabChange: (tab: BreakdownTab) => void;
}

const OWN_CALLS = 2;
const MADE_CALLS = 6;

const WINDOWS = { current: { startDate: new Date('2026-01-01'), endDate: new Date('2026-01-02') } };
const NOTICE = { report: vi.fn(), reset: vi.fn() };

const isTotals = (query: StructuredQuery) => !query.group_by?.length;
const isMade = (query: StructuredQuery) => JSON.stringify(query.filter).includes('"name":"parent_deployment"');

const onTabChangeOfLastRender = () => (breakdownPropsSpy.mock.lastCall?.[0] as BreakdownProps).onTabChange;

const expectBreakdownTotal = (tab: BreakdownTab, windowTotal: number) =>
  expect(breakdownPropsSpy).toHaveBeenLastCalledWith(expect.objectContaining({ tab, windowTotal }));

const expectDonutTotal = (windowTotalCalls: number) =>
  expect(sharePropsSpy).toHaveBeenLastCalledWith(expect.objectContaining({ windowTotalCalls }));

const renderApplicationLlm = () => {
  const [llm] = getEntityBlocks(ApplicationRoute.Applications);

  render(
    <UsageBlock
      view={UsageView.Llm}
      reads={llm}
      scope={buildEntityScope(ApplicationRoute.Applications, 'rag') ?? { own: [] }}
      tabs={getBlockTabs(llm)}
      windows={WINDOWS}
      resolution={{ value: 1, unit: 'h' }}
      compare={ComparePeriod.Off}
      refreshToken={0}
      notice={NOTICE}
      onRefreshingChange={vi.fn()}
    />,
  );
};

beforeEach(() => {
  breakdownPropsSpy.mockReset();
  sharePropsSpy.mockReset();
  runQueryMock.mockReset();
  runQueryMock.mockImplementation(async (query: StructuredQuery) => ({
    isSuccess: true,
    result: { rows: isTotals(query) ? [{ [CALLS_ALIAS]: isMade(query) ? MADE_CALLS : OWN_CALLS }] : [] },
  }));
});

describe("UsageBlock on an application's LLM view", () => {
  test('takes the Models shares of the model calls it made, not of its own requests', async () => {
    renderApplicationLlm();

    await waitFor(() => expectBreakdownTotal(BreakdownTab.Models, MADE_CALLS));
    expectDonutTotal(MADE_CALLS);
  });

  test('takes the Projects shares of its own requests, while the donut keeps the models it called', async () => {
    renderApplicationLlm();
    await waitFor(() => expectBreakdownTotal(BreakdownTab.Models, MADE_CALLS));

    act(() => onTabChangeOfLastRender()(BreakdownTab.Projects));

    await waitFor(() => expectBreakdownTotal(BreakdownTab.Projects, OWN_CALLS));
    expectDonutTotal(MADE_CALLS);
  });
});
