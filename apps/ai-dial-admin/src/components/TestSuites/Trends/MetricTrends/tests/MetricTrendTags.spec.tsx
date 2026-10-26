import { beforeEach, describe, expect, test, vi } from 'vitest';
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import MetricTrendTags from '@/src/components/TestSuites/Trends/MetricTrends/MetricTrendTags';
import { TREND_TAG_PALETTE_DARK } from '@/src/components/TestSuites/Trends/constants';
import { MetricTrendSeries } from '@/src/components/TestSuites/Trends/models';
import { ButtonsI18nKey } from '@/src/constants/i18n';

describe('MetricTrendTags', () => {
  const onToggleSeries = vi.fn();

  const twoSeries: MetricTrendSeries[] = [
    { name: 'faithfulness', color: '#30E070', values: [0.5] },
    { name: 'precision', color: '#D4BE3A', values: [0.4] },
  ];

  const oneSeries: MetricTrendSeries[] = [{ name: 'faithfulness', color: '#30E070', values: [0.5] }];

  beforeEach(() => {
    onToggleSeries.mockClear();
  });

  test('caps max width only when there is more than one tag', () => {
    const { rerender, container } = render(
      <MetricTrendTags
        series={oneSeries}
        tagPalette={TREND_TAG_PALETTE_DARK}
        hiddenSeries={new Set()}
        onToggleSeries={onToggleSeries}
      />,
    );

    const single = screen.getByRole('button', { name: 'faithfulness' });
    expect(single.style.maxWidth).toBe('');

    rerender(
      <MetricTrendTags
        series={twoSeries}
        tagPalette={TREND_TAG_PALETTE_DARK}
        hiddenSeries={new Set()}
        onToggleSeries={onToggleSeries}
      />,
    );

    const multi = container.querySelectorAll('[aria-pressed]');
    expect(multi).toHaveLength(2);
    multi.forEach((chip) => {
      expect((chip as HTMLElement).style.maxWidth).toBe('116px');
    });
  });

  test('toggles series visibility on click', async () => {
    const user = userEvent.setup();
    render(
      <MetricTrendTags
        series={twoSeries}
        tagPalette={TREND_TAG_PALETTE_DARK}
        hiddenSeries={new Set()}
        onToggleSeries={onToggleSeries}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'faithfulness' }));
    expect(onToggleSeries).toHaveBeenCalledWith('faithfulness');
  });

  test('shows scroll arrows only when the row overflows', () => {
    const { container, rerender } = render(
      <MetricTrendTags
        series={twoSeries}
        tagPalette={TREND_TAG_PALETTE_DARK}
        hiddenSeries={new Set()}
        onToggleSeries={onToggleSeries}
      />,
    );

    const scrollEl = container.querySelector('.overflow-x-auto') as HTMLDivElement;
    Object.defineProperty(scrollEl, 'clientWidth', { configurable: true, value: 200 });
    Object.defineProperty(scrollEl, 'scrollWidth', { configurable: true, value: 200 });

    act(() => {
      scrollEl.dispatchEvent(new Event('scroll'));
    });

    expect(screen.queryByRole('button', { name: ButtonsI18nKey.Previous })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: ButtonsI18nKey.Next })).not.toBeInTheDocument();

    Object.defineProperty(scrollEl, 'scrollWidth', { configurable: true, value: 400 });
    Object.defineProperty(scrollEl, 'scrollLeft', { configurable: true, value: 0 });

    act(() => {
      scrollEl.dispatchEvent(new Event('scroll'));
    });

    // ResizeObserver may not fire in jsdom — force update via re-render + scroll.
    rerender(
      <MetricTrendTags
        series={twoSeries}
        tagPalette={TREND_TAG_PALETTE_DARK}
        hiddenSeries={new Set()}
        onToggleSeries={onToggleSeries}
      />,
    );
    act(() => {
      scrollEl.dispatchEvent(new Event('scroll'));
    });

    expect(screen.getByRole('button', { name: ButtonsI18nKey.Previous })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: ButtonsI18nKey.Next })).toBeInTheDocument();
  });

  test('applies solid fill and stroke from the palette', () => {
    render(
      <MetricTrendTags
        series={[{ name: 'g-Eval', color: '#E5764A', values: [0.5] }]}
        tagPalette={TREND_TAG_PALETTE_DARK}
        hiddenSeries={new Set()}
        onToggleSeries={onToggleSeries}
      />,
    );

    const chip = screen.getByRole('button', { name: 'g-Eval' });
    expect(chip.style.borderColor).toBe('rgb(229, 118, 74)');
    expect(chip.style.getPropertyValue('--tag-bg')).toBe('#2B0F04');
    expect(chip.style.getPropertyValue('--tag-bg-hover')).toBe('#59210A');
  });
});
