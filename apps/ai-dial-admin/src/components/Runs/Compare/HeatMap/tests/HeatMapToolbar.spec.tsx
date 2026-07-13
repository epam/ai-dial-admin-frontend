import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, test, vi } from 'vitest';

import HeatMapToolbar from '@/src/components/Runs/Compare/HeatMap/HeatMapToolbar';
import { HeatMapColorDisplayMode } from '@/src/components/Runs/Compare/HeatMap/models';
import { BasicI18nKey, RunsI18nKey } from '@/src/constants/i18n';

const defaultProps = {
  availableMetricGroups: ['Accuracy', 'Quality'],
  selectedMetricGroups: new Set(['Accuracy', 'Quality']),
  onSelectedMetricGroupsChange: vi.fn(),
  colorDisplayMode: HeatMapColorDisplayMode.Absolute,
  onColorDisplayModeChange: vi.fn(),
};

const manyMetricGroups = [
  'Overall Accuracy',
  'Context Appropriateness',
  'Ragas: Tool Call Accuracy',
  'DIAL Success Indicator',
  'Precision Score',
  'F1 Measure',
  'Mean Absolute Error',
  'Area Under Curve',
];

describe('HeatMapToolbar', () => {
  test('renders metrics trigger with all-selected label', () => {
    render(<HeatMapToolbar {...defaultProps} />);

    expect(screen.getByText(RunsI18nKey.RunCompareHeatMapMetricsAll)).toBeInTheDocument();
    expect(screen.getByText(RunsI18nKey.RunCompareColorDisplay)).toBeInTheDocument();
  });

  test('disables metrics trigger when no groups are available', () => {
    render(<HeatMapToolbar {...defaultProps} availableMetricGroups={[]} selectedMetricGroups={new Set()} />);

    expect(screen.getByRole('button', { name: RunsI18nKey.RunCompareHeatMapMetricsAll })).toBeDisabled();
  });

  test('enables metrics trigger when groups are available', () => {
    render(<HeatMapToolbar {...defaultProps} />);

    expect(screen.getByRole('button', { name: RunsI18nKey.RunCompareHeatMapMetricsAll })).toBeEnabled();
  });

  test('shows count label when only some groups are selected', () => {
    render(<HeatMapToolbar {...defaultProps} selectedMetricGroups={new Set(['Accuracy'])} />);

    expect(screen.getByText(`${RunsI18nKey.RunCompareHeatMapMetricsPrefix} 1/2`)).toBeInTheDocument();
  });

  test('calls onSelectedMetricGroupsChange when toggling a metric group', async () => {
    const user = userEvent.setup();
    const onSelectedMetricGroupsChange = vi.fn();

    render(<HeatMapToolbar {...defaultProps} onSelectedMetricGroupsChange={onSelectedMetricGroupsChange} />);

    await user.click(screen.getByRole('button', { name: RunsI18nKey.RunCompareHeatMapMetricsAll }));
    await user.click(screen.getByRole('checkbox', { name: 'Quality' }));

    expect(onSelectedMetricGroupsChange).toHaveBeenCalledWith(new Set(['Accuracy']));
  });

  test('does not render search input when fewer than 8 metric groups are available', async () => {
    const user = userEvent.setup();

    render(<HeatMapToolbar {...defaultProps} />);

    await user.click(screen.getByRole('button', { name: RunsI18nKey.RunCompareHeatMapMetricsAll }));

    expect(screen.queryByPlaceholderText(BasicI18nKey.Search)).not.toBeInTheDocument();
  });

  test('renders search input when 8 or more metric groups are available', async () => {
    const user = userEvent.setup();

    render(
      <HeatMapToolbar
        {...defaultProps}
        availableMetricGroups={manyMetricGroups}
        selectedMetricGroups={new Set(manyMetricGroups)}
      />,
    );

    await user.click(screen.getByRole('button', { name: RunsI18nKey.RunCompareHeatMapMetricsAll }));

    expect(screen.getByPlaceholderText(BasicI18nKey.Search)).toBeInTheDocument();
  });

  test('filters visible metric checkboxes by search query', async () => {
    const user = userEvent.setup();

    render(
      <HeatMapToolbar
        {...defaultProps}
        availableMetricGroups={manyMetricGroups}
        selectedMetricGroups={new Set(manyMetricGroups)}
      />,
    );

    await user.click(screen.getByRole('button', { name: RunsI18nKey.RunCompareHeatMapMetricsAll }));
    await user.type(screen.getByPlaceholderText(BasicI18nKey.Search), 'precision');

    expect(screen.getByRole('checkbox', { name: 'Precision Score' })).toBeInTheDocument();
    expect(screen.queryByRole('checkbox', { name: 'F1 Measure' })).not.toBeInTheDocument();
  });
});
