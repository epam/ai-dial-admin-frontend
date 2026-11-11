import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, test, vi } from 'vitest';

import { RowDetailField } from '@/src/components/Runs/Details/RowDetails/models';
import { MetricDeltaKind } from '@/src/components/Runs/Compare/ExecutionResults/utils/metric-utils';
import PivotValueCell from '../PivotValueCell';

vi.mock('@/src/components/Runs/View/RowDetails/FullscreenValueViewer', () => ({
  default: ({ fieldLabel, value }: { fieldLabel: string; value: string }) => (
    <div role="dialog" aria-label={fieldLabel}>
      {value}
    </div>
  ),
}));

const field = (fieldKey: string, overrides: Partial<RowDetailField> = {}): RowDetailField => ({
  fieldKey,
  label: fieldKey,
  primaryRaw: '200',
  secondaryRaw: null,
  diffKind: MetricDeltaKind.Empty,
  isNumeric: true,
  isScoreIndicator: false,
  isMetric: false,
  ...overrides,
});

const getOpenButton = () =>
  screen.getAllByRole('button').find((button) => button.getAttribute('aria-haspopup') === 'dialog') as HTMLElement;

describe('PivotValueCell', () => {
  test('right-aligns the HTTP field', () => {
    render(<PivotValueCell field={field('httpStatusCode')} />);

    expect(getOpenButton()).toHaveClass('justify-end', 'text-right');
  });

  test('right-aligns the run number field', () => {
    render(<PivotValueCell field={field('runNumber', { isNumeric: false })} />);

    expect(getOpenButton()).toHaveClass('justify-end', 'text-right');
  });

  test('right-aligns the duration field', () => {
    render(<PivotValueCell field={field('execDurationMs')} />);

    expect(getOpenButton()).toHaveClass('justify-end', 'text-right');
  });

  test('right-aligns a metric field rendered as a score value', () => {
    render(<PivotValueCell field={field('Accuracy_precision', { isScoreIndicator: true, primaryRaw: '0.8' })} />);

    expect(getOpenButton()).toHaveClass('justify-end', 'text-right');
  });

  test('drops the cell padding so a score fills the cell', () => {
    render(<PivotValueCell field={field('Accuracy_precision', { isScoreIndicator: true, primaryRaw: '0.8' })} />);

    const button = getOpenButton();
    expect(button).toHaveClass('p-0');
    expect(button).not.toHaveClass('p-3');
    expect(screen.getByText('0.800')).toHaveClass('bg-score-abs-09');
  });

  test('draws no right or bottom border around a score, so adjacent scores read as one field', () => {
    render(<PivotValueCell field={field('Accuracy_precision', { isScoreIndicator: true, primaryRaw: '0.8' })} />);

    expect(getOpenButton()).toHaveClass('border-r-0', 'border-b-0');
  });

  test('still draws the diff wrapper border around a score', () => {
    render(
      <PivotValueCell
        field={field('Accuracy_precision', { isScoreIndicator: true, primaryRaw: '0.8' })}
        className="border-solid border-l border-r border-b border-accent-primary"
      />,
    );

    const button = getOpenButton();
    expect(button).toHaveClass('border-r', 'border-b');
    expect(button).not.toHaveClass('border-r-0', 'border-b-0');
  });

  test('keeps the cell padding for a failed score field', () => {
    render(
      <PivotValueCell field={field('Accuracy_precision', { isScoreIndicator: true, primaryRaw: null })} isFailed />,
    );

    expect(getOpenButton()).toHaveClass('p-3');
  });

  test('leaves an unrelated field left-aligned, even a numeric one', () => {
    render(<PivotValueCell field={field('score')} />);

    const button = getOpenButton();
    expect(button).toHaveClass('text-left');
    expect(button).not.toHaveClass('justify-end');
  });

  test('keeps the open-popup action working for a long value', async () => {
    const longValue = 'x'.repeat(2000);
    render(<PivotValueCell field={field('responseBody')} raw={longValue} />);

    await userEvent.click(getOpenButton());

    expect(screen.getByRole('dialog', { name: 'responseBody' })).toHaveTextContent(longValue);
  });

  test('opens the score view with reason and logs for a metric field', async () => {
    render(
      <PivotValueCell
        field={field('precision', {
          isMetric: true,
          isScoreIndicator: true,
          primaryRaw: '0.5',
          primaryInfo: { reason: 'Low overlap', logs: 'verbose details', error: null },
        })}
      />,
    );

    await userEvent.click(screen.getByRole('button', { name: /0\.500/ }));

    expect(screen.getByText('Runs.MetricScoreLabel')).toBeInTheDocument();
    expect(screen.getByText('Low overlap')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Runs.MetricLogs' })).toBeInTheDocument();
  });

  test('keeps the plain value viewer for a field that is not a metric', async () => {
    render(<PivotValueCell field={field('responseBody')} raw="body" />);

    await userEvent.click(getOpenButton());

    expect(screen.getByRole('dialog', { name: 'responseBody' })).toHaveTextContent('body');
    expect(screen.queryByText('Runs.MetricScoreLabel')).toBeNull();
  });

  test('calls onOpenFullscreen instead of the default popup when provided', async () => {
    const onOpenFullscreen = vi.fn();
    const longValue = 'x'.repeat(2000);
    render(<PivotValueCell field={field('responseBody')} raw={longValue} onOpenFullscreen={onOpenFullscreen} />);

    await userEvent.click(getOpenButton());

    expect(onOpenFullscreen).toHaveBeenCalledOnce();
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  describe('long content', () => {
    test('scrolls inside the cell when it does not fit', () => {
      const { container } = render(<PivotValueCell field={field('answer', { primaryRaw: 'a long value' })} />);

      expect(container.querySelector('.overflow-y-auto')).toBeTruthy();
    });

    test('keeps the cell at its own height instead of growing with the content', () => {
      render(<PivotValueCell field={field('answer', { primaryRaw: 'x '.repeat(2000) })} />);

      expect(getOpenButton()).toHaveClass('h-full', 'overflow-hidden');
    });

    test('keeps the whole value in the cell instead of ending it with an ellipsis', () => {
      render(<PivotValueCell field={field('answer', { primaryRaw: 'a long value' })} />);

      const text = screen.getByText('a long value');
      expect(text.className).not.toMatch(/line-clamp/);
      expect(text.style.getPropertyValue('-webkit-line-clamp')).toBe('');
    });

    test('keeps the heat-map fill of a score cell', () => {
      render(
        <PivotValueCell
          field={field('Accuracy_precision', { isMetric: true, isScoreIndicator: true, primaryRaw: '0.8' })}
        />,
      );

      expect(screen.getByText('0.800')).toHaveClass('bg-score-abs-09');
    });
  });

  describe('opening', () => {
    test('is one button announcing a dialog, whether the cell holds text, a score or the status', () => {
      render(
        <>
          <PivotValueCell field={field('answer', { primaryRaw: 'text' })} />
          <PivotValueCell field={field('score', { isMetric: true, isScoreIndicator: true, primaryRaw: '0.8' })} />
          <PivotValueCell field={field('executionStatus', { primaryRaw: 'COMPLETED' })} />
        </>,
      );

      const buttons = screen
        .getAllByRole('button')
        .filter((button) => button.getAttribute('aria-haspopup') === 'dialog');
      expect(buttons).toHaveLength(3);
    });

    test('shows the open icon on keyboard focus as well as on hover, hidden from assistive technology', () => {
      render(<PivotValueCell field={field('answer', { primaryRaw: 'text' })} />);

      const icon = getOpenButton().querySelector('[aria-hidden="true"]');
      expect(icon).toHaveClass('group-hover:opacity-100', 'group-focus-visible:opacity-100');
    });

    test('opens from the keyboard with Enter and Space', async () => {
      const user = userEvent.setup();
      render(<PivotValueCell field={field('responseBody', { primaryRaw: 'body' })} />);

      await user.tab();
      await user.keyboard('{Enter}');

      expect(screen.getByRole('dialog', { name: 'responseBody' })).toBeInTheDocument();
    });

    test('opens the text popup for a short value and the status as well', async () => {
      render(<PivotValueCell field={field('executionStatus', { primaryRaw: 'COMPLETED' })} />);

      await userEvent.click(getOpenButton());

      expect(screen.getByRole('dialog', { name: 'executionStatus' })).toHaveTextContent('COMPLETED');
    });
  });
});

describe('PivotValueCell copy', () => {
  test('copies the full value without opening the popup', async () => {
    const user = userEvent.setup();
    const longValue = 'x'.repeat(2000);
    render(<PivotValueCell field={field('responseBody')} raw={longValue} />);

    await user.click(screen.getByRole('button', { name: 'copy responseBody' }));

    expect(await navigator.clipboard.readText()).toBe(longValue);
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  test('offers no copy for a metric, a score, a failed value or an empty value', () => {
    render(
      <>
        <PivotValueCell field={field('metric', { isMetric: true, isScoreIndicator: true, primaryRaw: '0.8' })} />
        <PivotValueCell field={field('overall', { isScoreIndicator: true, primaryRaw: '0.8' })} />
        <PivotValueCell field={field('failed', { primaryRaw: 'text' })} isFailed />
        <PivotValueCell field={field('empty', { primaryRaw: null })} />
      </>,
    );

    expect(screen.queryByRole('button', { name: /^copy/ })).toBeNull();
  });
});

describe('PivotValueCell overall score threshold', () => {
  const score = (overrides: Partial<RowDetailField> = {}) =>
    field('overallScore', { primaryRaw: '0.7', secondaryRaw: '0.5', ...overrides });

  test('shows the icon after the value for a row whose primary threshold is set', () => {
    const { container } = render(<PivotValueCell field={score({ primaryThreshold: 0.6 })} />);

    expect(screen.getByText('Runs.TestCaseOverallScoreAboveThresholdTooltip')).toBeInTheDocument();
    expect(container.querySelector('svg.text-score-abs-11')).toBeInTheDocument();
  });

  test('takes an explicit threshold over the field’s, so a compared run reads against its own', () => {
    render(<PivotValueCell field={score({ primaryThreshold: 0.6 })} raw="0.5" threshold={0.8} />);

    expect(screen.getByText('Runs.TestCaseOverallScoreBelowThresholdTooltip')).toBeInTheDocument();
  });

  test('shows no icon without a threshold', () => {
    const { container } = render(<PivotValueCell field={score()} />);

    expect(screen.getByText('0.7')).toBeInTheDocument();
    expect(container.querySelector('svg.text-score-abs-11, svg.text-score-abs-00')).not.toBeInTheDocument();
  });

  test('right-aligns the overall score like the other short figures', () => {
    render(<PivotValueCell field={score()} />);

    expect(getOpenButton()).toHaveClass('justify-end', 'text-right');
  });
});
