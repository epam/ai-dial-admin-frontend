import { beforeEach, describe, expect, test, vi } from 'vitest';
import { render } from '@testing-library/react';
import ReactECharts from 'echarts-for-react';

import HealthDistributionChart from '@/src/components/EvalSystemHealth/HealthDistributionChart';
import { HealthDistributionBar } from '@/src/components/EvalSystemHealth/models';

const bars: HealthDistributionBar[] = [
  { weekStart: 1, label: 'Nov 3', healthyCount: 3, failingCount: 1, suiteCount: 4, healthyShare: 75, failingShare: 25 },
  {
    weekStart: 2,
    label: 'Nov 10',
    healthyCount: 1,
    failingCount: 1,
    suiteCount: 2,
    healthyShare: 50,
    failingShare: 50,
  },
];

describe('HealthDistributionChart', () => {
  const chartMock = vi.mocked(ReactECharts);

  beforeEach(() => {
    chartMock.mockClear();
  });

  test('hides the drawn chart from assistive technology', () => {
    const { container } = render(<HealthDistributionChart bars={bars} />);

    expect(container.firstElementChild?.getAttribute('aria-hidden')).toBe('true');
  });

  test('draws one stacked bar series pair over the weeks, with no label on a bar', () => {
    render(<HealthDistributionChart bars={bars} />);

    const { option } = chartMock.mock.calls[0][0] as { option: { xAxis: { data: string[] }; series: any[] } };
    expect(option.xAxis.data).toEqual(['Nov 3', 'Nov 10']);
    expect(option.series).toHaveLength(2);
    expect(option.series.map((series) => series.label.show)).toEqual([false, false]);
  });

  test('gives the chart a fixed height so the row does not move as it loads', () => {
    render(<HealthDistributionChart bars={bars} />);

    expect(chartMock.mock.calls[0][0].style).toMatchObject({ height: 320 });
  });
});
