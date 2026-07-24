import { render } from '@testing-library/react';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import GaugeCard from '@/src/components/Deployments/Common/MetricCard/GaugeCard';

const echartsOptionMock = vi.fn();

// Override the global echarts-for-react stub (test-setup.tsx) for this file only, so the
// `option` GaugeCard builds — including its detail-label formatter — can be inspected.
vi.mock('echarts-for-react', () => ({
  __esModule: true,
  default: (props: { option: unknown }) => {
    echartsOptionMock(props.option);
    return <div data-mock="echarts" />;
  },
}));

describe('GaugeCard', () => {
  beforeEach(() => {
    echartsOptionMock.mockClear();
  });

  test('formats the center label as a percentage by default', () => {
    render(<GaugeCard title="Card" value={0.42} loading={false} />);
    const option = echartsOptionMock.mock.calls[0][0] as { series: [{ detail: { formatter: (v: number) => string } }] };
    expect(option.series[0].detail.formatter(0.42)).toBe('42%');
  });

  test('uses the detail override for the center label when provided', () => {
    render(<GaugeCard title="Card" value={0.25} loading={false} detail="5 / 20 GB" />);
    const option = echartsOptionMock.mock.calls[0][0] as { series: [{ detail: { formatter: (v: number) => string } }] };
    expect(option.series[0].detail.formatter(0.25)).toBe('5 / 20 GB');
  });
});
