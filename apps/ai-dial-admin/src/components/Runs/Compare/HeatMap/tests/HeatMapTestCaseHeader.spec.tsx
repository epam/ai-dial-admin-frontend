import { IHeaderParams } from 'ag-grid-community';
import { render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { describe, expect, test, vi } from 'vitest';

import {
  HEAT_MAP_HEADER_LABEL_VERTICAL_PADDING,
  HEAT_MAP_VALUE_TEXT_MIN_WIDTH,
} from '@/src/components/Runs/Compare/HeatMap/constants';
import HeatMapTestCaseHeader from '@/src/components/Runs/Compare/HeatMap/HeatMapTestCaseHeader';
import { measureVerticalHeatMapHeaderLabelHeight } from '@/src/components/Runs/Compare/HeatMap/utils/heat-map-layout';

vi.mock('@epam/ai-dial-ui-kit', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@epam/ai-dial-ui-kit')>();
  return {
    ...actual,
    DialEllipsisTooltip: ({ text, className }: { text: ReactNode; className?: string }) => (
      <span data-testid="ellipsis-tooltip" className={className}>
        {text}
      </span>
    ),
    DialTooltip: ({
      children,
      tooltip,
      hideTooltip,
      triggerClassName,
    }: {
      children: ReactNode;
      tooltip?: ReactNode;
      hideTooltip?: boolean;
      triggerClassName?: string;
    }) => (
      <span data-testid="dial-tooltip" data-hide-tooltip={String(!!hideTooltip)} className={triggerClassName}>
        {children}
        {!hideTooltip && <span data-testid="tooltip-content">{tooltip}</span>}
      </span>
    ),
  };
});

const createColumnMock = (width: number) => ({ getActualWidth: () => width });

type HeatMapTestCaseHeaderProps = IHeaderParams & { label?: string };

const createHeaderParams = (
  width: number,
  overrides: Partial<Pick<HeatMapTestCaseHeaderProps, 'label' | 'displayName' | 'api'>> = {},
): HeatMapTestCaseHeaderProps =>
  ({
    displayName: 'Row 001',
    label: 'Row 001',
    column: createColumnMock(width),
    api: { getGridOption: () => 0 },
    ...overrides,
  }) as unknown as HeatMapTestCaseHeaderProps;

describe('HeatMapTestCaseHeader', () => {
  test('renders horizontal header label via DialEllipsisTooltip when column is wide enough', () => {
    const { container } = render(<HeatMapTestCaseHeader {...createHeaderParams(HEAT_MAP_VALUE_TEXT_MIN_WIDTH)} />);

    expect(screen.getByTestId('ellipsis-tooltip')).toHaveTextContent('Row 001');
    expect(screen.queryByTestId('dial-tooltip')).not.toBeInTheDocument();
    expect(container.firstChild).not.toHaveStyle({ paddingBottom: '4px' });
  });

  test('renders vertical header label wrapped in DialTooltip when column is too narrow', () => {
    const { container } = render(<HeatMapTestCaseHeader {...createHeaderParams(HEAT_MAP_VALUE_TEXT_MIN_WIDTH - 1)} />);

    const tooltip = screen.getByTestId('dial-tooltip');
    expect(tooltip).toBeInTheDocument();
    expect(screen.getByTestId('tooltip-content')).toHaveTextContent('Row 001');
    expect(tooltip.querySelector('span')).toHaveStyle({
      writingMode: 'vertical-rl',
      fontSize: '10px',
      lineHeight: '12px',
    });
    expect(container.firstChild).toHaveStyle({ paddingTop: '4px', paddingBottom: '4px' });
  });

  test('hides vertical DialTooltip when label fits the header height', () => {
    const label = 'Row 001';
    const headerHeight = measureVerticalHeatMapHeaderLabelHeight(label) + HEAT_MAP_HEADER_LABEL_VERTICAL_PADDING;

    render(
      <HeatMapTestCaseHeader
        {...createHeaderParams(HEAT_MAP_VALUE_TEXT_MIN_WIDTH - 1, {
          label,
          displayName: label,
          api: { getGridOption: () => headerHeight },
        })}
      />,
    );

    expect(screen.getByTestId('dial-tooltip')).toHaveAttribute('data-hide-tooltip', 'true');
    expect(screen.queryByTestId('tooltip-content')).not.toBeInTheDocument();
    expect(screen.getByText(label)).toBeInTheDocument();
  });
});
