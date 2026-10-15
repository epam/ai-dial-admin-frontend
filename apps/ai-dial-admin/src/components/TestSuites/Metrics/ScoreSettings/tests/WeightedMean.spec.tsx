import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, test, vi } from 'vitest';

import { ButtonsI18nKey, TestSuitesI18nKey } from '@/src/constants/i18n';
import { Metric } from '@/src/models/evaluation/metric';
import { OverallScoreWeight } from '@/src/models/evaluation/test-suite';
import WeightedMean from '../WeightedMean';

vi.mock('../WeightRow', () => ({
  default: ({
    index,
    availableOptions,
    disableRemove,
    onUpdate,
    onRemove,
  }: {
    index: number;
    availableOptions: unknown[];
    disableRemove?: boolean;
    onUpdate: (row: OverallScoreWeight, index: number) => void;
    onRemove: (index: number) => void;
  }) => (
    <div>
      <span>{`row-${index}-options-${availableOptions.length}`}</span>
      <span>{`row-${index}-disableRemove-${Boolean(disableRemove)}`}</span>
      <button onClick={() => onUpdate({ metricName: 'A', outputField: 'score', weight: 1 }, index)}>
        {`update-${index}`}
      </button>
      <button onClick={() => onRemove(index)}>{`remove-${index}`}</button>
    </div>
  ),
}));

const metrics: Metric[] = [{ name: 'A' }, { name: 'B' }];

describe('WeightedMean', () => {
  test('renders the panel title and one row per weight', () => {
    const weights: OverallScoreWeight[] = [{ metricName: 'A', outputField: 'score', weight: 1 }];

    render(<WeightedMean weights={weights} metrics={metrics} onChange={vi.fn()} />);

    expect(screen.getByText(TestSuitesI18nKey.OverallScoreWeightedMean)).toBeInTheDocument();
    expect(screen.getByText('row-0-options-2')).toBeInTheDocument();
  });

  test('shows the at-least-one-metric hint when there are no rows', () => {
    render(<WeightedMean weights={[]} metrics={metrics} onChange={vi.fn()} />);

    expect(screen.getByText(TestSuitesI18nKey.OverallScoreAtLeastOneMetric)).toBeInTheDocument();
  });

  test('hides the at-least-one-metric hint once a row exists', () => {
    const weights: OverallScoreWeight[] = [{ metricName: 'A', outputField: 'score', weight: 1 }];

    render(<WeightedMean weights={weights} metrics={metrics} onChange={vi.fn()} />);

    expect(screen.queryByText(TestSuitesI18nKey.OverallScoreAtLeastOneMetric)).not.toBeInTheDocument();
  });

  test('clicking Add appends the next unused metric output with weight 1', async () => {
    const onChange = vi.fn();
    const weights: OverallScoreWeight[] = [{ metricName: 'A', outputField: 'score', weight: 1 }];

    render(<WeightedMean weights={weights} metrics={metrics} onChange={onChange} />);
    await userEvent.click(screen.getByRole('button', { name: ButtonsI18nKey.Add }));

    expect(onChange).toHaveBeenCalledWith([
      { metricName: 'A', outputField: 'score', weight: 1 },
      { metricName: 'B', outputField: 'score', weight: 1 },
    ]);
  });

  test('disables remove when only one row is selected', () => {
    const weights: OverallScoreWeight[] = [{ metricName: 'A', outputField: 'score', weight: 1 }];

    render(<WeightedMean weights={weights} metrics={metrics} onChange={vi.fn()} />);

    expect(screen.getByText('row-0-disableRemove-true')).toBeInTheDocument();
  });

  test('enables remove when more than one row is selected', () => {
    const weights: OverallScoreWeight[] = [
      { metricName: 'A', outputField: 'score', weight: 1 },
      { metricName: 'B', outputField: 'score', weight: 0.5 },
    ];

    render(<WeightedMean weights={weights} metrics={metrics} onChange={vi.fn()} />);

    expect(screen.getByText('row-0-disableRemove-false')).toBeInTheDocument();
    expect(screen.getByText('row-1-disableRemove-false')).toBeInTheDocument();
  });

  test('hides Add once every available output is selected', () => {
    const weights: OverallScoreWeight[] = [
      { metricName: 'A', outputField: 'score', weight: 1 },
      { metricName: 'B', outputField: 'score', weight: 0.5 },
    ];

    render(<WeightedMean weights={weights} metrics={metrics} onChange={vi.fn()} />);

    expect(screen.queryByRole('button', { name: ButtonsI18nKey.Add })).not.toBeInTheDocument();
  });

  test('shows Add when unused outputs remain', () => {
    const weights: OverallScoreWeight[] = [{ metricName: 'A', outputField: 'score', weight: 1 }];

    render(<WeightedMean weights={weights} metrics={metrics} onChange={vi.fn()} />);

    expect(screen.getByRole('button', { name: ButtonsI18nKey.Add })).toBeInTheDocument();
  });

  test('removing a row splices it out of the weights array', async () => {
    const onChange = vi.fn();
    const weights: OverallScoreWeight[] = [
      { metricName: 'A', outputField: 'score', weight: 1 },
      { metricName: 'B', outputField: 'score', weight: 0.5 },
    ];

    render(<WeightedMean weights={weights} metrics={metrics} onChange={onChange} />);
    await userEvent.click(screen.getByRole('button', { name: 'remove-0' }));

    expect(onChange).toHaveBeenCalledWith([weights[1]]);
  });

  test('excludes options already picked by other rows from each row', () => {
    const metricsWithThree: Metric[] = [{ name: 'A' }, { name: 'B' }, { name: 'C' }];
    const weights: OverallScoreWeight[] = [
      { metricName: 'A', outputField: 'score', weight: 1 },
      { metricName: '', outputField: '', weight: undefined as unknown as number },
    ];

    render(<WeightedMean weights={weights} metrics={metricsWithThree} onChange={vi.fn()} />);

    expect(screen.getByText('row-0-options-3')).toBeInTheDocument();
    expect(screen.getByText('row-1-options-2')).toBeInTheDocument();
  });
});
