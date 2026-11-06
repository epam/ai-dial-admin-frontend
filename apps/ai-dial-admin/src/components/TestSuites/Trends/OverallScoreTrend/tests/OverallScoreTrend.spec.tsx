import { render } from '@testing-library/react';
import ReactECharts from 'echarts-for-react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import OverallScoreTrend from '@/src/components/TestSuites/Trends/OverallScoreTrend/OverallScoreTrend';
import { TrendsRunPoint } from '@/src/components/TestSuites/Trends/models';

const PLOT_WIDTH_PX = 640;

const buildRun = (index: number): TrendsRunPoint =>
  ({
    runId: `run-${index}`,
    runName: `Run ${index}`,
    computedAtMs: index,
    overallScore: 0.5 + index / 10,
    overallScoreThreshold: index === 1 ? 0.6 : 0.5,
    isFailed: false,
  }) as TrendsRunPoint;

const RUN_ORDER = [0, 1, 2].map(buildRun);

describe('OverallScoreTrend', () => {
  const chartMock = vi.mocked(ReactECharts);

  beforeEach(() => {
    chartMock.mockClear();
    vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(PLOT_WIDTH_PX);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders the chart once, with the measured width already in its options', () => {
    render(<OverallScoreTrend runOrder={RUN_ORDER} isLoading={false} />);

    // A first render without the width would be re-applied mid-animation, so the chart would load twice.
    expect(chartMock).toHaveBeenCalledTimes(1);
  });

  it('does not render the chart while loading', () => {
    render(<OverallScoreTrend runOrder={RUN_ORDER} isLoading />);

    expect(chartMock).not.toHaveBeenCalled();
  });

  it('does not render the chart when no run has a score', () => {
    const unscored = RUN_ORDER.map((point) => ({ ...point, overallScore: null }));

    render(<OverallScoreTrend runOrder={unscored} isLoading={false} />);

    expect(chartMock).not.toHaveBeenCalled();
  });
});
