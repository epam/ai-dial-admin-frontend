import { render, screen } from '@testing-library/react';
import { describe, expect, test } from 'vitest';

import HeatMapCellTooltip from '@/src/components/Runs/Compare/HeatMap/HeatMapCellTooltip';
import { RunsI18nKey } from '@/src/constants/i18n';

const absoluteTooltip = {
  testCase: 'Row 020',
  metric: 'Context Appropriateness',
  input: 'Recall',
  runLabel: '[2] Run#315',
  valueRow: {
    value: '8.120',
    backgroundColor: '#32640b',
    borderColor: '#30e070',
  },
  valueLabelKey: RunsI18nKey.RunCompareHeatMapTooltipScore,
};

const deltaTooltip = {
  testCase: 'Row 006',
  metric: 'Context Appropriateness',
  input: 'Equality check',
  valueRow: {
    value: '+0.950',
    backgroundColor: '#32640b',
    borderColor: '#30e070',
  },
  valueLabelKey: RunsI18nKey.RunCompareHeatMapTooltipDelta,
};

describe('HeatMapCellTooltip', () => {
  test('renders absolute tooltip rows with run and score', () => {
    render(<HeatMapCellTooltip value={absoluteTooltip} {...({} as never)} />);

    expect(screen.getByText(RunsI18nKey.RunCompareHeatMapTooltipTestCase)).toBeInTheDocument();
    expect(screen.getByText(RunsI18nKey.RunCompareHeatMapTooltipMetric)).toBeInTheDocument();
    expect(screen.getByText(RunsI18nKey.RunCompareHeatMapTooltipInput)).toBeInTheDocument();
    expect(screen.getByText(RunsI18nKey.RunCompareHeatMapTooltipRun)).toBeInTheDocument();
    expect(screen.getByText(RunsI18nKey.RunCompareHeatMapTooltipScore)).toBeInTheDocument();
    expect(screen.getByText('Row 020')).toBeInTheDocument();
    expect(screen.getByText('Context Appropriateness')).toBeInTheDocument();
    expect(screen.getByText('Recall')).toBeInTheDocument();
    expect(screen.getByText('[2] Run#315')).toBeInTheDocument();
    expect(screen.getByText('8.120')).toBeInTheDocument();
  });

  test('renders delta tooltip without run row', () => {
    render(<HeatMapCellTooltip value={deltaTooltip} {...({} as never)} />);

    expect(screen.getByText(RunsI18nKey.RunCompareHeatMapTooltipDelta)).toBeInTheDocument();
    expect(screen.getByText('Row 006')).toBeInTheDocument();
    expect(screen.getByText('Equality check')).toBeInTheDocument();
    expect(screen.getByText('+0.950')).toBeInTheDocument();
    expect(screen.queryByText(RunsI18nKey.RunCompareHeatMapTooltipRun)).not.toBeInTheDocument();
  });

  test('renders zero delta tooltip with N/A and without swatch', () => {
    const { container } = render(
      <HeatMapCellTooltip
        value={{
          testCase: 'Row 006',
          metric: 'Context Appropriateness',
          input: 'Equality check',
          valueLabelKey: RunsI18nKey.RunCompareHeatMapTooltipDelta,
          valueTextKey: RunsI18nKey.RunCompareHeatMapNotApplicable,
        }}
        {...({} as never)}
      />,
    );

    expect(screen.getByText(RunsI18nKey.RunCompareHeatMapTooltipDelta)).toBeInTheDocument();
    expect(screen.getByText(RunsI18nKey.RunCompareHeatMapNotApplicable)).toBeInTheDocument();
    expect(container.querySelector('[aria-hidden="true"]')).not.toBeInTheDocument();
  });

  test('renders nothing when value is missing', () => {
    const { container } = render(<HeatMapCellTooltip value={undefined} {...({} as never)} />);

    expect(container).toBeEmptyDOMElement();
  });
});
